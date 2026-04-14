import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface GatewayRequest {
  action: string;
  provider: string;
  data: Record<string, unknown>;
}

interface GatewayResponse {
  success: boolean;
  provider: string;
  transaction_id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  raw?: unknown;
  error?: string;
}

// ─── Moneto (CAD / USD) ─────────────────────────────────────────────
async function monetoCharge(data: Record<string, unknown>, env: Record<string, string>): Promise<GatewayResponse> {
  const credentials = btoa(`${env.MONETO_MERCHANT_ID}:${env.MONETO_MERCHANT_SECRET}`);
  const baseUrl = env.MONETO_BASE_URL || 'https://demo.genwin.app';
  const res = await fetch(`${baseUrl}/api/v1/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${credentials}` },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { success: res.ok, provider: 'moneto', transaction_id: body.id || body.payment_id, status: body.status, amount: data.amount as number, currency: (data.currency as string) || 'CAD', raw: body, ...(!res.ok && { error: body.message || res.statusText }) };
}

// ─── ShieldHubPay (US High-Risk) ────────────────────────────────────
async function shieldhubpayCharge(data: Record<string, unknown>, env: Record<string, string>): Promise<GatewayResponse> {
  const baseUrl = env.SHIELDHUBPAY_BASE_URL || 'https://sandbox.shieldhubpay.com';
  const res = await fetch(`${baseUrl}/api/v1/charges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-Id': env.SHIELDHUBPAY_CLIENT_ID, 'X-Api-Secret': env.SHIELDHUBPAY_API_SECRET },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { success: res.ok, provider: 'shieldhubpay', transaction_id: body.transaction_id || body.id, status: body.status, amount: data.amount as number, currency: (data.currency as string) || 'USD', raw: body, ...(!res.ok && { error: body.message || res.statusText }) };
}

// ─── SmartFastPay (LATAM) ───────────────────────────────────────────
async function smartfastpayCharge(data: Record<string, unknown>, env: Record<string, string>): Promise<GatewayResponse> {
  const baseUrl = env.SMARTFASTPAY_BASE_URL || 'https://sandbox.smartfastpay.com';
  const res = await fetch(`${baseUrl}/api/v1/payin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.SMARTFASTPAY_API_KEY}` },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { success: res.ok, provider: 'smartfastpay', transaction_id: body.id || body.transaction_id, status: body.status, amount: data.amount as number, currency: (data.currency as string) || 'USD', raw: body, ...(!res.ok && { error: body.message || res.statusText }) };
}

async function smartfastpayPayout(data: Record<string, unknown>, env: Record<string, string>): Promise<GatewayResponse> {
  const baseUrl = env.SMARTFASTPAY_BASE_URL || 'https://sandbox.smartfastpay.com';
  const res = await fetch(`${baseUrl}/api/v1/payout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.SMARTFASTPAY_API_KEY}` },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { success: res.ok, provider: 'smartfastpay', transaction_id: body.id, status: body.status, raw: body, ...(!res.ok && { error: body.message || res.statusText }) };
}

// ─── Global Payments (user-supplied credentials) ────────────────────
async function globalpaymentsCharge(data: Record<string, unknown>, _env: Record<string, string>): Promise<GatewayResponse> {
  const credentials = data._credentials as Record<string, string> | undefined;
  if (!credentials?.api_key || !credentials?.api_secret) {
    return { success: false, provider: 'global_payments', error: 'Missing credentials: api_key and api_secret are required' };
  }
  const baseUrl = (credentials.base_url as string) || 'https://apis.sandbox.globalpay.com';
  const payload = { ...data }; delete payload._credentials;
  const res = await fetch(`${baseUrl}/ucp/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-GP-Api-Key': credentials.api_key, 'X-GP-Api-Secret': credentials.api_secret, 'X-GP-Version': '2021-03-22' },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  return { success: res.ok, provider: 'global_payments', transaction_id: body.id, status: body.status, amount: data.amount as number, currency: (data.currency as string) || 'USD', raw: body, ...(!res.ok && { error: body.error_message || res.statusText }) };
}

