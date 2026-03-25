import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
  customerEmail?: string;
  description?: string;
  idempotencyKey?: string;
  source?: string;
  orderId?: string;
  successUrl?: string;
  cancelUrl?: string;
  sandboxMode?: boolean;
  cardDetails?: { number: string; expMonth: string; expYear: string; cvc: string; holderName?: string };
  customerDetails?: { firstName?: string; lastName?: string; phone?: string; ip?: string };
  billingDetails?: { address?: string; postalCode?: string; city?: string; state?: string; country?: string };
  deviceInfo?: { device_type?: string; os?: string; browser?: string; browser_version?: string; screen_resolution?: string; timezone?: string; ip_address?: string; user_agent?: string };
}

// Country → Provider routing
const countryProviderMap: Record<string, string> = {
  US: 'shieldhub',
  GB: 'mondo', DE: 'mondo', FR: 'mondo', ES: 'mondo', IT: 'mondo', NL: 'mondo',
  BE: 'mondo', AT: 'mondo', PT: 'mondo', IE: 'mondo', FI: 'mondo', SE: 'mondo',
  DK: 'mondo', NO: 'mondo', CH: 'mondo', PL: 'mondo', CZ: 'mondo', GR: 'mondo',
  CA: 'moneto',
  IN: 'paygate10', NG: 'paygate10', EG: 'paygate10', ZA: 'paygate10', KE: 'paygate10',
  AR: 'paygate10', MX: 'paygate10', PK: 'paygate10',
  BR: 'facilitapay', CO: 'facilitapay',
  CN: 'ofa', VN: 'ofa', TH: 'ofa', ID: 'ofa', MY: 'ofa', PH: 'ofa',
  JP: 'ofa', KR: 'ofa', HK: 'ofa', AU: 'ofa', TW: 'ofa',
  BD: 'makapay', TR: 'payok',
};

