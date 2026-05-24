import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-everpay-api-key, x-idempotency-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

const genRequestId = () => `req_${crypto.randomUUID().replace(/-/g, '')}`;

const json = (status: number, body: unknown, reqId?: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Request-Id': reqId || genRequestId(),
      'X-Everpay-Version': '2026-03-25',
    },
  });

// ─── Async Buffered API Logger (Article Best Practices) ───
// 1. Non-blocking: logs are buffered in memory, never awaited in request path
// 2. Batched writes: flushed every 5s or when buffer hits 50 entries
// 3. Sensitive data masking: passwords, card numbers, tokens stripped
// 4. Log sampling: 100% of errors, 20% of successful 2xx requests
// 5. Structured entries: timestamp, method, url, status, latency, merchantId, requestId

interface ApiLogEntry {
  endpoint: string;
  method: string;
  status_code: number;
  latency_ms: number;
  merchant_id: string | null;
  request_id: string;
  user_agent: string | null;
  ip_address: string | null;
  resource: string;
  error_message?: string;
  created_at: string;
}

const LOG_BUFFER: ApiLogEntry[] = [];
const LOG_BUFFER_SIZE = 50;
const LOG_FLUSH_INTERVAL_MS = 5_000;
const LOG_SAMPLE_RATE_SUCCESS = 0.2; // log 20% of 2xx responses
let flushTimer: number | null = null;

function shouldLogRequest(statusCode: number): boolean {
  // Always log errors (4xx, 5xx)
  if (statusCode >= 400) return true;
  // Sample successful requests at 20%
  return Math.random() < LOG_SAMPLE_RATE_SUCCESS;
}

function maskSensitiveFields(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitiveFields);

  const clone: Record<string, unknown> = {};
  const sensitiveKeys = new Set([
    'password', 'secret', 'token', 'access_token', 'refresh_token',
    'api_key', 'apikey', 'authorization', 'card_number', 'cardNumber',
    'cvv', 'cvc', 'ssn', 'social_security', 'pin',
  ]);
  const cardPattern = /^\d{13,19}$/;

  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.has(lowerKey)) {
      clone[key] = '***REDACTED***';
    } else if (typeof val === 'string' && cardPattern.test(val.replace(/\s/g, ''))) {
      clone[key] = `****${val.slice(-4)}`;
    } else if (typeof val === 'object' && val !== null) {
      clone[key] = maskSensitiveFields(val);
    } else {
      clone[key] = val;
    }
  }
  return clone;
}

async function flushLogBuffer() {
  if (LOG_BUFFER.length === 0) return;

  const batch = LOG_BUFFER.splice(0, LOG_BUFFER.length);
  try {
    const supabaseForLogs = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    await supabaseForLogs.from('api_request_logs').insert(
      batch.map((entry) => ({
        endpoint: entry.endpoint,
        method: entry.method,
        status_code: entry.status_code,
        latency_ms: entry.latency_ms,
        merchant_id: entry.merchant_id,
        created_at: entry.created_at,
      }))
    );
  } catch (err) {
    // Never let logging errors crash the API — silently drop
    console.error('[api-logger] flush error:', err);
  }
}

function enqueueLog(entry: ApiLogEntry) {
  LOG_BUFFER.push(entry);
  if (LOG_BUFFER.length >= LOG_BUFFER_SIZE) {
    // Flush immediately when buffer is full — fire-and-forget
    flushLogBuffer();
  } else if (!flushTimer) {
    // Schedule a periodic flush
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushLogBuffer();
    }, LOG_FLUSH_INTERVAL_MS) as unknown as number;
  }
}

/**
 * Everpay API v2 — RESTful merchant gateway
 * Modeled after Stripe's API conventions
 *
 * Auth: Bearer <JWT> or X-Everpay-Api-Key: <merchant_api_key>
 *
 * Routes:
 *   --- Core Payment ---
 *   POST   /payments              — Create a payment
 *   GET    /payments              — List payments
 *   GET    /payments/:id          — Retrieve a payment
 *   POST   /payments/:id/refund   — Refund a payment
 *   POST   /payments/:id/capture  — Capture an authorized payment
 *   POST   /payment-intents       — Create a payment intent
 *   GET    /payment-intents/:id   — Get payment intent
 *   PATCH  /payment-intents/:id   — Update payment intent
 *
 *   --- Payment Methods ---
 *   POST   /payment-methods       — Attach a payment method
 *   GET    /payment-methods       — List payment methods
 *   GET    /payment-methods/:id   — Retrieve a payment method
 *   DELETE /payment-methods/:id   — Detach a payment method
 *
 *   --- Payment Links ---
 *   POST   /payment-links         — Create a payment link
 *   GET    /payment-links         — List payment links
 *   GET    /payment-links/:id     — Get payment link
 *   PATCH  /payment-links/:id     — Update payment link
 *
 *   --- Transactions ---
 *   GET    /transactions          — List transactions
 *   GET    /transactions/:id      — Get transaction detail
 *
 *   --- Refunds ---
 *   POST   /refunds               — Create a refund
 *   GET    /refunds               — List refunds
 *   GET    /refunds/:id           — Get refund detail
 *
 *   --- Customers ---
 *   POST   /customers             — Create a customer
 *   GET    /customers             — List customers
 *   GET    /customers/:id         — Get customer detail
 *   PATCH  /customers/:id         — Update customer
 *   DELETE /customers/:id         — Delete customer
 *
 *   --- Products ---
 *   POST   /products              — Create a product
 *   GET    /products              — List products
 *   GET    /products/:id          — Get product detail
 *   PATCH  /products/:id          — Update a product
 *   DELETE /products/:id          — Delete a product
 *
 *   --- Subscriptions ---
 *   POST   /subscriptions         — Create a subscription
 *   GET    /subscriptions         — List subscriptions
 *   GET    /subscriptions/:id     — Get subscription detail
 *   POST   /subscriptions/:id/cancel — Cancel a subscription
 *   PATCH  /subscriptions/:id     — Update subscription
 *
 *   --- Subscription Plans ---
 *   POST   /plans                 — Create a plan
 *   GET    /plans                 — List plans
 *   GET    /plans/:id             — Get plan detail
 *   PATCH  /plans/:id             — Update plan
 *
 *   --- Disputes ---
 *   GET    /disputes              — List disputes
 *   GET    /disputes/:id          — Get dispute detail
 *
 *   --- Invoices ---
 *   POST   /invoices              — Create an invoice
 *   GET    /invoices              — List invoices
 *   GET    /invoices/:id          — Get invoice
 *   POST   /invoices/:id/send     — Send invoice
 *   POST   /invoices/:id/void     — Void invoice
 *
 *   --- Payouts ---
 *   POST   /payouts               — Create a payout
 *   GET    /payouts               — List payouts
 *   GET    /payouts/:id           — Get payout detail
 *
 *   --- Bank Accounts ---
 *   POST   /bank-accounts         — Create a bank account
 *   GET    /bank-accounts         — List bank accounts
 *   GET    /bank-accounts/:id     — Get bank account
 *   DELETE /bank-accounts/:id     — Remove bank account
 *
 *   --- Wallets ---
 *   POST   /wallets               — Create a wallet
 *   GET    /wallets               — List wallets
 *   POST   /wallets/transfer      — Transfer between wallets
 *
 *   --- Webhooks ---
 *   POST   /webhooks/endpoints    — Register a webhook endpoint
 *   GET    /webhooks/endpoints    — List webhook endpoints
 *   DELETE /webhooks/endpoints/:id — Delete endpoint
 *
 *   --- Balance ---
 *   GET    /balance               — Get account balances
 *
 *   --- Events ---
 *   GET    /events                — List events
 *   GET    /events/:id            — Get event detail
 */