// ─── Adyen (user-supplied credentials) ──────────────────────────────
async function adyenCharge(data: Record<string, unknown>, _env: Record<string, string>): Promise<GatewayResponse> {
  const credentials = data._credentials as Record<string, string> | undefined;
  if (!credentials?.api_key || !credentials?.merchant_account) {
    return { success: false, provider: 'adyen', error: 'Missing credentials: api_key and merchant_account are required' };
  }
  const baseUrl = (credentials.base_url as string) || 'https://checkout-test.adyen.com/v71';
  const payload = { ...data }; delete payload._credentials;
  const res = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': credentials.api_key },
    body: JSON.stringify({ merchantAccount: credentials.merchant_account, ...payload }),
  });
  const body = await res.json();
  return { success: res.ok && body.resultCode === 'Authorised', provider: 'adyen', transaction_id: body.pspReference, status: body.resultCode, amount: (data.amount as Record<string, unknown>)?.value as number, currency: (data.amount as Record<string, unknown>)?.currency as string, raw: body, ...(!res.ok && { error: body.message || res.statusText }) };
}

// ─── Mondo (EU) ─────────────────────────────────────────────────────
async function mondoCharge(data: Record<string, unknown>, env: Record<string, string>): Promise<GatewayResponse> {
  const baseUrl = env.MONDO_BASE_URL || 'https://server-to-server.getmondo.co';
  const res = await fetch(`${baseUrl}/api/v1/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.MONDO_API_KEY}` },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { success: res.ok, provider: 'mondo', transaction_id: body.transaction_id || body.id, status: body.status, amount: data.amount as number, currency: (data.currency as string) || 'EUR', raw: body, ...(!res.ok && { error: body.message || res.statusText }) };
}

