// Brighty banking provider — EUR/CHF rail.
// Mirrors the delos-banking surface (ping/list_accounts/balance/payout) and writes
// ledger + transaction rows on successful payouts so the dashboard reflects activity.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const KEY = Deno.env.get('BRIGHTY_API_KEY');
    if (!KEY) {
      return new Response(
        JSON.stringify({ error: 'BRIGHTY_API_KEY not configured', balances: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const BASE = Deno.env.get('BRIGHTY_BASE_URL') || 'https://api.brighty.app/v1';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const body = await req.json().catch(() => ({}));
    const { action } = body;
    const headers = { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' };

    if (action === 'ping') {
      const res = await fetch(`${BASE}/accounts?limit=1`, { headers }).catch(() => null);
      return new Response(
        JSON.stringify({ ok: !!res?.ok, status: res?.status ?? 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'balances' || action === 'list_accounts') {
      const res = await fetch(`${BASE}/accounts`, { headers });
      const data = await res.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ balances: data.accounts || data.balances || [], raw: data }),
        { status: res.ok ? 200 : 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'payout') {
      const res = await fetch(`${BASE}/payouts`, {
        method: 'POST', headers, body: JSON.stringify(body.payload || {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: `Brighty payout failed [${res.status}]`, detail: data }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      // Write transaction + ledger entry
      const amount = Number(body.payload?.amount || 0);
      const currency = (body.payload?.currency || 'EUR').toUpperCase();
      const txId = data.id || data.payout_id || crypto.randomUUID();
      try {
        await supabase.from('transactions').insert({
          merchant_id: body.merchant_id,
          provider: 'brighty',
          provider_ref: txId,
          amount, currency,
          status: data.status || 'processing',
          type: 'payout',
        });
        await supabase.from('ledger_entries').insert({
          merchant_id: body.merchant_id,
          provider: 'brighty',
          reference: txId,
          currency, amount,
          direction: 'debit',
          description: body.payload?.description || 'Brighty payout',
        });
      } catch (e) {
        console.warn('brighty ledger write failed', e);
      }
      return new Response(
        JSON.stringify({ ...data, transaction_id: txId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Brighty error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});