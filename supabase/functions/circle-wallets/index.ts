// Circle Developer-Controlled Wallets + USDC payouts.
// Docs: https://developers.circle.com/wallets/dev-controlled
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE = Deno.env.get('CIRCLE_BASE_URL') || 'https://api.circle.com/v1';
const W3S_BASE = Deno.env.get('CIRCLE_W3S_BASE_URL') || 'https://api.circle.com/v1/w3s';

function authHeaders() {
  const KEY = Deno.env.get('CIRCLE_API_KEY');
  if (!KEY) throw new Error('CIRCLE_API_KEY not configured');
  return { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const headers = authHeaders();
    const body = await req.json().catch(() => ({}));
    const { action } = body;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    if (action === 'ping') {
      const res = await fetch(`${BASE}/ping`, { headers });
      return new Response(JSON.stringify({ ok: res.ok, status: res.status }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create a developer-controlled wallet set then a wallet.
    if (action === 'create_wallet_set') {
      const res = await fetch(`${W3S_BASE}/developer/walletSets`, {
        method: 'POST', headers,
        body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), name: body.name || 'Everpay Treasury' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Circle walletSet failed [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_wallet') {
      const res = await fetch(`${W3S_BASE}/developer/wallets`, {
        method: 'POST', headers,
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          accountType: body.accountType || 'SCA',
          blockchains: body.blockchains || ['MATIC-AMOY','ETH-SEPOLIA'],
          count: 1,
          walletSetId: body.walletSetId,
          metadata: body.metadata ? [body.metadata] : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Circle wallet failed [${res.status}]: ${JSON.stringify(data)}`);

      const wallets = data?.data?.wallets || [];
      for (const w of wallets) {
        await supabase.from('treasury_wallets').insert({
          label: body.label || `Circle ${w.blockchain}`,
          provider: 'circle',
          asset: 'USDC',
          network: w.blockchain,
          address: w.address,
          external_wallet_id: w.id,
          metadata: { walletSetId: body.walletSetId, accountType: w.accountType },
        });
      }
      return new Response(JSON.stringify({ wallets }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'list_wallets') {
      const res = await fetch(`${W3S_BASE}/wallets`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(`Circle list wallets [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'wallet_balance') {
      const res = await fetch(`${W3S_BASE}/wallets/${body.walletId}/balances`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(`Circle balance [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Send USDC payout — paymaster covers gas in USDC when feeLevel=USDC.
    if (action === 'usdc_payout') {
      const res = await fetch(`${W3S_BASE}/developer/transactions/transfer`, {
        method: 'POST', headers,
        body: JSON.stringify({
          idempotencyKey: body.idempotencyKey || crypto.randomUUID(),
          walletId: body.walletId,
          tokenId: body.tokenId,
          destinationAddress: body.destinationAddress,
          amounts: [String(body.amount)],
          feeLevel: body.feeLevel || 'MEDIUM',
          ...(body.payInUsdc ? { erc20FeePayment: 'USDC' } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Circle USDC payout [${res.status}]: ${JSON.stringify(data)}`);
      await supabase.from('audit_logs').insert({
        user_id: body.merchantId || '00000000-0000-0000-0000-000000000000',
        action: 'circle_usdc_payout', entity_type: 'transfer', entity_id: data.data?.id,
        metadata: { amount: body.amount, destination: body.destinationAddress },
      });
      return new Response(JSON.stringify(data.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // CPN — managed payments / cross-border payouts in USDC settling to fiat.
    if (action === 'cpn_payout') {
      const res = await fetch(`${BASE}/businessAccount/payouts`, {
        method: 'POST', headers,
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          source: { type: 'wallet', id: body.walletId },
          destination: body.destination,
          amount: { amount: String(body.amount), currency: body.currency || 'USD' },
          metadata: { beneficiaryEmail: body.email, merchantId: body.merchantId },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Circle CPN payout [${res.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Circle wallets error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});