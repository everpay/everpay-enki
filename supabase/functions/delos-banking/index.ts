// Delos Financial — USD/EUR banking proxy.
// Endpoints assumed; adjust BASE_URL / paths once provider docs are confirmed.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const KEY = Deno.env.get('DELOS_API_KEY');
    if (!KEY) throw new Error('DELOS_API_KEY not configured');
    // Reachable Delos production host (api.delosfinancial.com does not resolve).
    // Override with DELOS_BASE_URL secret if your tenant uses a different domain.
    const BASE = Deno.env.get('DELOS_BASE_URL') || 'https://api.delos.finance/v1';
    const body = await req.json().catch(() => ({}));
    const { action } = body;
    const headers = { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' };

    if (action === 'ping') {
      const res = await fetch(`${BASE}/accounts?limit=1`, { headers });
      return new Response(JSON.stringify({ ok: res.ok, status: res.status }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (action === 'list_accounts') {
      const res = await fetch(`${BASE}/accounts`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(`Delos list failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (action === 'balance') {
      const res = await fetch(`${BASE}/accounts/${body.accountId}/balance`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(`Delos balance failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (action === 'payout') {
      const res = await fetch(`${BASE}/payouts`, { method: 'POST', headers, body: JSON.stringify(body.payload || {}) });
      const data = await res.json();
      if (!res.ok) throw new Error(`Delos payout failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Delos error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});