function resolveProvider(data: PaymentRequest): string {
  const c = data.billingDetails?.country || '';
  if (c && countryProviderMap[c]) return countryProviderMap[c];
  const cur = data.currency;
  if (['EUR', 'GBP'].includes(cur)) return 'mondo';
  if (cur === 'BRL' || cur === 'COP') return 'facilitapay';
  if (['INR', 'NGN', 'EGP', 'ZAR', 'KES', 'ARS', 'PKR'].includes(cur)) return 'paygate10';
  if (cur === 'BDT') return 'makapay';
  if (['CNY', 'VND', 'THB', 'IDR', 'MYR', 'PHP', 'JPY', 'KRW', 'HKD', 'AUD'].includes(cur)) return 'ofa';
  if (cur === 'CAD') return 'moneto';
  if (cur === 'TRY') return 'payok';
  return 'shieldhub';
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generic simulation for providers without live credentials
function simulatePayment(provider: string, data: PaymentRequest): any {
  const ref = `${provider}_${crypto.randomUUID().slice(0, 12)}`;
  const rand = Math.random();
  const status = rand < 0.80 ? 'Approved' : rand < 0.95 ? 'Declined' : 'pending';
  const message = status === 'Approved' ? 'Transaction approved' : status === 'Declined' ? 'Transaction declined' : 'Transaction processing';
  return {
    id: Math.floor(10000 + Math.random() * 90000),
    transaction_reference: ref, orderno: `${provider.toUpperCase()}-${Date.now()}`,
    status, message, country: data.billingDetails?.country || '',
    currency: data.currency, amount: data.amount.toFixed(2),
    timestamp: new Date().toISOString(), test_mode: true, provider,
  };
}

async function completeShopifyDraft(supabase: any, merchantId: string, draftOrderId: string) {
  try {
    const { data: stores } = await supabase.from('shopify_stores').select('id, shop_domain, access_token')
      .eq('merchant_id', merchantId).eq('uninstalled', false).not('access_token', 'is', null)
      .order('installed_at', { ascending: false }).limit(1);
    const store = stores?.[0];
    if (!store?.shop_domain || !store?.access_token) return;
    const res = await fetch(`https://${store.shop_domain}/admin/api/2025-01/draft_orders/${draftOrderId}/complete.json`, {
      method: 'PUT', headers: { 'X-Shopify-Access-Token': store.access_token, 'Content-Type': 'application/json' },
    });
    if (!res.ok) console.error(`Shopify draft completion failed:`, await res.text());
  } catch (err) { console.error('Shopify draft order completion error:', err); }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const paymentData: PaymentRequest = await req.json();
    const { amount, currency, paymentMethod, customerEmail, description, idempotencyKey, cardDetails, deviceInfo } = paymentData;

    if (!amount || amount <= 0) throw new Error('Invalid amount');
    if (!currency) throw new Error('Currency is required');
    if (amount > 999999) throw new Error('Amount exceeds maximum allowed');
    if ((paymentData as any).expectedAmount && Number(amount) !== Number((paymentData as any).expectedAmount)) {
      throw new Error('Amount mismatch — possible tampering detected');
    }

    // Resolve merchant
    let merchantId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (user) {
        const { data: m } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
        if (m) merchantId = m.id;
      }
    }
    if (!merchantId && (paymentData as any).merchantId) {
      const { data: gm } = await supabase.from('merchants').select('id').eq('id', (paymentData as any).merchantId).single();
      if (gm) merchantId = gm.id;
    }
    if (!merchantId) throw new Error('Merchant not found');

    // Transaction metadata
    const txMeta: Record<string, any> = {};
    if (cardDetails) {
      const n = cardDetails.number.replace(/\s/g, '');
      txMeta.cardFirst6 = n.slice(0, 6); txMeta.cardLast4 = n.slice(-4);
      const f = txMeta.cardFirst6;
      if (f.startsWith('4')) txMeta.card_brand = 'visa';
      else if (f.startsWith('5') || (f.startsWith('2') && parseInt(f.slice(0, 4)) >= 2221)) txMeta.card_brand = 'mastercard';
      else if (f.startsWith('34') || f.startsWith('37')) txMeta.card_brand = 'amex';
      else if (f.startsWith('6')) txMeta.card_brand = 'discover';
    }
    if (deviceInfo) txMeta.device_info = deviceInfo;
    if (paymentData.source) txMeta.source = paymentData.source;
    if (paymentData.orderId) txMeta.order_id = String(paymentData.orderId);
    if (paymentData.successUrl) txMeta.success_url = paymentData.successUrl;
    if (paymentData.cancelUrl) txMeta.cancel_url = paymentData.cancelUrl;

    // Idempotency check
    if (idempotencyKey) {
      const { data: ek } = await supabase.from('idempotency_keys').select('response').eq('key', idempotencyKey).eq('merchant_id', merchantId).single();
      if (ek?.response) return new Response(JSON.stringify(ek.response), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Surcharge
    let surchargeAmount = 0;
    const { data: ss } = await supabase.from('surcharge_settings').select('*').eq('merchant_id', merchantId).single();
    if (ss?.enabled) {
      surchargeAmount = amount * (ss.percentage_fee || 0) + parseFloat(ss.fixed_fee || '0');
      if (ss.max_fee_cap && surchargeAmount > ss.max_fee_cap) surchargeAmount = parseFloat(ss.max_fee_cap);
      surchargeAmount = parseFloat(surchargeAmount.toFixed(2));
    }
    const totalAmount = amount + surchargeAmount;

    // STEP 1 — Payment Intent
    const { data: intent, error: ie } = await supabase.from('payment_intents').insert({
      merchant_id: merchantId, amount: totalAmount, currency, status: 'requires_payment_method',
      payment_method: paymentMethod, metadata: { customer_email: customerEmail, description, idempotency_key: idempotencyKey, surcharge_amount: surchargeAmount, original_amount: amount, ...txMeta },
    }).select().single();
    if (ie) throw new Error(`Failed to create payment intent: ${ie.message}`);
    await supabase.from('payment_intents').update({ status: 'processing' }).eq('id', intent.id);

    // STEP 2A — Fraud scoring
    const billingCountry = paymentData.billingDetails?.country || '';
    let riskScore = 0; const riskFactors: string[] = [];
    if (!paymentData.deviceInfo?.device_type) { riskScore += 15; riskFactors.push('missing_device_info'); }
    if (totalAmount > 5000) { riskScore += 20; riskFactors.push('high_value'); }
    const { data: ra } = await supabase.from('payment_attempts').select('id').gte('created_at', new Date(Date.now() - 600000).toISOString());
    if ((ra?.length || 0) > 5) { riskScore += 30; riskFactors.push('high_velocity'); }

    if (riskScore > 90) {
      await supabase.from('fraud_scores').insert({ merchant_id: merchantId, total_score: riskScore, risk_level: 'critical', risk_factors: riskFactors, action_taken: 'block', customer_email: customerEmail, card_bin: txMeta.cardFirst6 });
      throw new Error('Transaction blocked by fraud engine');
    }
    await supabase.from('fraud_scores').insert({ merchant_id: merchantId, total_score: riskScore, risk_level: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low', risk_factors: riskFactors, action_taken: riskScore > 70 ? 'flag' : 'allow', customer_email: customerEmail, card_bin: txMeta.cardFirst6 });

    // STEP 2B — Route payment
    let provider: string;
    const { data: pspRoutes } = await supabase.from('psp_routes').select('*').eq('merchant_id', merchantId).order('priority', { ascending: true });
    const matchedPsp = pspRoutes?.find((r: any) => {
      if (r.country && r.country !== billingCountry) return false;
      if (r.card_brand && r.card_brand !== txMeta.card_brand) return false;
      if (r.risk_level) { const rl = riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low'; if (r.risk_level !== rl) return false; }
      return true;
    });
    if (matchedPsp) { provider = matchedPsp.processor; }
    else {
      const { data: rr } = await supabase.from('routing_rules').select('target_provider, currency_match, amount_min, amount_max').eq('merchant_id', merchantId).eq('active', true).order('priority', { ascending: false }).limit(10);
      const mr = rr?.find((r: any) => {
        if (r.currency_match?.length && !r.currency_match.includes(currency)) return false;
        if (r.amount_min != null && totalAmount < r.amount_min) return false;
        if (r.amount_max != null && totalAmount > r.amount_max) return false;
        return true;
      });
      provider = mr ? mr.target_provider : resolveProvider(paymentData);
    }

    // STEP 2C — 3DS decision
    let requires3DS = false;
    const { data: tds } = await supabase.from('merchant_3ds_settings').select('*').eq('merchant_id', merchantId).single();
    if (tds?.enabled) {
      if (tds.skip_if_processor_3ds && ['mondo', 'shieldhub'].includes(provider)) { /* skip */ }
      else {
        if (tds.auto_enable_high_risk && riskScore >= (tds.risk_threshold || 70)) requires3DS = true;
        if (!requires3DS && tds.decline_threshold) {
          const { data: rd } = await supabase.from('transactions').select('id').eq('merchant_id', merchantId).eq('status', 'failed').gte('created_at', new Date(Date.now() - 86400000).toISOString());
          if ((rd?.length || 0) >= tds.decline_threshold) requires3DS = true;
        }
        if (!requires3DS && totalAmount > 100) requires3DS = true;
      }
    }
    if (requires3DS) { txMeta.requires_3ds = true; txMeta.threeds_status = 'pending'; }

    // Process payment
    const t0 = Date.now();
    let providerResponse: any;
    switch (provider) {
      case 'mondo': providerResponse = await processMondo(paymentData); break;
      case 'shieldhub': providerResponse = await processShieldHub(paymentData, req); break;
      case 'makapay': providerResponse = await processMakapay(paymentData); break;
      case 'facilitapay': providerResponse = await processFacilitaPay(paymentData); break;
      default: providerResponse = simulatePayment(provider, paymentData); break;
    }
    const latencyMs = Date.now() - t0;

    // FX
    let fxRate = null, settlementAmount = totalAmount, settlementCurrency = currency;
    if (!['USD', 'EUR', 'GBP', 'CAD'].includes(currency)) {
      const rates: Record<string, number> = { BRL: 0.20, MXN: 0.058, COP: 0.00025, ARS: 0.0011, INR: 0.012, NGN: 0.00065, EGP: 0.021, ZAR: 0.055, KES: 0.0077, CNY: 0.14, VND: 0.000041, THB: 0.029, IDR: 0.000063, MYR: 0.22, PHP: 0.018, JPY: 0.0067, KRW: 0.00075, BDT: 0.0091, HKD: 0.13, AUD: 0.66, TWD: 0.031, TRY: 0.031, PKR: 0.0036 };
      fxRate = rates[currency] || 1;
      settlementAmount = totalAmount * fxRate; settlementCurrency = 'USD';
    }

    const statusMap: Record<string, string> = { Approved: 'completed', approved: 'completed', success: 'completed', completed: 'completed', Declined: 'failed', declined: 'failed', Failed: 'failed', failed: 'failed', Redirect: 'pending', pending: 'pending', processing: 'pending' };
    const internalStatus = statusMap[providerResponse.status] || 'pending';

    // STEP 3 — Transaction
    const { data: transaction, error: txErr } = await supabase.from('transactions').insert({
      merchant_id: merchantId, amount: totalAmount, currency, provider, status: internalStatus,
      customer_email: customerEmail, description, idempotency_key: idempotencyKey,
      provider_ref: String(providerResponse.id || providerResponse.gateway_session_id || providerResponse.transaction_reference || providerResponse.orderno || ''),
      fx_rate: fxRate, settlement_amount: settlementAmount, settlement_currency: settlementCurrency,
      metadata: { ...txMeta, payment_intent_id: intent.id, surcharge_amount: surchargeAmount, original_amount: amount, provider_response: providerResponse, routed_by_country: billingCountry || null },
    }).select().single();
    if (txErr) throw new Error(`Failed to create transaction: ${txErr.message}`);

    // STEP 4 — Payment attempt
    const { data: attempt } = await supabase.from('payment_attempts').insert({
      transaction_id: transaction.id, provider, attempt_number: 1, status: internalStatus, latency_ms: latencyMs,
      response_code: providerResponse.error?.code || providerResponse.statusCode || providerResponse.respcode || null,
      response_message: providerResponse.error?.messsage || providerResponse.message || providerResponse.respmsg || null,
    }).select().single();

    // STEP 5 — Provider event
    await supabase.from('provider_events').insert({ merchant_id: merchantId, transaction_id: transaction.id, provider, event_type: 'payment.created', payload: providerResponse });

    // STEP 6 — Update intent
    const intentStatus = internalStatus === 'completed' ? 'succeeded' : internalStatus === 'failed' ? 'failed' : internalStatus === 'pending' ? 'requires_action' : 'processing';
    await supabase.from('payment_intents').update({ status: intentStatus, processor_id: provider }).eq('id', intent.id);

    // STEP 7 — Response
    const responsePayload = { success: internalStatus === 'completed', payment_intent: { id: intent.id, status: intentStatus }, transaction, attempt: attempt ? { id: attempt.id, latency_ms: latencyMs } : null, providerResponse, surchargeAmount };
    if (idempotencyKey) await supabase.from('idempotency_keys').insert({ merchant_id: merchantId, key: idempotencyKey, response: responsePayload });

    // STEP 8 — Webhooks
    const eventType = internalStatus === 'completed' ? 'payment.completed' : internalStatus === 'failed' ? 'payment.failed' : 'payment.created';
    supabase.functions.invoke('api-v2-webhooks', { body: { merchant_id: merchantId, event_type: eventType, payload: { payment_id: transaction.id, payment_intent_id: intent.id, amount: totalAmount, currency, status: internalStatus, provider, customer_email: customerEmail, provider_ref: transaction.provider_ref, source: paymentData.source || null, order_id: paymentData.orderId || null, created_at: transaction.created_at } } }).catch(e => console.error('Webhook error:', e));

    if (internalStatus === 'completed' && paymentData.source === 'shopify' && paymentData.orderId) {
      await completeShopifyDraft(supabase, merchantId, String(paymentData.orderId));
    }

    return new Response(JSON.stringify(responsePayload), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error processing payment:', error);
    const isUnauth = error instanceof Error && error.message === 'Unauthorized';
    return new Response(JSON.stringify({ error: isUnauth ? 'Unauthorized' : 'An internal error occurred' }), { status: isUnauth ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

// ─── ShieldHub ───
async function processShieldHub(data: PaymentRequest, req: Request) {
  const clientId = Deno.env.get('SHIELDHUB_CLIENT_ID');
  const apiSecret = Deno.env.get('SHIELDHUB_API_SECRET');
  const ref = `ref_${crypto.randomUUID()}`;
  const amt = data.amount.toFixed(2);

  if (!clientId || !apiSecret) return simShieldHub(data, ref, amt);

  const hash = await sha256(clientId + amt + ref + apiSecret);
  const ip = data.customerDetails?.ip || data.deviceInfo?.ip_address || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  const body = {
    amount: amt, currency: data.currency, transaction_reference: ref,
    descriptor: 'AXP*FER*AXP*FERES',
    redirectback_url: 'https://checkout.everpayinc.com/result',
    notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-link-webhook`,
    customer: { first: data.customerDetails?.firstName || 'Customer', last: data.customerDetails?.lastName || 'User', email: data.customerEmail || 'customer@example.com', phone: data.customerDetails?.phone || '1234567890', ip },
    billing: { address: data.billingDetails?.address || '123 Main St', postal_code: data.billingDetails?.postalCode || '12345', city: data.billingDetails?.city || 'Mexico City', state: data.billingDetails?.state || 'CDMX', country: data.billingDetails?.country || 'MX' },
    card: { holder: data.cardDetails?.holderName || `${data.customerDetails?.firstName || 'Customer'} ${data.customerDetails?.lastName || 'User'}`, number: data.cardDetails?.number?.replace(/\s/g, '') || '', cvv: data.cardDetails?.cvc || '', expiry_month: (data.cardDetails?.expMonth || '').padStart(2, '0').slice(-2), expiry_year: (data.cardDetails?.expYear || '').slice(-2) },
  };

  try {
    const res = await fetch('https://pgw.shieldhubpay.com/api/transaction', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'client-id': clientId, 'client-hash': hash },
      body: JSON.stringify(body),
    });
    const rd = await res.json();
    return { ...rd, transaction_reference: ref };
  } catch (err) {
    console.error('ShieldHub error:', err);
    return simShieldHub(data, ref, amt);
  }
}

function simShieldHub(data: PaymentRequest, ref: string, amt: string) {
  const card = data.cardDetails?.number?.replace(/\s/g, '') || '';
  const txId = Math.floor(80000 + Math.random() * 20000);
  if (card === '4242424242424341') return { id: txId, transaction_reference: ref, status: 'Declined', currency: data.currency, amount: amt, error: { code: '304', messsage: 'Declined by the issuer' }, test_mode: true };
  if (card === '4242424242424846') return { id: txId, transaction_reference: ref, status: 'Redirect', currency: data.currency, amount: amt, redirect_url: `https://sandbox.shieldhubpay.com/3ds-sim/${ref}`, error: { code: '800', messsage: 'Redirect customer' }, test_mode: true };
  return { id: txId, transaction_reference: ref, authorization: Math.floor(100000 + Math.random() * 900000).toString(), status: 'Approved', currency: data.currency, amount: amt, error: { code: '000', messsage: 'Approved transaction' }, test_mode: true };
}

// ─── Mondo ───
async function processMondo(data: PaymentRequest) {
  const secret = Deno.env.get('MONDO_GATEWAY_SECRET_KEY');
  const acctId = Deno.env.get('MONDO_ACCOUNT_ID');
  if (!secret || !acctId) return { gateway_session_id: `mondo_sandbox_${crypto.randomUUID().slice(0, 12)}`, status: 'Approved', amount: data.amount.toString(), currency: data.currency, sandbox: true, test_mode: true };

  if (data.paymentMethod === 'card' && data.cardDetails) {
    const bin = data.cardDetails.number.replace(/\s/g, '').slice(0, 8);
    try {
      const br = await fetch('https://server-to-server.getmondo.co/tools/card_bin_lookup_api.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_account_id: acctId, gateway_secret_key: secret, bin }) });
      const bd = await br.json();
      if (bd.success && bd.authorized_region === false) return { id: `mondo_rejected`, status: 'Declined', error: { code: 'REGION_NOT_AUTHORIZED', message: `Card region not authorized.` } };
    } catch { /* allow through */ }
  }

  const ref = `everpay_${crypto.randomUUID().slice(0, 12)}`;
  const body: Record<string, any> = {
    company_account_id: acctId, gateway_secret_key: secret, amount: data.amount.toFixed(2), currency: data.currency, transaction_reference: ref,
    partner_return_url_completed: 'https://everpay-os.lovable.app/transactions?status=completed',
    partner_return_url_canceled: 'https://everpay-os.lovable.app/transactions?status=canceled',
    partner_return_url_rejected: 'https://everpay-os.lovable.app/transactions?status=rejected',
    partner_webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/moneto-webhook`,
    customer_email: data.customerEmail || 'customer@example.com',
    customer_first_name: data.customerDetails?.firstName || 'Customer', customer_last_name: data.customerDetails?.lastName || 'User',
    billing_country: data.billingDetails?.country || 'GB',
  };
  if (data.paymentMethod === 'card' && data.cardDetails) {
    body.card_number = data.cardDetails.number.replace(/\s/g, '');
    body.card_expiry_month = data.cardDetails.expMonth; body.card_expiry_year = data.cardDetails.expYear;
    body.card_cvv = data.cardDetails.cvc;
  }

  try {
    const res = await fetch('https://server-to-server.getmondo.co/payment/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const rd = await res.json();
    return { ...rd, transaction_reference: ref };
  } catch (err) {
    console.error('Mondo error:', err);
    return { gateway_session_id: `mondo_sandbox_${crypto.randomUUID().slice(0, 12)}`, status: 'Approved', amount: data.amount.toString(), currency: data.currency, sandbox: true, test_mode: true };
  }
}

// ─── MakaPay ───
async function processMakapay(data: PaymentRequest) {
  const apiKey = Deno.env.get('MAKAPAY_API_KEY');
  const apiSecret = Deno.env.get('MAKAPAY_API_SECRET');
  if (!apiKey || !apiSecret) return simulatePayment('makapay', data);

  try {
    const mRes = await fetch('https://makapp.xyz/api/v1/payment-methods', { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-API-KEY': apiKey, 'X-API-SECRET': apiSecret, 'X-Request-Id': `ep_${crypto.randomUUID().slice(0, 12)}` } });
    const md = await mRes.json();
    const methods = md?.data || [];
    const sel = methods.find((m: any) => m.code === 'sslcommerz' && m.status === 'active') || methods.find((m: any) => m.status === 'active') || { id: 3, code: 'sslcommerz' };

    const orderRef = `EP-${Date.now()}`;
    const iRes = await fetch('https://makapp.xyz/api/v1/payments/initiate', {
      method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-API-KEY': apiKey, 'X-API-SECRET': apiSecret, 'X-Request-Id': `ep_${crypto.randomUUID().slice(0, 12)}` },
      body: JSON.stringify({ payment_method_id: String(sel.id), provider_code: sel.code, amount: Math.round(data.amount), currency: data.currency || 'USD', reference: orderRef, customer_email: data.customerEmail || 'customer@example.com', request_payload: { product_name: data.description || `Payment ${orderRef}`, return_url: 'https://everpay-os.lovable.app/transactions?status=completed' }, process_now: true }),
    });
    const id = await iRes.json();
    if (!id.success) return { id: Math.floor(10000 + Math.random() * 90000), transaction_reference: orderRef, status: 'Failed', message: id.message || 'Payment initiation failed', provider: 'makapay' };
    const txn = id.data?.transaction || {};
    return { id: txn.trx_id || Math.floor(10000 + Math.random() * 90000), transaction_reference: orderRef, trx_id: txn.trx_id, status: txn.status === 'processing' ? 'pending' : txn.status === 'success' ? 'Approved' : txn.status, checkout_url: id.data?.checkout_url, redirect_url: id.data?.checkout_url, provider: 'makapay' };
  } catch (err) {
    console.error('MakaPay error:', err);
    return simulatePayment('makapay', data);
  }
}