// ─── Marasoft (Africa NGN/KSH) ─────────────────────────────────────
async function marasoftCharge(data: Record<string, unknown>, env: Record<string, string>): Promise<GatewayResponse> {
  const res = await fetch('https://api.marasoftpay.live/checkouttransaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.MARASOFT_API_KEY}` },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { success: res.ok, provider: 'marasoft', transaction_id: body.transaction_id || body.data?.reference, status: body.status, amount: data.amount as number, currency: (data.currency as string) || 'NGN', raw: body, ...(!res.ok && { error: body.message || res.statusText }) };
}

async function marasoftPayout(data: Record<string, unknown>, env: Record<string, string>): Promise<GatewayResponse> {
  const res = await fetch('https://api.marasoftpay.live/createtransfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.MARASOFT_API_KEY}` },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { success: res.ok, provider: 'marasoft', transaction_id: body.reference, status: body.status, raw: body, ...(!res.ok && { error: body.message || res.statusText }) };
}

// ─── Lipad (Africa Mobile Money) ────────────────────────────────────
async function lipadCharge(data: Record<string, unknown>, env: Record<string, string>): Promise<GatewayResponse> {
  const baseUrl = env.LIPAD_BASE_URL || 'https://api-dev.lipad.io';
  const res = await fetch(`${baseUrl}/api/v1/direct/charge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.LIPAD_API_KEY}` },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { success: res.ok, provider: 'lipad', transaction_id: body.transaction_id || body.data?.id, status: body.status, amount: data.amount as number, currency: (data.currency as string) || 'KES', raw: body, ...(!res.ok && { error: body.message || res.statusText }) };
}

async function lipadPayout(data: Record<string, unknown>, env: Record<string, string>): Promise<GatewayResponse> {
  const baseUrl = env.LIPAD_BASE_URL || 'https://api-dev.lipad.io';
  const res = await fetch(`${baseUrl}/api/v1/payouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.LIPAD_API_KEY}` },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { success: res.ok, provider: 'lipad', transaction_id: body.id, status: body.status, raw: body, ...(!res.ok && { error: body.message }) };
}

async function lipadFxRate(data: Record<string, unknown>, env: Record<string, string>): Promise<GatewayResponse> {
  const baseUrl = env.LIPAD_BASE_URL || 'https://api-dev.lipad.io';
  const res = await fetch(`${baseUrl}/api/v1/fx/rate?from=${data.from}&to=${data.to}&amount=${data.amount}`, {
    headers: { 'Authorization': `Bearer ${env.LIPAD_API_KEY}` },
  });
  const body = await res.json();
  return { success: res.ok, provider: 'lipad', raw: body, ...(!res.ok && { error: body.message }) };
}

// ─── Paygate10 (Africa/Global) ──────────────────────────────────────
async function paygate10Request(data: Record<string, unknown>, env: Record<string, string>): Promise<GatewayResponse> {
  const baseUrl = env.PAYGATE10_BASE_URL || 'https://sandboxwebapi.paygate10.com';
  const res = await fetch(`${baseUrl}/api/process/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': env.PAYGATE10_API_KEY, 'X-Api-Secret': env.PAYGATE10_API_SECRET },
    body: JSON.stringify({ midcode: env.PAYGATE10_MIDCODE, midesecret: env.PAYGATE10_MIDESECRET, ...data }),
  });
  const body = await res.json();
  return { success: res.ok, provider: 'paygate10', transaction_id: body.transaction_id || body.id, status: body.status, raw: body, ...(!res.ok && { error: body.message || res.statusText }) };
}

// ─── PacoPay (LATAM/GCC/Card Payout) ───────────────────────────────
async function pacopayCharge(data: Record<string, unknown>, env: Record<string, string>): Promise<GatewayResponse> {
  const baseUrl = env.PACOPAY_BASE_URL || 'https://sandbox.paco-pay.com';
  const res = await fetch(`${baseUrl}/api/v1/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.PACOPAY_API_KEY}` },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { success: res.ok, provider: 'pacopay', transaction_id: body.id, status: body.status, amount: data.amount as number, currency: (data.currency as string) || 'UYU', raw: body, ...(!res.ok && { error: body.message || res.statusText }) };
}

async function pacopayCardPayout(data: Record<string, unknown>, env: Record<string, string>): Promise<GatewayResponse> {
  const baseUrl = env.PACOPAY_BASE_URL || 'https://sandbox.paco-pay.com';
  const res = await fetch(`${baseUrl}/api/v1/card-payouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.PACOPAY_API_KEY}` },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { success: res.ok, provider: 'pacopay', transaction_id: body.id, status: body.status, raw: body, ...(!res.ok && { error: body.message }) };
}

// ─── Delos Financial (US Banking/ACH) ───────────────────────────────
async function delosRequest(data: Record<string, unknown>, env: Record<string, string>): Promise<GatewayResponse> {
  const baseUrl = env.DELOS_BASE_URL || 'https://stagep.tst-apidmndelss.com/v2';
  const endpoint = (data._endpoint as string) || '/transfers';
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: (data._method as string) || 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.DELOS_API_KEY}` },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { success: res.ok, provider: 'delos', transaction_id: body.id, status: body.status, raw: body, ...(!res.ok && { error: body.message }) };
}

// ─── Brighty (EU SEPA) ──────────────────────────────────────────────
async function brightyRequest(data: Record<string, unknown>, env: Record<string, string>): Promise<GatewayResponse> {
  const baseUrl = env.BRIGHTY_BASE_URL || 'https://api.brighty.codes';
  const endpoint = (data._endpoint as string) || '/transfers';
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: (data._method as string) || 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.BRIGHTY_API_KEY}` },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { success: res.ok, provider: 'brighty', transaction_id: body.id, status: body.status, raw: body, ...(!res.ok && { error: body.message }) };
}

// ─── Elektropay (Crypto) ────────────────────────────────────────────
async function elektropayRequest(data: Record<string, unknown>, env: Record<string, string>): Promise<GatewayResponse> {
  const baseUrl = 'https://apiv3.elektropay.com';
  const endpoint = (data._endpoint as string) || '/wallet';
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: (data._method as string) || 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.ELEKTROPAY_API_KEY}` },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { success: res.ok, provider: 'elektropay', transaction_id: body.id, status: body.status, raw: body, ...(!res.ok && { error: body.message }) };
}

