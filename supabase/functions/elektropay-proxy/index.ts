import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { recordProviderLedger } from "../_shared/ledger.ts";

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
    if (!apiKey || !apiSecret) {
      // Don't 500 — the dashboard polls this on render. Return a structured warning
      // so the UI can render "configure provider" instead of a red error.
      return new Response(
        JSON.stringify({ ok: false, configured: false, balances: [], warning: 'elektropay_credentials_missing' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = await req.json();
    const { action, ...params } = body;
    // Elektropay v3 expects API-Key + API-Secret headers (not Basic). Send both for
    // forward compatibility so the upstream stops returning 401 + HTML.
    const headers: Record<string, string> = {
      'API-Key': apiKey,
      'API-Secret': apiSecret,
      'Authorization': `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    const url = resolveUrl(params.country, params.endpoint_override);

    const safeJson = async (res: Response) => {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json().catch(() => ({}));
      const text = await res.text().catch(() => '');
      return { non_json_upstream: true, status: res.status, body_preview: text.slice(0, 200) };
    };

    let result: any;
    switch (action) {
      case 'ping':
      case 'get_assets': {
        const res = await fetch(`${url}/assets`, { headers });
        result = await safeJson(res);
        if (action === 'ping') result = { ok: res.ok, status: res.status };
        break;
      }
      case 'balances':
      case 'get_accounts': {
        const res = await fetch(`${url}/accounts`, { headers });
        const data = await safeJson(res);
        result = { balances: data.accounts || data.balances || [], raw: data, ok: res.ok };
        break;
      }
      case 'sync_balances': {
        const res = await fetch(`${url}/accounts`, { headers });
        const accountsData = await safeJson(res);
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
      case 'create_store': {
        // POST /store — register a store for a merchant, per Elektropay v3.3 docs.
        const res = await fetch(`${url}/store`, {
          method: 'POST', headers, body: JSON.stringify(params.payload || {}),
        });
        result = { ...(await safeJson(res)), ok: res.ok, status: res.status };
        break;
      }
      case 'create_wallet':
      case 'dedicate': {
        // POST /dedicate — assign a dedicated crypto address (wallet) for a customer.
        const payload = params.payload || {};
        const res = await fetch(`${url}/dedicate`, {
          method: 'POST', headers, body: JSON.stringify(payload),
        });
        const data = await safeJson(res);
        // Persist to elektropay_wallets so the merchant dashboard reflects it
        try {
          if (params.merchant_id && data.address_id) {
            await supabase.from('elektropay_wallets').upsert({
              merchant_id: params.merchant_id,
              asset_id: payload.asset_id || 'USDT.TRC20',
              currency: (payload.asset_id || 'USDT').split('.')[0],
              crypto_network: payload.crypto_network || 'TRON',
              elektropay_account_id: data.address_id,
              elektropay_store_id: payload.store_id || null,
            }, { onConflict: 'merchant_id,asset_id' });
          }
        } catch (e) { console.warn('elektropay wallet upsert failed', e); }
        result = { ...data, ok: res.ok };
        break;
      }
      case 'auto_provision_wallet': {
        // Auto-open a USDT wallet for international (non-US/non-CA) merchants.
        const country = (params.country || '').toUpperCase();
        const attempt_id: string = params.attempt_id || crypto.randomUUID();
        const baseEvt = { merchant_id: params.merchant_id, attempt_id, country };
        if (['US', 'CA'].includes(country)) {
          result = { skipped: true, reason: 'us_or_canada_excluded' };
          if (params.merchant_id) {
            await supabase.from('provider_events').insert({
              provider: 'elektropay', event_type: 'wallet.provision.skipped',
              merchant_id: params.merchant_id,
              payload: { ...baseEvt, reason: 'us_or_canada_excluded' },
            }).then(() => {}, () => {});
            await supabase.from('event_logs').insert({
              event_type: 'wallet.auto_provision.skipped', source_service: 'elektropay-proxy',
              payload: baseEvt,
            }).then(() => {}, () => {});
          }
          result.attempt_id = attempt_id;
          break;
        }
        const payload = {
          asset_id: 'USDT.TRC20',
          crypto_network: 'TRON',
          dedicate_type: 'USES',
          store_id: params.store_id,
          custom: { merchant_id: params.merchant_id, withdraw_only: true },
        };
        const res = await fetch(`${url}/dedicate`, {
          method: 'POST', headers, body: JSON.stringify(payload),
        });
        const data = await safeJson(res);
        if (params.merchant_id && data.address_id) {
          await supabase.from('elektropay_wallets').upsert({
            merchant_id: params.merchant_id,
            asset_id: 'USDT.TRC20',
            currency: 'USDT',
            crypto_network: 'TRON',
            wallet_address: data.address || data.wallet_address || null,
            address_id: data.address_id,
            elektropay_account_id: data.address_id,
            elektropay_store_id: params.store_id || null,
          }, { onConflict: 'merchant_id,asset_id' });
        }
        if (params.merchant_id) {
          const success = res.ok && !!data.address_id;
          await supabase.from('provider_events').insert({
            provider: 'elektropay',
            event_type: success ? 'wallet.provision.success' : 'wallet.provision.failed',
            merchant_id: params.merchant_id,
            payload: { ...baseEvt, asset_id: 'USDT.TRC20', address_id: data.address_id || null, status: res.status, upstream: data },
          }).then(() => {}, () => {});
          await supabase.from('event_logs').insert({
            event_type: success ? 'wallet.auto_provision.success' : 'wallet.auto_provision.failed',
            source_service: 'elektropay-proxy',
            payload: { ...baseEvt, address_id: data.address_id || null, error: success ? null : data },
          }).then(() => {}, () => {});
        }
        result = { ...data, withdraw_only: true, ok: res.ok, attempt_id };
        break;
      }
      case 'create_payment':
      case 'deposit': {
        // POST /payment — create a deposit payment. Returns PAYMENT_URL for the user.
        const res = await fetch(`${url}/payment`, {
          method: 'POST', headers, body: JSON.stringify(params.payload || {}),
        });
        const data = await safeJson(res);
        if (res.ok && params.merchant_id && data.payment_id) {
          try {
            await recordProviderLedger(supabase, {
              merchantId: params.merchant_id,
              provider: 'elektropay',
              providerRef: String(data.payment_id),
              amount: Number(params.payload?.amount || 0),
              currency: (params.payload?.asset_id || 'USDT').split('.')[0],
              status: 'pending',
              type: 'deposit',
              entryType: 'credit',
              metadata: { upstream: data },
            });
          } catch (e) { console.warn('elektropay deposit ledger failed', e); }
        }
        result = { ...data, ok: res.ok };
        break;
      }
      case 'withdraw':
      case 'payout': {
        // POST /withdraw — payout from store balance to external address.
        const res = await fetch(`${url}/withdraw`, {
          method: 'POST', headers, body: JSON.stringify(params.payload || {}),
        });
        const data = await safeJson(res);
        if (res.ok && params.merchant_id && data.withdraw_id) {
          try {
            await recordProviderLedger(supabase, {
              merchantId: params.merchant_id,
              provider: 'elektropay',
              providerRef: String(data.withdraw_id),
              amount: Number(params.payload?.amount || data.amount || 0),
              currency: (params.payload?.asset_id || data.asset_id || 'USDT').split('.')[0],
              status: data.status || 'processing',
              type: 'payout',
              entryType: 'debit',
              metadata: { upstream: data },
            });
          } catch (e) { console.warn('elektropay payout ledger failed', e); }
        }
        result = { ...data, ok: res.ok };
        break;
      }
      case 'transfer': {
        // POST /transfer — move balance between two stores.
        const res = await fetch(`${url}/transfer`, {
          method: 'POST', headers, body: JSON.stringify(params.payload || {}),
        });
        const data = await safeJson(res);
        result = { ...data, ok: res.ok };
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