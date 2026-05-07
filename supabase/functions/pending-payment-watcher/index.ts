import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Pending Payment Watcher
 *
 * Marks transactions as `failed` when:
 *   - status='pending'
 *   - older than PENDING_TIMEOUT_MIN minutes (default 15)
 *   - AND no provider_event indicates capture/authorization within that window.
 *
 * Designed to run from pg_cron every 5 minutes. Idempotent — safe to re-run.
 */

const PENDING_TIMEOUT_MIN = Number(Deno.env.get('PENDING_TIMEOUT_MIN') || '15');
// Provider event types that prove the funds moved (or are guaranteed to)
const SUCCESS_EVENT_TYPES = [
  'payment.captured', 'payment.authorized', 'payment.completed', 'payment.succeeded',
  'charge.captured', 'charge.succeeded', 'transaction.approved',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const cutoff = new Date(Date.now() - PENDING_TIMEOUT_MIN * 60_000).toISOString();

  // 1) Find candidate stuck pending transactions
  const { data: stuck, error } = await supabase
    .from('transactions')
    .select('id, merchant_id, provider, provider_ref, created_at, metadata')
    .eq('status', 'pending')
    .lt('created_at', cutoff)
    .limit(500);

  if (error) {
    console.error('watcher: query failed', error);
    return new Response(JSON.stringify({ error: 'query_failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  if (!stuck || stuck.length === 0) {
    return new Response(JSON.stringify({ checked: 0, failed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let failed = 0;
  for (const tx of stuck) {
    // 2) Look for any success-class provider_event for this tx
    const { data: events } = await supabase
      .from('provider_events')
      .select('event_type')
      .eq('transaction_id', tx.id)
      .in('event_type', SUCCESS_EVENT_TYPES)
      .limit(1);

    if (events && events.length > 0) {
      // Funds moved — promote to completed instead of failing
      const completedMeta = { ...(tx.metadata || {}), last_status_source: 'watcher', last_status_reason: 'Auto-completed: success event observed' };
      await supabase.from('transactions').update({ status: 'completed', metadata: completedMeta, updated_at: new Date().toISOString() }).eq('id', tx.id);
      continue;
    }

    // 3) No proof of capture → mark failed
    const newMeta = {
      ...(tx.metadata || {}),
      auto_failed: true,
      auto_failed_at: new Date().toISOString(),
      auto_failed_reason: `No capture/authorization event within ${PENDING_TIMEOUT_MIN} minutes`,
      last_status_source: 'watcher',
      last_status_reason: `Auto-failed: no capture/authorization within ${PENDING_TIMEOUT_MIN}m`,
    };
    const { error: updErr } = await supabase
      .from('transactions')
      .update({ status: 'failed', metadata: newMeta, updated_at: new Date().toISOString() })
      .eq('id', tx.id)
      .eq('status', 'pending'); // guard against race
    if (updErr) {
      console.error('watcher: update failed', tx.id, updErr);
      continue;
    }

    await supabase.from('provider_events').insert({
      merchant_id: tx.merchant_id,
      transaction_id: tx.id,
      provider: tx.provider || 'system',
      event_type: 'payment.timeout',
      payload: { reason: 'pending_timeout', timeout_minutes: PENDING_TIMEOUT_MIN },
    });
    failed++;
  }

  return new Response(JSON.stringify({ checked: stuck.length, failed, timeout_min: PENDING_TIMEOUT_MIN }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
