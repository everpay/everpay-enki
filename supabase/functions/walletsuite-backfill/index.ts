import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { verifyJwt } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = await verifyJwt(req, { requireRoles: ['admin', 'super_admin'] });
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const KEY = Deno.env.get('WALLETSUITE_API_KEY');
    const BASE = Deno.env.get('WALLETSUITE_BASE_URL') || 'https://api.walletsuite.io';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.json().catch(() => ({}));
    const currencies: string[] = Array.isArray(body.currencies) && body.currencies.length
      ? body.currencies
      : ['USD', 'EUR', 'GBP'];
    const dryRun = !!body.dryRun || !KEY;

    const { data: merchants, error: mErr } = await supabase
      .from('merchants')
      .select('id, name, user_id');
    if (mErr) throw mErr;

    const { data: existing, error: eErr } = await supabase
      .from('treasury_wallets')
      .select('asset, metadata')
      .eq('provider', 'walletsuite');
    if (eErr) throw eErr;

    const have = new Set(
      (existing ?? []).map((w: any) => `${w.metadata?.merchant_id}:${w.asset}`),
    );

    const results: any[] = [];
    for (const m of merchants ?? []) {
      for (const cur of currencies) {
        const key = `${m.id}:${cur}`;
        if (have.has(key)) {
          results.push({ merchant_id: m.id, currency: cur, status: 'skipped' });
          continue;
        }

        let externalId: string | null = null;
        let address: string | null = null;

        if (!dryRun) {
          try {
            const res = await fetch(`${BASE}/wallets`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: m.user_id,
                currency: cur,
                label: `${m.name} ${cur}`,
                metadata: { merchant_id: m.id },
              }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
              externalId = data.id ?? data.wallet_id ?? null;
              address = data.address ?? null;
            } else {
              results.push({ merchant_id: m.id, currency: cur, status: 'api_error', detail: data });
              continue;
            }
          } catch (err) {
            results.push({ merchant_id: m.id, currency: cur, status: 'fetch_failed', error: String(err) });
            continue;
          }
        }

        const { error: insErr } = await supabase.from('treasury_wallets').insert({
          label: `${m.name} ${cur}`,
          provider: 'walletsuite',
          asset: cur,
          network: 'fiat',
          address,
          external_wallet_id: externalId,
          metadata: { merchant_id: m.id, backfilled: true, dry_run: dryRun },
        });
        if (insErr) {
          results.push({ merchant_id: m.id, currency: cur, status: 'db_error', error: insErr.message });
        } else {
          results.push({ merchant_id: m.id, currency: cur, status: dryRun ? 'seeded_local' : 'created' });
        }
      }
    }

    const summary = results.reduce((acc: Record<string, number>, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});

    return new Response(JSON.stringify({ ok: true, dryRun, summary, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('walletsuite-backfill error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});