// ═══════════════════════════════════════════════════════════════════
// ACTION ROUTER
// ═══════════════════════════════════════════════════════════════════

const ACTION_MAP: Record<string, Record<string, (data: Record<string, unknown>, env: Record<string, string>) => Promise<GatewayResponse>>> = {
  charge: {
    moneto: monetoCharge, shieldhubpay: shieldhubpayCharge, smartfastpay: smartfastpayCharge,
    global_payments: globalpaymentsCharge, adyen: adyenCharge, mondo: mondoCharge,
    marasoft: marasoftCharge, lipad: lipadCharge, paygate10: paygate10Request,
    pacopay: pacopayCharge,
  },
  payout: {
    smartfastpay: smartfastpayPayout, marasoft: marasoftPayout, lipad: lipadPayout,
    paygate10: paygate10Request, pacopay: pacopayCardPayout, elektropay: elektropayRequest,
    delos: delosRequest, brighty: brightyRequest,
  },
  fx_rate: { lipad: lipadFxRate, paygate10: paygate10Request },
  wallet: { elektropay: elektropayRequest },
  transfer: { delos: delosRequest, brighty: brightyRequest },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const userId = claimsData.claims.sub as string;

    const { action, provider, data = {} }: GatewayRequest = await req.json();

    if (!action || !provider) {
      return json({ error: 'Missing required fields: action, provider' }, 400);
    }

    const providerMap = ACTION_MAP[action];
    if (!providerMap) {
      return json({ error: `Unknown action: ${action}`, available_actions: Object.keys(ACTION_MAP) }, 400);
    }

    const handler = providerMap[provider];
    if (!handler) {
      return json({ error: `Provider "${provider}" does not support action "${action}"`, available_providers: Object.keys(providerMap) }, 400);
    }

    const env: Record<string, string> = {};
    const envKeys = [
      'MONETO_MERCHANT_ID', 'MONETO_MERCHANT_SECRET', 'MONETO_BASE_URL',
      'SHIELDHUBPAY_CLIENT_ID', 'SHIELDHUBPAY_API_SECRET', 'SHIELDHUBPAY_BASE_URL',
      'SMARTFASTPAY_API_KEY', 'SMARTFASTPAY_BASE_URL',
      'MONDO_API_KEY', 'MONDO_BASE_URL', 'MARASOFT_API_KEY',
      'LIPAD_API_KEY', 'LIPAD_BASE_URL',
      'PAYGATE10_API_KEY', 'PAYGATE10_API_SECRET', 'PAYGATE10_MIDCODE', 'PAYGATE10_MIDESECRET', 'PAYGATE10_BASE_URL',
      'PACOPAY_API_KEY', 'PACOPAY_BASE_URL',
      'DELOS_API_KEY', 'DELOS_BASE_URL',
      'BRIGHTY_API_KEY', 'BRIGHTY_BASE_URL',
      'ELEKTROPAY_API_KEY',
    ];
    for (const key of envKeys) {
      const val = Deno.env.get(key);
      if (val) env[key] = val;
    }

    console.log(`[payment-gateway] ${action}/${provider} by user ${userId}`);
    const result = await handler(data, env);

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await serviceClient.from('audit_logs').insert({
      user_id: userId,
      action: `gateway_${action}`,
      entity_type: 'payment_gateway',
      entity_id: result.transaction_id || 'pending',
      metadata: { provider, action, success: result.success, amount: result.amount, currency: result.currency, status: result.status },
    });

    return json(result, result.success ? 200 : 400);

  } catch (error) {
    console.error('[payment-gateway] Error:', error);
    return json({ error: error instanceof Error ? error.message : 'Internal server error' }, 500);
  }
});

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
