import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-everpay-api-key, x-idempotency-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/**
 * Everpay API v2 — RESTful merchant gateway
 *
 * All endpoints mirror https://api.everpayinc.com/v2/*
 *
 * Auth: Bearer <JWT> or X-Everpay-Api-Key: <merchant_api_key>
 *
 * Routes:
 *   POST   /payments              — Create a payment
 *   GET    /payments/:id          — Retrieve a payment
 *   POST   /payments/:id/refund   — Refund a payment
 *   POST   /payments/:id/capture  — Capture an authorized payment
 *   GET    /transactions          — List transactions
 *   GET    /transactions/:id      — Get transaction detail
 *   POST   /refunds               — Create a refund
 *   GET    /refunds               — List refunds
 *   GET    /refunds/:id           — Get refund detail
 *   GET    /customers             — List customers
 *   POST   /customers             — Create a customer
 *   GET    /customers/:id         — Get customer detail
 *   GET    /disputes              — List disputes
 *   GET    /disputes/:id          — Get dispute detail
 *   POST   /payment-intents       — Create a payment intent
 *   GET    /payment-intents/:id   — Get payment intent
 *   POST   /webhooks/endpoints    — Register a webhook endpoint
 *   GET    /webhooks/endpoints    — List webhook endpoints
 *   DELETE /webhooks/endpoints/:id — Delete a webhook endpoint
 *   GET    /balance               — Get account balances
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // ─── Authenticate ───
  let merchantId: string | null = null;

  const authHeader = req.headers.get('Authorization');
  const apiKey = req.headers.get('X-Everpay-Api-Key');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (merchant) merchantId = merchant.id;
    }
  } else if (apiKey) {
    // Hash the API key and match against stored hashes
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(apiKey));
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('api_key_hash', hashHex)
      .single();
    if (merchant) merchantId = merchant.id;
  }

  if (!merchantId) {
    return json(401, { error: { code: 'unauthorized', message: 'Invalid or missing authentication' } });
  }

  // ─── Parse route ───
  const url = new URL(req.url);
  // Extract path after the function name — handles both /api-v2/payments and /v2/payments
  const pathParts = url.pathname.replace(/^\/api-v2/, '').replace(/^\/v2/, '').split('/').filter(Boolean);
  const method = req.method;
  const resource = pathParts[0] || '';
  const resourceId = pathParts[1] || '';
  const subResource = pathParts[2] || '';

  try {
    // ═══════════════════════════════════════
    // PAYMENTS
    // ═══════════════════════════════════════
    if (resource === 'payments') {
      if (method === 'POST' && !resourceId) {
        // Create a payment — proxy to process-payment
        const body = await req.json();
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: { ...body, merchantId },
          headers: authHeader ? { Authorization: authHeader } : {},
        });
        if (error) return json(500, { error: { code: 'payment_failed', message: 'Payment processing failed' } });
        return json(200, { object: 'payment', ...data });
      }

      if (method === 'GET' && resourceId && !subResource) {
        const { data: tx, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !tx) return json(404, { error: { code: 'not_found', message: 'Payment not found' } });
        return json(200, { object: 'payment', ...tx });
      }

      if (method === 'POST' && resourceId && subResource === 'refund') {
        const body = await req.json();
        const { data, error } = await supabase.functions.invoke('refund-payment', {
          body: { transaction_id: resourceId, amount: body.amount, reason: body.reason },
          headers: authHeader ? { Authorization: authHeader } : {},
        });
        if (error) return json(500, { error: { code: 'refund_failed', message: 'Refund processing failed' } });
        return json(200, { object: 'refund', ...data });
      }

      if (method === 'POST' && resourceId && subResource === 'capture') {
        // Capture authorized payment
        const { data: tx } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .eq('status', 'authorized')
          .single();
        if (!tx) return json(404, { error: { code: 'not_found', message: 'Authorized payment not found' } });

        await supabase.from('transactions').update({ status: 'completed' }).eq('id', tx.id);
        return json(200, { object: 'payment', id: tx.id, status: 'completed', captured: true });
      }

      // GET /payments — list
      if (method === 'GET' && !resourceId) {
        const limit = parseInt(url.searchParams.get('limit') || '25');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const status = url.searchParams.get('status');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');

        let query = supabase
          .from('transactions')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) query = query.eq('status', status);
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to);

        const { data, count, error } = await query;
        if (error) return json(500, { error: { code: 'query_failed', message: error.message } });
        return json(200, { object: 'list', data, total: count, limit, offset });
      }
    }

    // ═══════════════════════════════════════
    // TRANSACTIONS
    // ═══════════════════════════════════════
    if (resource === 'transactions') {
      if (method === 'GET' && resourceId) {
        const { data: tx, error } = await supabase
          .from('transactions')
          .select('*, payment_attempts(*)')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !tx) return json(404, { error: { code: 'not_found', message: 'Transaction not found' } });
        return json(200, { object: 'transaction', ...tx });
      }

      if (method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '25');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const provider = url.searchParams.get('provider');
        const country = url.searchParams.get('country');
        const paymentMethod = url.searchParams.get('payment_method');

        let query = supabase
          .from('transactions')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (provider) query = query.eq('provider', provider);
        if (country) query = query.eq('metadata->>billing_country', country);
        if (paymentMethod) query = query.eq('metadata->>payment_method', paymentMethod);

        const { data, count, error } = await query;
        if (error) return json(500, { error: { code: 'query_failed', message: error.message } });
        return json(200, { object: 'list', data, total: count, limit, offset });
      }
    }

    // ═══════════════════════════════════════
    // REFUNDS
    // ═══════════════════════════════════════
    if (resource === 'refunds') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        const { data, error } = await supabase.functions.invoke('refund-payment', {
          body: { transaction_id: body.transaction_id, amount: body.amount, reason: body.reason },
          headers: authHeader ? { Authorization: authHeader } : {},
        });
        if (error) return json(500, { error: { code: 'refund_failed', message: 'Refund failed' } });
        return json(200, { object: 'refund', ...data });
      }

      if (method === 'GET' && resourceId) {
        const { data: refund, error } = await supabase
          .from('refunds')
          .select('*, transaction:transactions(amount, currency, customer_email)')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !refund) return json(404, { error: { code: 'not_found', message: 'Refund not found' } });
        return json(200, { object: 'refund', ...refund });
      }

      if (method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '25');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const { data, count, error } = await supabase
          .from('refunds')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) return json(500, { error: { code: 'query_failed', message: error.message } });
        return json(200, { object: 'list', data, total: count, limit, offset });
      }
    }

    // ═══════════════════════════════════════
    // CUSTOMERS
    // ═══════════════════════════════════════
    if (resource === 'customers') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        const { data: customer, error } = await supabase
          .from('customers')
          .insert({ merchant_id: merchantId, email: body.email, first_name: body.first_name, last_name: body.last_name, billing_address: body.billing_address })
          .select()
          .single();
        if (error) return json(400, { error: { code: 'create_failed', message: error.message } });
        return json(201, { object: 'customer', ...customer });
      }

      if (method === 'GET' && resourceId) {
        const { data: customer, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !customer) return json(404, { error: { code: 'not_found', message: 'Customer not found' } });
        return json(200, { object: 'customer', ...customer });
      }

      if (method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '25');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const email = url.searchParams.get('email');
        let query = supabase
          .from('customers')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (email) query = query.ilike('email', `%${email}%`);
        const { data, count, error } = await query;
        if (error) return json(500, { error: { code: 'query_failed', message: error.message } });
        return json(200, { object: 'list', data, total: count, limit, offset });
      }
    }

    // ═══════════════════════════════════════
    // DISPUTES
    // ═══════════════════════════════════════
    if (resource === 'disputes') {
      if (method === 'GET' && resourceId) {
        const { data: dispute, error } = await supabase
          .from('disputes')
          .select('*, transaction:transactions(amount, currency, customer_email, provider)')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !dispute) return json(404, { error: { code: 'not_found', message: 'Dispute not found' } });
        return json(200, { object: 'dispute', ...dispute });
      }

      if (method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '25');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const status = url.searchParams.get('status');
        let query = supabase
          .from('disputes')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (status) query = query.eq('status', status);
        const { data, count, error } = await query;
        if (error) return json(500, { error: { code: 'query_failed', message: error.message } });
        return json(200, { object: 'list', data, total: count, limit, offset });
      }
    }

    // ═══════════════════════════════════════
    // PAYMENT INTENTS
    // ═══════════════════════════════════════
    if (resource === 'payment-intents') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        const { data: intent, error } = await supabase
          .from('payment_intents')
          .insert({
            merchant_id: merchantId,
            amount: body.amount,
            currency: body.currency || 'USD',
            status: 'requires_payment_method',
            payment_method: body.payment_method,
            metadata: body.metadata || {},
          })
          .select()
          .single();
        if (error) return json(400, { error: { code: 'create_failed', message: error.message } });
        return json(201, { object: 'payment_intent', ...intent });
      }

      if (method === 'GET' && resourceId) {
        const { data: intent, error } = await supabase
          .from('payment_intents')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !intent) return json(404, { error: { code: 'not_found', message: 'Payment intent not found' } });
        return json(200, { object: 'payment_intent', ...intent });
      }
    }

    // ═══════════════════════════════════════
    // WEBHOOK ENDPOINTS (merchant-managed)
    // ═══════════════════════════════════════
    if (resource === 'webhooks' && (pathParts[1] === 'endpoints' || !pathParts[1])) {
      const endpointId = pathParts[2] || '';

      if (method === 'POST' && !endpointId) {
        const body = await req.json();
        if (!body.url) return json(400, { error: { code: 'missing_url', message: 'Webhook URL is required' } });

        // Generate a webhook secret for the merchant
        const secret = `whsec_${crypto.randomUUID().replace(/-/g, '')}`;

        const { data: endpoint, error } = await supabase
          .from('webhook_endpoints')
          .insert({
            merchant_id: merchantId,
            url: body.url,
            events: body.events || ['*'],
            secret,
            active: true,
            description: body.description || null,
          })
          .select()
          .single();
        if (error) return json(400, { error: { code: 'create_failed', message: error.message } });
        return json(201, { object: 'webhook_endpoint', ...endpoint, secret });
      }

      if (method === 'GET' && !endpointId) {
        const { data: endpoints, error } = await supabase
          .from('webhook_endpoints')
          .select('id, url, events, active, description, created_at')
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false });
        if (error) return json(500, { error: { code: 'query_failed', message: error.message } });
        return json(200, { object: 'list', data: endpoints });
      }

      if (method === 'DELETE' && endpointId) {
        const { error } = await supabase
          .from('webhook_endpoints')
          .delete()
          .eq('id', endpointId)
          .eq('merchant_id', merchantId);
        if (error) return json(500, { error: { code: 'delete_failed', message: error.message } });
        return json(200, { deleted: true, id: endpointId });
      }
    }

    // ═══════════════════════════════════════
    // BALANCE
    // ═══════════════════════════════════════
    if (resource === 'balance' && method === 'GET') {
      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('currency, balance, available_balance, pending_balance')
        .eq('merchant_id', merchantId);
      if (error) return json(500, { error: { code: 'query_failed', message: error.message } });
      return json(200, { object: 'balance', accounts: accounts || [] });
    }

    // ═══════════════════════════════════════
    // INVOICES
    // ═══════════════════════════════════════
    if (resource === 'invoices') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        const { data: invoice, error } = await supabase
          .from('invoices')
          .insert({
            merchant_id: merchantId,
            customer_email: body.customer_email,
            customer_name: body.customer_name,
            amount: body.amount,
            currency: body.currency || 'USD',
            description: body.description,
            due_date: body.due_date,
            items: body.items,
            notes: body.notes,
            status: 'draft',
          })
          .select()
          .single();
        if (error) return json(400, { error: { code: 'create_failed', message: error.message } });
        return json(201, { object: 'invoice', ...invoice });
      }

      if (method === 'GET' && resourceId) {
        const { data: invoice, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !invoice) return json(404, { error: { code: 'not_found', message: 'Invoice not found' } });
        return json(200, { object: 'invoice', ...invoice });
      }

      if (method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '25');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const { data, count, error } = await supabase
          .from('invoices')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) return json(500, { error: { code: 'query_failed', message: error.message } });
        return json(200, { object: 'list', data, total: count, limit, offset });
      }
    }

    // ═══════════════════════════════════════
    // SUBSCRIPTIONS
    // ═══════════════════════════════════════
    if (resource === 'subscriptions') {
      if (method === 'GET' && resourceId) {
        const { data: sub, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !sub) return json(404, { error: { code: 'not_found', message: 'Subscription not found' } });
        return json(200, { object: 'subscription', ...sub });
      }

      if (method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '25');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const status = url.searchParams.get('status');
        let query = supabase
          .from('subscriptions')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (status) query = query.eq('status', status);
        const { data, count, error } = await query;
        if (error) return json(500, { error: { code: 'query_failed', message: error.message } });
        return json(200, { object: 'list', data, total: count, limit, offset });
      }

      if (method === 'POST' && resourceId && subResource === 'cancel') {
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled', cancel_at_period_end: true })
          .eq('id', resourceId)
          .eq('merchant_id', merchantId);
        if (error) return json(500, { error: { code: 'cancel_failed', message: error.message } });
        return json(200, { object: 'subscription', id: resourceId, status: 'canceled' });
      }
    }

    // ═══════════════════════════════════════
    // PAYOUTS
    // ═══════════════════════════════════════
    if (resource === 'payouts') {
      if (method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '25');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const { data, count, error } = await supabase
          .from('payouts')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) return json(500, { error: { code: 'query_failed', message: error.message } });
        return json(200, { object: 'list', data, total: count, limit, offset });
      }
    }

    // ═══════════════════════════════════════
    // EVENTS (audit log)
    // ═══════════════════════════════════════
    if (resource === 'events') {
      if (method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const { data, count, error } = await supabase
          .from('provider_events')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) return json(500, { error: { code: 'query_failed', message: error.message } });
        return json(200, { object: 'list', data, total: count, limit, offset });
      }
    }

    return json(404, { error: { code: 'not_found', message: `Route ${method} /${pathParts.join('/')} not found` } });

  } catch (err) {
    console.error('API v2 error:', err);
    return json(500, { error: { code: 'internal_error', message: 'An internal error occurred' } });
  }
});