// ─── Rate Limiting (in-memory, per-merchant) ───
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RL_WINDOW_MS = 60_000;
const RL_MAX_REQUESTS = 120; // 120 req/min per API key

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RL_WINDOW_MS });
    return { allowed: true, remaining: RL_MAX_REQUESTS - 1, resetAt: now + RL_WINDOW_MS };
  }
  entry.count++;
  return { allowed: entry.count <= RL_MAX_REQUESTS, remaining: Math.max(0, RL_MAX_REQUESTS - entry.count), resetAt: entry.resetAt };
}

// ─── Input sanitization ───
function sanitizeInput(val: unknown): unknown {
  if (typeof val === 'string') {
    return val.replace(/<[^>]*>/g, '').slice(0, 10000);
  }
  if (Array.isArray(val)) return val.map(sanitizeInput);
  if (val && typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      out[k.replace(/[^\w.-]/g, '')] = sanitizeInput(v);
    }
    return out;
  }
  return val;
}

// ─── Helpers ───
function parsePagination(url: URL) {
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '25'), 1), 100);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
  const starting_after = url.searchParams.get('starting_after');
  const ending_before = url.searchParams.get('ending_before');
  return { limit, offset, starting_after, ending_before };
}

function listResponse(data: unknown[], total: number | null, hasMore: boolean, url: string) {
  return { object: 'list', data, has_more: hasMore, total_count: total, url };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const reqId = genRequestId();
  const startTime = Date.now();

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

  // ─── Parse route early (needed for logging) ───
  const url = new URL(req.url);
  const pathParts = url.pathname.replace(/^\/api-v1/, '').replace(/^\/v1/, '').split('/').filter(Boolean);
  const method = req.method;
  const resource = pathParts[0] || '';
  const resourceId = pathParts[1] || '';
  const subResource = pathParts[2] || '';

  if (!merchantId) {
    const authFailResp = json(401, {
      error: {
        type: 'authentication_error',
        code: 'unauthorized',
        message: 'Invalid or missing authentication. Provide a valid Bearer token or X-Everpay-Api-Key header.',
        doc_url: 'https://developers.everpayinc.com/api/authentication',
      }
    }, reqId);
    // Always log auth failures
    enqueueLog({
      endpoint: `/${pathParts.join('/')}`,
      method,
      status_code: 401,
      latency_ms: Date.now() - startTime,
      merchant_id: null,
      request_id: reqId,
      user_agent: req.headers.get('user-agent'),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
      resource,
      error_message: 'unauthorized',
      created_at: new Date().toISOString(),
    });
    return authFailResp;
  }

  // ─── Rate Limit (per merchant) ───
  const rl = checkRateLimit(merchantId);
  if (!rl.allowed) {
    return new Response(JSON.stringify({
      error: {
        type: 'rate_limit_error',
        code: 'rate_limit_exceeded',
        message: `Rate limit exceeded. Max ${RL_MAX_REQUESTS} requests per minute.`,
      }
    }), {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Request-Id': reqId,
        'X-RateLimit-Limit': String(RL_MAX_REQUESTS),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
        'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
      },
    });
  }

  // ─── Idempotency ───
  const idempotencyKey = req.headers.get('X-Idempotency-Key');
  if (idempotencyKey && req.method === 'POST') {
    const { data: existing } = await supabase
      .from('idempotency_keys')
      .select('response')
      .eq('key', idempotencyKey)
      .eq('merchant_id', merchantId)
      .single();
    if (existing?.response) {
      return json(200, existing.response, reqId);
    }
  }

  // Route already parsed above (before auth check)

  // Helper to store idempotency response
  const storeIdempotency = async (response: unknown) => {
    if (idempotencyKey && method === 'POST') {
      await supabase.from('idempotency_keys').insert({
        key: idempotencyKey,
        merchant_id: merchantId!,
        response: response as any,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }).onConflict('key,merchant_id' as any);
    }
  };

  // Helper to log + return response (non-blocking)
  const logAndReturn = (response: Response) => {
    const latency = Date.now() - startTime;
    const statusCode = response.status;
    if (shouldLogRequest(statusCode)) {
      enqueueLog({
        endpoint: `/${pathParts.join('/')}`,
        method,
        status_code: statusCode,
        latency_ms: latency,
        merchant_id: merchantId,
        request_id: reqId,
        user_agent: req.headers.get('user-agent'),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
        resource,
        created_at: new Date().toISOString(),
      });
    }
    return response;
  };

  try {
    // ═══════════════════════════════════════
    // PAYMENTS
    // ═══════════════════════════════════════
    if (resource === 'payments') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        if (!body.amount || !body.currency) {
          return json(400, { error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'amount and currency are required', param: !body.amount ? 'amount' : 'currency' } }, reqId);
        }
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: { ...body, merchantId },
          headers: authHeader ? { Authorization: authHeader } : {},
        });
        if (error) return json(500, { error: { type: 'api_error', code: 'payment_failed', message: 'Payment processing failed' } }, reqId);
        const result = { object: 'payment', ...data };
        await storeIdempotency(result);
        return json(200, result, reqId);
      }

      if (method === 'GET' && resourceId && !subResource) {
        const { data: tx, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !tx) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: `Payment '${resourceId}' not found` } }, reqId);
        return json(200, { object: 'payment', ...tx }, reqId);
      }

      if (method === 'POST' && resourceId && subResource === 'refund') {
        const body = await req.json();
        const { data, error } = await supabase.functions.invoke('refund-payment', {
          body: { transaction_id: resourceId, amount: body.amount, reason: body.reason },
          headers: authHeader ? { Authorization: authHeader } : {},
        });
        if (error) return json(500, { error: { type: 'api_error', code: 'refund_failed', message: 'Refund processing failed' } }, reqId);
        const result = { object: 'refund', ...data };
        await storeIdempotency(result);
        return json(200, result, reqId);
      }

      if (method === 'POST' && resourceId && subResource === 'capture') {
        const { data: tx } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .eq('status', 'authorized')
          .single();
        if (!tx) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Authorized payment not found' } }, reqId);
        await supabase.from('transactions').update({ status: 'completed' }).eq('id', tx.id);
        const result = { object: 'payment', id: tx.id, status: 'completed', captured: true };
        await storeIdempotency(result);
        return json(200, result, reqId);
      }

      if (method === 'GET' && !resourceId) {
        const { limit, offset } = parsePagination(url);
        const status = url.searchParams.get('status');
        const from = url.searchParams.get('created[gte]') || url.searchParams.get('from');
        const to = url.searchParams.get('created[lte]') || url.searchParams.get('to');

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
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, listResponse(data || [], count, (offset + limit) < (count || 0), '/v1/payments'), reqId);
      }
    }

    // ═══════════════════════════════════════
    // PAYMENT INTENTS
    // ═══════════════════════════════════════
    if (resource === 'payment-intents') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        if (!body.amount) return json(400, { error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'amount is required', param: 'amount' } }, reqId);
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
        if (error) return json(400, { error: { type: 'invalid_request_error', code: 'create_failed', message: error.message } }, reqId);
        const result = { object: 'payment_intent', client_secret: `pi_${intent.id}_secret_${crypto.randomUUID().slice(0, 8)}`, ...intent };
        await storeIdempotency(result);
        return json(201, result, reqId);
      }

      if (method === 'GET' && resourceId) {
        const { data: intent, error } = await supabase
          .from('payment_intents')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !intent) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Payment intent not found' } }, reqId);
        return json(200, { object: 'payment_intent', ...intent }, reqId);
      }

      if (method === 'PATCH' && resourceId) {
        const body = await req.json();
        const updates: Record<string, unknown> = {};
        if (body.amount !== undefined) updates.amount = body.amount;
        if (body.currency) updates.currency = body.currency;
        if (body.metadata) updates.metadata = body.metadata;
        if (body.payment_method) updates.payment_method = body.payment_method;

        const { data: intent, error } = await supabase
          .from('payment_intents')
          .update(updates)
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .select()
          .single();
        if (error || !intent) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Payment intent not found' } }, reqId);
        return json(200, { object: 'payment_intent', ...intent }, reqId);
      }

      if (method === 'GET' && !resourceId) {
        const { limit, offset } = parsePagination(url);
        const { data, count, error } = await supabase
          .from('payment_intents')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, listResponse(data || [], count, (offset + limit) < (count || 0), '/v1/payment-intents'), reqId);
      }
    }

    // ═══════════════════════════════════════
    // BILLING AGREEMENTS (MIT consent records)
    // ═══════════════════════════════════════
    if (resource === 'billing-agreements') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        if (!body.mit_type) return json(400, { error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'mit_type is required', param: 'mit_type' } }, reqId);
        if (!['recurring', 'deferred', 'reload', 'unscheduled'].includes(body.mit_type)) {
          return json(400, { error: { type: 'invalid_request_error', code: 'parameter_invalid', message: 'mit_type must be recurring, deferred, reload, or unscheduled', param: 'mit_type' } }, reqId);
        }
        const consentIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
        const { data, error } = await supabase.from('billing_agreements').insert({
          merchant_id: merchantId,
          customer_id: body.customer_id || null,
          payment_method_id: body.payment_method_id || null,
          mit_type: body.mit_type,
          status: body.status || 'active',
          currency: body.currency || 'USD',
          frequency: body.recurring?.frequency || null,
          interval_count: body.recurring?.interval_count ?? 1,
          amount: body.recurring?.amount ?? body.amount ?? null,
          variable_amount: body.recurring?.variable_amount ?? false,
          amount_min: body.recurring?.amount_min ?? null,
          amount_max: body.recurring?.amount_max ?? null,
          intro_amount: body.recurring?.intro_amount ?? null,
          intro_periods: body.recurring?.intro_periods ?? null,
          total_billing_cycles: body.recurring?.total_billing_cycles ?? null,
          start_date: body.recurring?.start_date || new Date().toISOString(),
          end_date: body.recurring?.end_date || null,
          next_billing_at: body.recurring?.start_date || null,
          deferred_charge_at: body.deferred?.charge_at || null,
          reload_threshold: body.reload?.threshold ?? null,
          reload_amount: body.reload?.amount ?? null,
          current_balance: body.reload?.starting_balance ?? 0,
          consent_ip: consentIp,
          consent_user_agent: req.headers.get('user-agent'),
          description: body.description || null,
          metadata: body.metadata || {},
        }).select().single();
        if (error) return json(400, { error: { type: 'invalid_request_error', code: 'create_failed', message: error.message } }, reqId);
        return json(201, { object: 'billing_agreement', ...data }, reqId);
      }
      if (method === 'POST' && resourceId && url.pathname.endsWith('/cancel')) {
        const realId = resourceId === 'cancel' ? url.pathname.split('/').filter(Boolean).slice(-2)[0] : resourceId;
        const { data, error } = await supabase.from('billing_agreements').update({ status: 'canceled' }).eq('id', realId).eq('merchant_id', merchantId).select().single();
        if (error || !data) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Billing agreement not found' } }, reqId);
        return json(200, { object: 'billing_agreement', ...data }, reqId);
      }
      if (method === 'GET' && resourceId) {
        const { data, error } = await supabase.from('billing_agreements').select('*').eq('id', resourceId).eq('merchant_id', merchantId).single();
        if (error || !data) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Billing agreement not found' } }, reqId);
        return json(200, { object: 'billing_agreement', ...data }, reqId);
      }
      if (method === 'GET' && !resourceId) {
        const { limit, offset } = parsePagination(url);
        const { data, count, error } = await supabase.from('billing_agreements').select('*', { count: 'exact' }).eq('merchant_id', merchantId).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, listResponse(data || [], count, (offset + limit) < (count || 0), '/v1/billing-agreements'), reqId);
      }
      if (method === 'PATCH' && resourceId) {
        const body = await req.json();
        const allowed = ['status', 'amount', 'frequency', 'interval_count', 'end_date', 'next_billing_at', 'deferred_charge_at', 'reload_threshold', 'reload_amount', 'description', 'metadata', 'payment_method_id'];
        const updates: Record<string, unknown> = {};
        for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];
        const { data, error } = await supabase.from('billing_agreements').update(updates).eq('id', resourceId).eq('merchant_id', merchantId).select().single();
        if (error || !data) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Billing agreement not found' } }, reqId);
        return json(200, { object: 'billing_agreement', ...data }, reqId);
      }
    }

    // ═══════════════════════════════════════
    // PAYMENT METHODS
    // ═══════════════════════════════════════
    if (resource === 'payment-methods') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        if (!body.customer_id || !body.vgs_alias) {
          return json(400, { error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'customer_id and vgs_alias are required' } }, reqId);
        }
        const { data: pm, error } = await supabase
          .from('payment_methods')
          .insert({
            customer_id: body.customer_id,
            vgs_alias: body.vgs_alias,
            card_brand: body.card_brand,
            card_last4: body.card_last4,
            exp_month: body.exp_month,
            exp_year: body.exp_year,
            is_default: body.is_default || false,
          })
          .select()
          .single();
        if (error) return json(400, { error: { type: 'invalid_request_error', code: 'create_failed', message: error.message } }, reqId);
        const result = { object: 'payment_method', ...pm };
        await storeIdempotency(result);
        return json(201, result, reqId);
      }

      if (method === 'GET' && resourceId) {
        const { data: pm, error } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('id', resourceId)
          .single();
        if (error || !pm) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Payment method not found' } }, reqId);
        return json(200, { object: 'payment_method', ...pm }, reqId);
      }

      if (method === 'GET' && !resourceId) {
        const customerId = url.searchParams.get('customer');
        const { limit, offset } = parsePagination(url);
        let query = supabase
          .from('payment_methods')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (customerId) query = query.eq('customer_id', customerId);
        const { data, count, error } = await query;
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, listResponse(data || [], count, (offset + limit) < (count || 0), '/v1/payment-methods'), reqId);
      }

      if (method === 'DELETE' && resourceId) {
        const { error } = await supabase.from('payment_methods').delete().eq('id', resourceId);
        if (error) return json(500, { error: { type: 'api_error', code: 'delete_failed', message: error.message } }, reqId);
        return json(200, { id: resourceId, object: 'payment_method', deleted: true }, reqId);
      }
    }

    // ═══════════════════════════════════════
    // PAYMENT LINKS
    // ═══════════════════════════════════════
    if (resource === 'payment-links') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        if (!body.amount) return json(400, { error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'amount is required', param: 'amount' } }, reqId);
        const linkId = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
        const { data: link, error } = await supabase
          .from('payment_links')
          .insert({
            merchant_id: merchantId,
            amount: body.amount,
            currency: body.currency || 'USD',
            description: body.description,
            redirect_url: body.redirect_url,
            metadata: body.metadata || {},
            active: true,
            short_code: linkId,
          })
          .select()
          .single();
        if (error) return json(400, { error: { type: 'invalid_request_error', code: 'create_failed', message: error.message } }, reqId);
        const result = { object: 'payment_link', url: `https://checkout.everpayinc.com/pay/${link.short_code}`, ...link };
        await storeIdempotency(result);
        return json(201, result, reqId);
      }

      if (method === 'GET' && resourceId) {
        const { data: link, error } = await supabase
          .from('payment_links')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !link) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Payment link not found' } }, reqId);
        return json(200, { object: 'payment_link', url: `https://checkout.everpayinc.com/pay/${link.short_code}`, ...link }, reqId);
      }

      if (method === 'PATCH' && resourceId) {
        const body = await req.json();
        const updates: Record<string, unknown> = {};
        if (body.active !== undefined) updates.active = body.active;
        if (body.metadata) updates.metadata = body.metadata;
        const { data: link, error } = await supabase
          .from('payment_links')
          .update(updates)
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .select()
          .single();
        if (error || !link) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Payment link not found' } }, reqId);
        return json(200, { object: 'payment_link', ...link }, reqId);
      }

      if (method === 'GET' && !resourceId) {
        const { limit, offset } = parsePagination(url);
        const { data, count, error } = await supabase
          .from('payment_links')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, listResponse(data || [], count, (offset + limit) < (count || 0), '/v1/payment-links'), reqId);
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
        if (error || !tx) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Transaction not found' } }, reqId);
        return json(200, { object: 'transaction', ...tx }, reqId);
      }

      if (method === 'GET') {
        const { limit, offset } = parsePagination(url);
        const provider = url.searchParams.get('provider');
        const status = url.searchParams.get('status');

        let query = supabase
          .from('transactions')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (provider) query = query.eq('provider', provider);
        if (status) query = query.eq('status', status);

        const { data, count, error } = await query;
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, listResponse(data || [], count, (offset + limit) < (count || 0), '/v1/transactions'), reqId);
      }
    }

    // ═══════════════════════════════════════
    // REFUNDS
    // ═══════════════════════════════════════
    if (resource === 'refunds') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        if (!body.transaction_id) return json(400, { error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'transaction_id is required', param: 'transaction_id' } }, reqId);
        const { data, error } = await supabase.functions.invoke('refund-payment', {
          body: { transaction_id: body.transaction_id, amount: body.amount, reason: body.reason },
          headers: authHeader ? { Authorization: authHeader } : {},
        });
        if (error) return json(500, { error: { type: 'api_error', code: 'refund_failed', message: 'Refund failed' } }, reqId);
        const result = { object: 'refund', ...data };
        await storeIdempotency(result);
        return json(200, result, reqId);
      }

      if (method === 'GET' && resourceId) {
        const { data: refund, error } = await supabase
          .from('refunds')
          .select('*, transaction:transactions(amount, currency, customer_email)')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !refund) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Refund not found' } }, reqId);
        return json(200, { object: 'refund', ...refund }, reqId);
      }

      if (method === 'GET') {
        const { limit, offset } = parsePagination(url);
        const { data, count, error } = await supabase
          .from('refunds')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, listResponse(data || [], count, (offset + limit) < (count || 0), '/v1/refunds'), reqId);
      }
    }

    // ═══════════════════════════════════════
    // CUSTOMERS
    // ═══════════════════════════════════════
    if (resource === 'customers') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        if (!body.email) return json(400, { error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'email is required', param: 'email' } }, reqId);
        const { data: customer, error } = await supabase
          .from('customers')
          .insert({ merchant_id: merchantId, email: body.email, first_name: body.first_name, last_name: body.last_name, billing_address: body.billing_address })
          .select()
          .single();
        if (error) return json(400, { error: { type: 'invalid_request_error', code: 'create_failed', message: error.message } }, reqId);
        const result = { object: 'customer', ...customer };
        await storeIdempotency(result);
        return json(201, result, reqId);
      }

      if (method === 'GET' && resourceId) {
        const { data: customer, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !customer) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Customer not found' } }, reqId);
        return json(200, { object: 'customer', ...customer }, reqId);
      }

      if (method === 'PATCH' && resourceId) {
        const body = await req.json();
        const updates: Record<string, unknown> = {};
        if (body.email) updates.email = body.email;
        if (body.first_name !== undefined) updates.first_name = body.first_name;
        if (body.last_name !== undefined) updates.last_name = body.last_name;
        if (body.billing_address) updates.billing_address = body.billing_address;
        const { data: customer, error } = await supabase
          .from('customers')
          .update(updates)
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .select()
          .single();
        if (error || !customer) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Customer not found' } }, reqId);
        return json(200, { object: 'customer', ...customer }, reqId);
      }

      if (method === 'DELETE' && resourceId) {
        const { error } = await supabase.from('customers').delete().eq('id', resourceId).eq('merchant_id', merchantId);
        if (error) return json(500, { error: { type: 'api_error', code: 'delete_failed', message: error.message } }, reqId);
        return json(200, { id: resourceId, object: 'customer', deleted: true }, reqId);
      }

      if (method === 'GET') {
        const { limit, offset } = parsePagination(url);
        const email = url.searchParams.get('email');
        let query = supabase
          .from('customers')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (email) query = query.ilike('email', `%${email}%`);
        const { data, count, error } = await query;
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, listResponse(data || [], count, (offset + limit) < (count || 0), '/v1/customers'), reqId);
      }
    }

    // ═══════════════════════════════════════
    // PRODUCTS
    // ═══════════════════════════════════════
    if (resource === 'products') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        if (!body.name) return json(400, { error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'name is required', param: 'name' } }, reqId);
        const { data: product, error } = await supabase
          .from('products')
          .insert({
            merchant_id: merchantId,
            name: body.name,
            description: body.description || '',
            price: body.price || 0,
            cost_price: body.cost_price,
            stock: body.stock ?? 0,
            product_type: body.product_type || 'service',
            sku: body.sku,
            category: body.category,
            tags: body.tags,
            image_url: body.image_url,
            metadata: body.metadata,
          })
          .select()
          .single();
        if (error) return json(400, { error: { type: 'invalid_request_error', code: 'create_failed', message: error.message } }, reqId);
        const result = { object: 'product', ...product };
        await storeIdempotency(result);
        return json(201, result, reqId);
      }

      if (method === 'GET' && resourceId) {
        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !product) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Product not found' } }, reqId);
        return json(200, { object: 'product', ...product }, reqId);
      }

      if (method === 'PATCH' && resourceId) {
        const body = await req.json();
        const updates: Record<string, unknown> = {};
        for (const key of ['name', 'description', 'price', 'cost_price', 'stock', 'product_type', 'sku', 'category', 'tags', 'image_url', 'metadata']) {
          if (body[key] !== undefined) updates[key] = body[key];
        }
        const { data: product, error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .select()
          .single();
        if (error || !product) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Product not found' } }, reqId);
        return json(200, { object: 'product', ...product }, reqId);
      }

      if (method === 'DELETE' && resourceId) {
        const { error } = await supabase.from('products').delete().eq('id', resourceId).eq('merchant_id', merchantId);
        if (error) return json(500, { error: { type: 'api_error', code: 'delete_failed', message: error.message } }, reqId);
        return json(200, { id: resourceId, object: 'product', deleted: true }, reqId);
      }

      if (method === 'GET') {
        const { limit, offset } = parsePagination(url);
        const active = url.searchParams.get('active');
        let query = supabase
          .from('products')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (active === 'true') query = query.gt('stock', 0);
        const { data, count, error } = await query;
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, listResponse(data || [], count, (offset + limit) < (count || 0), '/v1/products'), reqId);
      }
    }

    // ═══════════════════════════════════════
    // SUBSCRIPTIONS
    // ═══════════════════════════════════════
    if (resource === 'subscriptions') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        if (!body.customer_id || !body.plan_id) return json(400, { error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'customer_id and plan_id are required' } }, reqId);
        const { data: sub, error } = await supabase
          .from('subscriptions')
          .insert({
            merchant_id: merchantId,
            customer_id: body.customer_id,
            plan_id: body.plan_id,
            status: body.trial_days ? 'trialing' : 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + (body.trial_days || 30) * 86400000).toISOString(),
            cancel_at_period_end: false,
          })
          .select()
          .single();
        if (error) return json(400, { error: { type: 'invalid_request_error', code: 'create_failed', message: error.message } }, reqId);
        const result = { object: 'subscription', ...sub };
        await storeIdempotency(result);
        return json(201, result, reqId);
      }

      if (method === 'GET' && resourceId && !subResource) {
        const { data: sub, error } = await supabase
          .from('subscriptions')
          .select('*, customer:customers(email, first_name, last_name), plan:subscription_plans(name, amount, currency, interval)')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !sub) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Subscription not found' } }, reqId);
        return json(200, { object: 'subscription', ...sub }, reqId);
      }

      if (method === 'POST' && resourceId && subResource === 'cancel') {
        const body = req.headers.get('content-type')?.includes('json') ? await req.json().catch(() => ({})) : {};
        const cancelNow = body.cancel_now === true;
        const updates = cancelNow
          ? { status: 'canceled', canceled_at: new Date().toISOString() }
          : { cancel_at_period_end: true };
        const { error } = await supabase
          .from('subscriptions')
          .update(updates)
          .eq('id', resourceId)
          .eq('merchant_id', merchantId);
        if (error) return json(500, { error: { type: 'api_error', code: 'cancel_failed', message: error.message } }, reqId);
        return json(200, { object: 'subscription', id: resourceId, ...updates }, reqId);
      }

      if (method === 'PATCH' && resourceId) {
        const body = await req.json();
        const updates: Record<string, unknown> = {};
        if (body.plan_id) updates.plan_id = body.plan_id;
        if (body.cancel_at_period_end !== undefined) updates.cancel_at_period_end = body.cancel_at_period_end;
        if (body.metadata) updates.metadata = body.metadata;
        const { data: sub, error } = await supabase
          .from('subscriptions')
          .update(updates)
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .select()
          .single();
        if (error || !sub) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Subscription not found' } }, reqId);
        return json(200, { object: 'subscription', ...sub }, reqId);
      }

      if (method === 'GET' && !resourceId) {
        const { limit, offset } = parsePagination(url);
        const status = url.searchParams.get('status');
        let query = supabase
          .from('subscriptions')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (status) query = query.eq('status', status);
        const { data, count, error } = await query;
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, listResponse(data || [], count, (offset + limit) < (count || 0), '/v1/subscriptions'), reqId);
      }
    }

    // ═══════════════════════════════════════
    // SUBSCRIPTION PLANS
    // ═══════════════════════════════════════
    if (resource === 'plans') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        if (!body.name || !body.amount || !body.interval) return json(400, { error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'name, amount, and interval are required' } }, reqId);
        const { data: plan, error } = await supabase
          .from('subscription_plans')
          .insert({
            merchant_id: merchantId,
            name: body.name,
            amount: body.amount,
            currency: body.currency || 'USD',
            interval: body.interval,
            trial_days: body.trial_days || 0,
            active: body.active !== false,
          })
          .select()
          .single();
        if (error) return json(400, { error: { type: 'invalid_request_error', code: 'create_failed', message: error.message } }, reqId);
        const result = { object: 'plan', ...plan };
        await storeIdempotency(result);
        return json(201, result, reqId);
      }

      if (method === 'GET' && resourceId) {
        const { data: plan, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !plan) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Plan not found' } }, reqId);
        return json(200, { object: 'plan', ...plan }, reqId);
      }

      if (method === 'PATCH' && resourceId) {
        const body = await req.json();
        const updates: Record<string, unknown> = {};
        for (const key of ['name', 'amount', 'currency', 'interval', 'trial_days', 'active']) {
          if (body[key] !== undefined) updates[key] = body[key];
        }
        const { data: plan, error } = await supabase
          .from('subscription_plans')
          .update(updates)
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .select()
          .single();
        if (error || !plan) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Plan not found' } }, reqId);
        return json(200, { object: 'plan', ...plan }, reqId);
      }

      if (method === 'GET') {
        const { limit, offset } = parsePagination(url);
        const { data, count, error } = await supabase
          .from('subscription_plans')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, listResponse(data || [], count, (offset + limit) < (count || 0), '/v1/plans'), reqId);
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
        if (error || !dispute) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Dispute not found' } }, reqId);
        return json(200, { object: 'dispute', ...dispute }, reqId);
      }

      if (method === 'GET') {
        const { limit, offset } = parsePagination(url);
        const status = url.searchParams.get('status');
        let query = supabase
          .from('disputes')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (status) query = query.eq('status', status);
        const { data, count, error } = await query;
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, listResponse(data || [], count, (offset + limit) < (count || 0), '/v1/disputes'), reqId);
      }
    }

    // ═══════════════════════════════════════
    // INVOICES
    // ═══════════════════════════════════════
    if (resource === 'invoices') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        if (!body.customer_email || !body.amount) return json(400, { error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'customer_email and amount are required' } }, reqId);
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
        if (error) return json(400, { error: { type: 'invalid_request_error', code: 'create_failed', message: error.message } }, reqId);
        const result = { object: 'invoice', ...invoice };
        await storeIdempotency(result);
        return json(201, result, reqId);
      }

      if (method === 'GET' && resourceId && !subResource) {
        const { data: invoice, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !invoice) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Invoice not found' } }, reqId);
        return json(200, { object: 'invoice', ...invoice }, reqId);
      }

      if (method === 'POST' && resourceId && subResource === 'send') {
        await supabase.from('invoices').update({ status: 'sent' }).eq('id', resourceId).eq('merchant_id', merchantId);
        return json(200, { object: 'invoice', id: resourceId, status: 'sent' }, reqId);
      }

      if (method === 'POST' && resourceId && subResource === 'void') {
        await supabase.from('invoices').update({ status: 'void' }).eq('id', resourceId).eq('merchant_id', merchantId);
        return json(200, { object: 'invoice', id: resourceId, status: 'void' }, reqId);
      }

      if (method === 'GET') {
        const { limit, offset } = parsePagination(url);
        const status = url.searchParams.get('status');
        let query = supabase
          .from('invoices')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (status) query = query.eq('status', status);
        const { data, count, error } = await query;
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, listResponse(data || [], count, (offset + limit) < (count || 0), '/v1/invoices'), reqId);
      }
    }

    // ═══════════════════════════════════════
    // PAYOUTS
    // ═══════════════════════════════════════
    if (resource === 'payouts') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        if (!body.amount || !body.currency) return json(400, { error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'amount and currency are required' } }, reqId);

        // PayWatcher BASE/USDC payout — preferred low-cost crypto rail
        const network = String(body.network || body.chain || '').toUpperCase();
        const cur = String(body.currency || '').toUpperCase();
        if (body.method === 'crypto' && (cur === 'USDC' && (network === 'BASE' || !network))
            || body.provider === 'paywatcher') {
          const { data: pw, error: pwErr } = await supabase.functions.invoke('paywatcher-payments', {
            body: { action: 'create_payment', amount: body.amount, currency: 'USDC', merchant_id: merchantId, metadata: { destination: body.destination, recipient: body.recipient } },
            headers: authHeader ? { Authorization: authHeader } : {},
          });
          if (pwErr) return json(500, { error: { type: 'api_error', code: 'payout_failed', message: 'PayWatcher payout failed' } }, reqId);
          const { data: payout } = await supabase.from('payouts').insert({
            merchant_id: merchantId, amount: body.amount, currency: 'USDC',
            destination: body.destination || 'crypto', status: 'pending',
          }).select().single();
          const result = { object: 'payout', method: 'crypto', provider: 'paywatcher', network: 'BASE', payout, paywatcher: pw };
          await storeIdempotency(result);
          return json(201, result, reqId);
        }

        // Support card payouts via PacoPay
        if (body.method === 'card' && body.card) {
          const { data, error } = await supabase.functions.invoke('pacopay-process', {
            body: {
              action: 'payout_to_card',
              amount: body.amount,
              currency: body.currency,
              description: body.description || 'Payout',
              card: body.card,
              recipient: body.recipient,
              tracking_id: body.tracking_id || `po_${crypto.randomUUID().slice(0, 8)}`,
            },
          });
          if (error) return json(500, { error: { type: 'api_error', code: 'payout_failed', message: 'Card payout failed' } }, reqId);
          const result = { object: 'payout', method: 'card', ...data };
          await storeIdempotency(result);
          return json(200, result, reqId);
        }

        // Standard bank payout
        const { data: payout, error } = await supabase
          .from('payouts')
          .insert({
            merchant_id: merchantId,
            amount: body.amount,
            currency: body.currency,
            destination: body.destination || 'bank',
            status: 'pending',
          })
          .select()
          .single();
        if (error) return json(400, { error: { type: 'invalid_request_error', code: 'create_failed', message: error.message } }, reqId);
        const result = { object: 'payout', ...payout };
        await storeIdempotency(result);
        return json(201, result, reqId);
      }

      if (method === 'GET' && resourceId) {
        const { data: payout, error } = await supabase
          .from('payouts')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !payout) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Payout not found' } }, reqId);
        return json(200, { object: 'payout', ...payout }, reqId);
      }

      if (method === 'GET') {
        const { limit, offset } = parsePagination(url);
        const status = url.searchParams.get('status');
        let query = supabase
          .from('payouts')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (status) query = query.eq('status', status);
        const { data, count, error } = await query;
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, listResponse(data || [], count, (offset + limit) < (count || 0), '/v1/payouts'), reqId);
      }
    }

    // ═══════════════════════════════════════
    // RATES / UPSELL
    // ═══════════════════════════════════════
    if (resource === 'rates') {
      if (method === 'GET') {
        // Pull live PayWatcher rates and merge with provider sheet
        const { data } = await supabase.functions.invoke('paywatcher-payments', { body: { action: 'rates' } });
        const rails = (data?.rails || []).map((r: any) => ({
          ...r,
          markup_pct: r.cost > 0 ? Number((((r.charge - r.cost) / r.cost) * 100).toFixed(0)) : null,
          margin_bps: r.cost > 0 ? Math.round(((r.charge - r.cost) / r.charge) * 10000) : null,
        }));
        return json(200, { object: 'list', data: rails, asset: 'USDC' }, reqId);
      }
    }

    // ═══════════════════════════════════════
    // BANK ACCOUNTS
    // ═══════════════════════════════════════
    if (resource === 'bank-accounts' || resource === 'bank_accounts') {
      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        if (!body.bank_name || !body.account_number) return json(400, { error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'bank_name and account_number are required' } }, reqId);
        const { data: ba, error } = await supabase
          .from('bank_accounts')
          .insert({
            merchant_id: merchantId,
            bank_name: body.bank_name,
            account_number: body.account_number,
            sort_code: body.sort_code || body.routing_number,
            iban: body.iban,
            country: body.country,
            currency: body.currency,
            status: 'new',
          })
          .select()
          .single();
        if (error) return json(400, { error: { type: 'invalid_request_error', code: 'create_failed', message: error.message } }, reqId);
        const result = { object: 'bank_account', ...ba };
        await storeIdempotency(result);
        return json(201, result, reqId);
      }

      if (method === 'GET' && resourceId) {
        const { data: ba, error } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !ba) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Bank account not found' } }, reqId);
        return json(200, { object: 'bank_account', ...ba }, reqId);
      }

      if (method === 'DELETE' && resourceId) {
        const { error } = await supabase.from('bank_accounts').delete().eq('id', resourceId).eq('merchant_id', merchantId);
        if (error) return json(500, { error: { type: 'api_error', code: 'delete_failed', message: error.message } }, reqId);
        return json(200, { id: resourceId, object: 'bank_account', deleted: true }, reqId);
      }

      if (method === 'GET') {
        const { limit, offset } = parsePagination(url);
        const { data, count, error } = await supabase
          .from('bank_accounts')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, listResponse(data || [], count, (offset + limit) < (count || 0), '/v1/bank-accounts'), reqId);
      }
    }

    // ═══════════════════════════════════════
    // WALLETS
    // ═══════════════════════════════════════
    if (resource === 'wallets') {
      if (method === 'POST' && resourceId === 'transfer') {
        const body = await req.json();
        if (!body.from_wallet_id || !body.to_wallet_id || !body.amount) {
          return json(400, { error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'from_wallet_id, to_wallet_id, and amount are required' } }, reqId);
        }
        const { data, error } = await supabase.functions.invoke('moneto-wallet', {
          body: { action: 'transfer', ...body },
        });
        if (error) return json(500, { error: { type: 'api_error', code: 'transfer_failed', message: 'Transfer failed' } }, reqId);
        const result = { object: 'transfer', ...data };
        await storeIdempotency(result);
        return json(200, result, reqId);
      }

      if (method === 'POST' && !resourceId) {
        const body = await req.json();
        const { data, error } = await supabase.functions.invoke('moneto-wallet', {
          body: { action: 'create', currency: body.currency || 'USD', merchant_id: merchantId },
        });
        if (error) return json(500, { error: { type: 'api_error', code: 'create_failed', message: 'Wallet creation failed' } }, reqId);
        const result = { object: 'wallet', ...data };
        await storeIdempotency(result);
        return json(201, result, reqId);
      }

      if (method === 'GET' && !resourceId) {
        const { data: wallets, error } = await supabase
          .from('merchant_accounts')
          .select('*')
          .eq('merchant_id', merchantId);
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, { object: 'list', data: (wallets || []).map(w => ({ object: 'wallet', ...w })), has_more: false, url: '/v1/wallets' }, reqId);
      }
    }

    // ═══════════════════════════════════════
    // WEBHOOK ENDPOINTS
    // ═══════════════════════════════════════
    if (resource === 'webhooks') {
      const endpointId = pathParts[2] || '';

      if (method === 'POST' && !endpointId) {
        const body = await req.json();
        if (!body.url) return json(400, { error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'url is required', param: 'url' } }, reqId);
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
        if (error) return json(400, { error: { type: 'invalid_request_error', code: 'create_failed', message: error.message } }, reqId);
        const result = { object: 'webhook_endpoint', ...endpoint, secret };
        await storeIdempotency(result);
        return json(201, result, reqId);
      }

      if (method === 'GET' && !endpointId) {
        const { data: endpoints, error } = await supabase
          .from('webhook_endpoints')
          .select('id, url, events, active, description, created_at')
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false });
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, { object: 'list', data: endpoints || [], has_more: false, url: '/v1/webhooks/endpoints' }, reqId);
      }

      if (method === 'DELETE' && endpointId) {
        const { error } = await supabase
          .from('webhook_endpoints')
          .delete()
          .eq('id', endpointId)
          .eq('merchant_id', merchantId);
        if (error) return json(500, { error: { type: 'api_error', code: 'delete_failed', message: error.message } }, reqId);
        return json(200, { id: endpointId, object: 'webhook_endpoint', deleted: true }, reqId);
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
      if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);

      const available = (accounts || []).map(a => ({ amount: a.available_balance, currency: a.currency }));
      const pending = (accounts || []).map(a => ({ amount: a.pending_balance, currency: a.currency }));

      return json(200, {
        object: 'balance',
        available,
        pending,
        livemode: true,
      }, reqId);
    }

    // ═══════════════════════════════════════
    // EVENTS (audit log)
    // ═══════════════════════════════════════
    if (resource === 'events') {
      if (method === 'GET' && resourceId) {
        const { data: event, error } = await supabase
          .from('provider_events')
          .select('*')
          .eq('id', resourceId)
          .eq('merchant_id', merchantId)
          .single();
        if (error || !event) return json(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'Event not found' } }, reqId);
        return json(200, { object: 'event', ...event }, reqId);
      }

      if (method === 'GET') {
        const { limit, offset } = parsePagination(url);
        const type = url.searchParams.get('type');
        let query = supabase
          .from('provider_events')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (type) query = query.eq('event_type', type);
        const { data, count, error } = await query;
        if (error) return json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId);
        return json(200, listResponse(data || [], count, (offset + limit) < (count || 0), '/v1/events'), reqId);
      }
    }

    // ═══════════════════════════════════════
    // COMPOSITE / BFF ENDPOINTS
    // One call per screen — eliminates frontend assembly
    // ═══════════════════════════════════════

    // GET /composite/dashboard — Everything the dashboard screen needs
    if (resource === 'composite' && resourceId === 'dashboard' && method === 'GET') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Fire all queries in parallel — no waterfalls
      const [
        balanceRes,
        recentTxRes,
        txStatsRes,
        disputeRes,
        subscriptionRes,
        profileRes,
      ] = await Promise.all([
        // Account balances
        supabase.from('merchant_accounts').select('*').eq('merchant_id', merchantId),
        // Recent transactions (last 10)
        supabase.from('transactions').select('id,amount,currency,status,payment_method,customer_email,created_at,provider').eq('merchant_id', merchantId).order('created_at', { ascending: false }).limit(10),
        // Transaction volume stats (last 30 days)
        supabase.from('transactions').select('amount,status,currency,created_at').eq('merchant_id', merchantId).gte('created_at', thirtyDaysAgo),
        // Open disputes count
        supabase.from('disputes').select('id,amount,status', { count: 'exact' }).eq('merchant_id', merchantId).in('status', ['open', 'needs_response', 'under_review']),
        // Active subscriptions count
        supabase.from('subscriptions').select('id', { count: 'exact' }).eq('merchant_id', merchantId).eq('status', 'active'),
        // Merchant profile
        supabase.from('merchant_profiles').select('business_name,onboarding_status,country,industry').eq('merchant_id', merchantId).maybeSingle(),
      ]);

      const txs = txStatsRes.data || [];
      const successTxs = txs.filter((t: any) => t.status === 'completed' || t.status === 'settled');
      const totalVolume = successTxs.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      const successRate = txs.length > 0 ? (successTxs.length / txs.length) * 100 : 0;

      // 7-day volume for sparkline
      const last7 = txs.filter((t: any) => t.created_at >= sevenDaysAgo && (t.status === 'completed' || t.status === 'settled'));
      const dailyVolume: Record<string, number> = {};
      for (const t of last7) {
        const day = (t as any).created_at.slice(0, 10);
        dailyVolume[day] = (dailyVolume[day] || 0) + ((t as any).amount || 0);
      }

      return logAndReturn(json(200, {
        object: 'composite.dashboard',
        balance: {
          accounts: (balanceRes.data || []).map((a: any) => ({
            currency: a.currency,
            available: a.available_balance,
            pending: a.pending_balance,
            reserve: a.reserve_balance,
          })),
        },
        stats: {
          period: '30d',
          total_volume: totalVolume,
          transaction_count: txs.length,
          success_rate: Math.round(successRate * 100) / 100,
          open_disputes: disputeRes.count || 0,
          dispute_amount: (disputeRes.data || []).reduce((s: number, d: any) => s + (d.amount || 0), 0),
          active_subscriptions: subscriptionRes.count || 0,
        },
        volume_sparkline: Object.entries(dailyVolume).sort().map(([date, amount]) => ({ date, amount })),
        recent_transactions: (recentTxRes.data || []).map((t: any) => ({ object: 'transaction', ...t })),
        profile: profileRes.data || null,
      }, reqId));
    }

    // GET /composite/transactions — Transaction list with enrichment
    if (resource === 'composite' && resourceId === 'transactions' && method === 'GET') {
      const { limit, offset } = parsePagination(url);
      const status = url.searchParams.get('status');
      const from = url.searchParams.get('created[gte]') || url.searchParams.get('from');
      const to = url.searchParams.get('created[lte]') || url.searchParams.get('to');
      const include = url.searchParams.get('include') || ''; // e.g. "enrichment,fraud_scores"

      let txQuery = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) txQuery = txQuery.eq('status', status);
      if (from) txQuery = txQuery.gte('created_at', from);
      if (to) txQuery = txQuery.lte('created_at', to);

      const { data: txs, count, error } = await txQuery;
      if (error) return logAndReturn(json(500, { error: { type: 'api_error', code: 'query_failed', message: error.message } }, reqId));

      const txIds = (txs || []).map((t: any) => t.id);
      const includes = include.split(',').map(s => s.trim()).filter(Boolean);

      // Parallel side-loads based on `include` param
      const sideLoads: Record<string, Promise<any>> = {};
      if (includes.includes('enrichment') && txIds.length) {
        sideLoads.enrichment = supabase.from('tapix_enrichment_cache').select('transaction_id,merchant_uid,shop_uid,shop_data,merchant_data').in('transaction_id', txIds);
      }
      if (includes.includes('fraud_scores') && txIds.length) {
        sideLoads.fraud_scores = supabase.from('fraud_scores').select('transaction_id,total_score,risk_level,risk_factors').in('transaction_id', txIds);
      }
      if (includes.includes('attempts') && txIds.length) {
        sideLoads.attempts = supabase.from('payment_attempts').select('transaction_id,provider,status,latency_ms,attempt_number').in('transaction_id', txIds).order('attempt_number', { ascending: true });
      }

      const resolved: Record<string, any> = {};
      const sideLoadEntries = Object.entries(sideLoads);
      if (sideLoadEntries.length) {
        const results = await Promise.all(sideLoadEntries.map(([, p]) => p));
        sideLoadEntries.forEach(([key], i) => {
          resolved[key] = results[i]?.data || [];
        });
      }

      // Index side-loaded data by transaction_id
      const enrichMap: Record<string, any> = {};
      const fraudMap: Record<string, any> = {};
      const attemptsMap: Record<string, any[]> = {};
      for (const e of (resolved.enrichment || [])) enrichMap[e.transaction_id] = e;
      for (const f of (resolved.fraud_scores || [])) fraudMap[f.transaction_id] = f;
      for (const a of (resolved.attempts || [])) {
        if (!attemptsMap[a.transaction_id]) attemptsMap[a.transaction_id] = [];
        attemptsMap[a.transaction_id].push(a);
      }

      const enrichedTxs = (txs || []).map((t: any) => ({
        object: 'transaction',
        ...t,
        ...(enrichMap[t.id] ? { enrichment: { merchant: enrichMap[t.id].merchant_data, shop: enrichMap[t.id].shop_data } } : {}),
        ...(fraudMap[t.id] ? { fraud: { score: fraudMap[t.id].total_score, level: fraudMap[t.id].risk_level, factors: fraudMap[t.id].risk_factors } } : {}),
        ...(attemptsMap[t.id] ? { attempts: attemptsMap[t.id] } : {}),
      }));

      return logAndReturn(json(200, {
        object: 'list',
        data: enrichedTxs,
        has_more: (offset + limit) < (count || 0),
        total_count: count,
        url: '/v1/composite/transactions',
      }, reqId));
    }

    // GET /composite/treasury — Wallets + settlements + payouts in one call
    if (resource === 'composite' && resourceId === 'treasury' && method === 'GET') {
      const [walletsRes, settlementsRes, payoutsRes, fxRes] = await Promise.all([
        supabase.from('merchant_accounts').select('*').eq('merchant_id', merchantId),
        supabase.from('settlements').select('*').eq('merchant_id', merchantId).order('created_at', { ascending: false }).limit(20),
        supabase.from('payouts').select('*').eq('merchant_id', merchantId).order('created_at', { ascending: false }).limit(20),
        supabase.from('fx_rates').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      return logAndReturn(json(200, {
        object: 'composite.treasury',
        accounts: walletsRes.data || [],
        recent_settlements: settlementsRes.data || [],
        recent_payouts: payoutsRes.data || [],
        fx_rates: (fxRes.data || []).reduce((acc: Record<string, number>, r: any) => {
          acc[`${r.base_currency}_${r.quote_currency}`] = r.rate;
          return acc;
        }, {}),
      }, reqId));
    }

    // POST /composite/screen — Generic BFF: client declares what it needs
    if (resource === 'composite' && resourceId === 'screen' && method === 'POST') {
      const body = await req.json();
      // body.queries: array of { key: string, table: string, select?: string, filters?: Record<string, any>, limit?: number, order?: string }
      if (!body.queries || !Array.isArray(body.queries)) {
        return logAndReturn(json(400, { error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'queries array is required' } }, reqId));
      }

      // Allowlisted tables merchants can query
      const allowedTables = new Set([
        'transactions', 'payment_intents', 'customers', 'invoices', 'subscriptions',
        'disputes', 'products', 'subscription_plans', 'payment_methods', 'payment_links',
        'merchant_accounts', 'tapix_enrichment_cache', 'fraud_scores', 'payment_attempts',
      ]);

      const results: Record<string, any> = {};
      const queryPromises = body.queries.map(async (q: any) => {
        if (!allowedTables.has(q.table)) {
          results[q.key] = { error: `Table '${q.table}' is not queryable` };
          return;
        }

        let query = supabase
          .from(q.table)
          .select(q.select || '*', { count: q.count ? 'exact' : undefined })
          .eq('merchant_id', merchantId);

        if (q.filters) {
          for (const [col, val] of Object.entries(q.filters)) {
            if (typeof val === 'object' && val !== null) {
              const ops = val as Record<string, any>;
              if (ops.gte) query = query.gte(col, ops.gte);
              if (ops.lte) query = query.lte(col, ops.lte);
              if (ops.eq) query = query.eq(col, ops.eq);
              if (ops.in) query = query.in(col, ops.in);
            } else {
              query = query.eq(col, val);
            }
          }
        }

        if (q.order) query = query.order(q.order, { ascending: q.ascending ?? false });
        if (q.limit) query = query.limit(q.limit);

        const { data, count: cnt, error: qErr } = await query;
        results[q.key] = qErr ? { error: qErr.message } : { data, ...(q.count ? { count: cnt } : {}) };
      });

      await Promise.all(queryPromises);

      return logAndReturn(json(200, {
        object: 'composite.screen',
        results,
      }, reqId));
    }

    const notFoundResp = json(404, { error: { type: 'invalid_request_error', code: 'route_not_found', message: `No such route: ${method} /${pathParts.join('/')}`, doc_url: 'https://developers.everpayinc.com/api' } }, reqId);
    return logAndReturn(notFoundResp);

  } catch (err) {
    console.error('API v2 error:', err);
    const errResp = json(500, { error: { type: 'api_error', code: 'internal_error', message: 'An unexpected error occurred. Please retry the request.' } }, reqId);
    return logAndReturn(errResp);
  }
});
