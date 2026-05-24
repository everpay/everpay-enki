import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-everpay-api-key',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/**
 * Everpay v2 Webhook Events Reference
 *
 * Merchants can subscribe to these events via the /v1/webhooks/endpoints API:
 *
 * payment.created      — New payment initiated
 * payment.completed    — Payment successfully processed
 * payment.failed       — Payment declined or errored
 * payment.refunded     — Payment fully refunded
 * payment.partially_refunded — Partial refund issued
 * payment.captured     — Authorized payment captured
 *
 * refund.created       — Refund initiated
 * refund.completed     — Refund fully processed
 * refund.failed        — Refund attempt failed
 *
 * dispute.created      — New chargeback/dispute opened
 * dispute.updated      — Dispute status changed
 * dispute.won          — Dispute resolved in merchant's favor
 * dispute.lost         — Dispute resolved against merchant
 *
 * subscription.created       — New subscription
 * subscription.renewed       — Subscription period renewed
 * subscription.canceled      — Subscription canceled
 * subscription.past_due      — Subscription payment failed
 *
 * customer.created     — New customer record
 * customer.updated     — Customer details changed
 *
 * payout.created       — Payout initiated
 * payout.completed     — Payout sent to bank
 * payout.failed        — Payout failed
 *
 * invoice.created      — Invoice generated
 * invoice.paid         — Invoice payment received
 * invoice.overdue      — Invoice past due date
 *
 * All webhook deliveries include:
 *   - X-Everpay-Signature header (HMAC-SHA256 of payload using endpoint secret)
 *   - X-Everpay-Event header (event type)
 *   - X-Everpay-Timestamp header (ISO 8601)
 *   - Payload: { id, event, data, created_at, api_version: "v2" }
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { merchant_id, event_type, payload } = await req.json();

    if (!merchant_id || !event_type) {
      return json(400, { error: 'merchant_id and event_type required' });
    }

    // Fetch all active webhook endpoints for this merchant
    const { data: endpoints } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('merchant_id', merchant_id)
      .eq('active', true);

    const results = [];
    const timestamp = new Date().toISOString();

    for (const endpoint of endpoints || []) {
      // Check if endpoint subscribes to this event
      const events = (endpoint.events as string[]) || [];
      if (events.length > 0 && !events.includes('*') && !events.includes(event_type)) continue;

      if (!endpoint.secret) continue;

      // Build the webhook payload
      const webhookPayload = {
        id: `evt_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
        event: event_type,
        data: payload,
        created_at: timestamp,
        api_version: 'v2',
      };

      const payloadStr = JSON.stringify(webhookPayload);

      // Create HMAC-SHA256 signature
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(endpoint.secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadStr));
      const signature = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

      let deliveryStatus = 'pending';
      let responseStatus: number | null = null;
      let responseBody: string | null = null;

      try {
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Everpay-Signature': signature,
            'X-Everpay-Event': event_type,
            'X-Everpay-Timestamp': timestamp,
            'User-Agent': 'Everpay-Webhooks/2.0',
          },
          body: payloadStr,
        });
        responseStatus = response.status;
        responseBody = await response.text().catch(() => null);
        deliveryStatus = response.ok ? 'delivered' : 'failed';
      } catch (fetchErr) {
        deliveryStatus = 'failed';
        responseBody = fetchErr instanceof Error ? fetchErr.message : 'Delivery failed';
      }

      // Log delivery
      await supabase.from('webhook_deliveries').insert({
        endpoint_id: endpoint.id,
        merchant_id,
        event_type,
        payload: webhookPayload,
        response_status: responseStatus,
        response_body: responseBody?.substring(0, 2000),
        status: deliveryStatus,
        delivered_at: deliveryStatus === 'delivered' ? timestamp : null,
      });

      results.push({ endpoint_id: endpoint.id, status: deliveryStatus, response_status: responseStatus });
    }

    return json(200, { dispatched: results.length, results });
  } catch (err) {
    console.error('Webhook delivery error:', err);
    return json(500, { error: 'Internal server error' });
  }
});
