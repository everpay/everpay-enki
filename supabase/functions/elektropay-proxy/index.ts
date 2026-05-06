import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ELEKTROPAY_DEFAULT_URL = 'https://apiv3.elektropay.com/int';
const ELEKTROPAY_REGION_URLS: Record<string, string> = {
  LATAM: 'https://latam.apiv3.elektropay.com/int',
  MENA: 'https://mena.apiv3.elektropay.com/int',
  APAC: 'https://apac.apiv3.elektropay.com/int',
  AFRICA: 'https://africa.apiv3.elektropay.com/int',
};
const COUNTRY_TO_REGION: Record<string, keyof typeof ELEKTROPAY_REGION_URLS> = {
  BR: 'LATAM', MX: 'LATAM', CO: 'LATAM', AR: 'LATAM', CL: 'LATAM', PE: 'LATAM',
  AE: 'MENA', SA: 'MENA', EG: 'MENA',
  NG: 'AFRICA', KE: 'AFRICA', ZA: 'AFRICA',
  PH: 'APAC', ID: 'APAC', VN: 'APAC', TH: 'APAC',
};
function resolveUrl(country?: string | null, override?: string | null): string {
  if (override) return override;
  if (!country) return ELEKTROPAY_DEFAULT_URL;
  const region = COUNTRY_TO_REGION[country.toUpperCase()];
  return region ? ELEKTROPAY_REGION_URLS[region] : ELEKTROPAY_DEFAULT_URL;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const apiKey = Deno.env.get('ELEKTROPAY_API_KEY');
    const apiSecret = Deno.env.get('ELEKTROPAY_API_SECRET');
    if (!apiKey || !apiSecret) throw new Error('Elektropay credentials not configured');

    const body = await req.json();
    const { action, ...params } = body;
    const basicAuth = btoa(`${apiKey}:${apiSecret}`);
    const headers = { 'Authorization': `Basic ${basicAuth}`, 'Content-Type': 'application/json' };
    const url = resolveUrl(params.country, params.endpoint_override);

    let result: any;
    switch (action) {
      case 'ping':
      case 'get_assets': {
        const res = await fetch(`${url}/assets`, { headers });
        result = await res.json();
        if (action === 'ping') result = { ok: res.ok, status: res.status };
        break;
      }
      case 'get_accounts': {
        const res = await fetch(`${url}/accounts`, { headers });
        result = await res.json();
        break;
      }
      case 'sync_balances': {
        const res = await fetch(`${url}/accounts`, { headers });
        const accountsData = await res.json();
        if (params.merchant_id && accountsData.accounts) {
          for (const acct of accountsData.accounts) {
            await supabase.from('elektropay_wallets').upsert({
              merchant_id: params.merchant_id,
              asset_id: acct.asset_id,
              currency: acct.currency,
              crypto_network: acct.crypto_network,
              balance: parseFloat(acct.balance || '0'),
              available: parseFloat(acct.available || '0'),
              on_hold: parseFloat(acct.on_hold || '0'),
              base_balance: parseFloat(acct.base_balance || '0'),
              base_currency: acct.base_currency || 'USD',
              elektropay_account_id: acct.account_id,
              elektropay_store_id: acct.store_id,
            }, { onConflict: 'merchant_id,asset_id' });
          }
        }
        result = accountsData;
        break;
      }
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Elektropay error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});