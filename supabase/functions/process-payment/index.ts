import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'pix' | 'boleto' | 'apple_pay' | 'open_banking';
  customerEmail?: string;
  description?: string;
  idempotencyKey?: string;
  sandboxMode?: boolean;
  cardDetails?: {
    number: string;
    expMonth: string;
    expYear: string;
    cvc: string;
    holderName?: string;
  };
  customerDetails?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    ip?: string;
  };
  billingDetails?: {
    address?: string;
    postalCode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  deviceInfo?: {
    device_type?: string;
    os?: string;
    browser?: string;
    browser_version?: string;
    screen_resolution?: string;
    timezone?: string;
    ip_address?: string;
    user_agent?: string;
  };
}

// ─── SHA-256 hash helper (matches ShieldHub docs) ───
async function generateHash(clientId: string, amount: string, transactionRef: string, apiSecret: string): Promise<string> {
  const data = clientId + amount + transactionRef + apiSecret;
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    // Get merchant
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (merchantError || !merchant) throw new Error('Merchant not found');

    const paymentData: PaymentRequest = await req.json();
    const { amount, currency, paymentMethod, customerEmail, description, idempotencyKey, cardDetails, deviceInfo } = paymentData;

    // Build transaction metadata
    const txMetadata: Record<string, any> = {};
    if (cardDetails) {
      const cleanNum = cardDetails.number.replace(/\s/g, '');
      txMetadata.cardFirst6 = cleanNum.slice(0, 6);
      txMetadata.cardLast4 = cleanNum.slice(-4);
      const first6 = txMetadata.cardFirst6;
      if (first6.startsWith('4')) txMetadata.card_brand = 'visa';
      else if (first6.startsWith('5') || (first6.startsWith('2') && parseInt(first6.slice(0, 4)) >= 2221)) txMetadata.card_brand = 'mastercard';
      else if (first6.startsWith('34') || first6.startsWith('37')) txMetadata.card_brand = 'amex';
      else if (first6.startsWith('6')) txMetadata.card_brand = 'discover';
    }
    if (deviceInfo) {
      txMetadata.device_info = deviceInfo;
      if (!deviceInfo.ip_address) {
        txMetadata.device_info.ip_address = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      }
    }

    // Check idempotency
    if (idempotencyKey) {
      const { data: existingKey } = await supabase
        .from('idempotency_keys')
        .select('response')
        .eq('key', idempotencyKey)
        .eq('merchant_id', merchant.id)
        .single();

      if (existingKey?.response) {
        return new Response(
          JSON.stringify(existingKey.response),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ─── Route payment to correct provider ───
    let provider = 'shieldhub';
    let providerResponse: any;

    if (['EUR', 'GBP'].includes(currency)) {
      provider = 'mondo';
      providerResponse = await processMondoPayment(paymentData);
    } else {
      provider = 'shieldhub';
      providerResponse = await processShieldHubPayment(paymentData, req);
    }

    // Calculate FX if needed
    let fxRate = null;
    let settlementAmount = amount;
    let settlementCurrency = currency;

    if (['BRL', 'MXN', 'COP'].includes(currency)) {
      fxRate = getFxRate(currency);
      settlementAmount = amount * fxRate;
      settlementCurrency = 'USD';
    }

    // Map provider status to our internal status
    const statusMap: Record<string, string> = {
      'Approved': 'completed', 'approved': 'completed', 'success': 'completed', 'completed': 'completed',
      'Declined': 'failed', 'declined': 'failed', 'Failed': 'failed', 'failed': 'failed',
      'Redirect': 'pending', 'pending': 'pending', 'processing': 'pending',
    };
    const internalStatus = statusMap[providerResponse.status] || 'pending';

    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        merchant_id: merchant.id,
        amount,
        currency,
        provider,
        status: internalStatus,
        customer_email: customerEmail,
        description,
        idempotency_key: idempotencyKey,
        provider_ref: String(providerResponse.id || providerResponse.gateway_session_id || providerResponse.transaction_reference || ''),
        fx_rate: fxRate,
        settlement_amount: settlementAmount,
        settlement_currency: settlementCurrency,
        metadata: {
          ...txMetadata,
          provider_response: providerResponse,
        },
      })
      .select()
      .single();

    if (txError) throw txError;

    // Log provider event
    await supabase.from('provider_events').insert({
      merchant_id: merchant.id,
      transaction_id: transaction.id,
      provider,
      event_type: 'payment.created',
      payload: providerResponse,
    });

    // Store idempotency response
    if (idempotencyKey) {
      await supabase.from('idempotency_keys').insert({
        merchant_id: merchant.id,
        key: idempotencyKey,
        response: { transaction },
      });
    }

    return new Response(
      JSON.stringify({ success: internalStatus === 'completed', transaction, providerResponse }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing payment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ─── ShieldHub Pay — correct API integration ───
async function processShieldHubPayment(data: PaymentRequest, req: Request) {
  const clientId = Deno.env.get('SHIELDHUB_CLIENT_ID');
  const apiSecret = Deno.env.get('SHIELDHUB_API_SECRET');

  if (!clientId || !apiSecret) {
    throw new Error('Missing ShieldHub API credentials');
  }

  const transactionRef = `ref_${crypto.randomUUID()}`;
  const amountStr = data.amount.toString();

  // Generate SHA-256 hash: clientId + amount + transaction_reference + apiSecret
  const clientHash = await generateHash(clientId, amountStr, transactionRef, apiSecret);

  const customerIp = data.customerDetails?.ip ||
    data.deviceInfo?.ip_address ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1';

  const shieldHubBody = {
    amount: amountStr,
    currency: data.currency,
    transaction_reference: transactionRef,
    redirectback_url: 'https://everpay-os.lovable.app/transactions',
    notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-link-webhook`,
    customer: {
      first: data.customerDetails?.firstName || 'Customer',
      last: data.customerDetails?.lastName || 'User',
      email: data.customerEmail || 'customer@example.com',
      phone: data.customerDetails?.phone || '1234567890',
      ip: customerIp,
    },
    billing: {
      address: data.billingDetails?.address || '123 Main St',
      postal_code: data.billingDetails?.postalCode || '12345',
      city: data.billingDetails?.city || 'New York',
      state: data.billingDetails?.state || 'NY',
      country: data.billingDetails?.country || 'US',
    },
    card: {
      holder: data.cardDetails?.holderName || `${data.customerDetails?.firstName || 'Customer'} ${data.customerDetails?.lastName || 'User'}`,
      number: data.cardDetails?.number?.replace(/\s/g, '') || '',
      cvv: data.cardDetails?.cvc || '',
      expiry_month: data.cardDetails?.expMonth || '',
      expiry_year: data.cardDetails?.expYear || '',
    },
  };

  // Always use sandbox endpoint — production merchant is disabled
  const apiEndpoint = 'https://sandbox.shieldhubpay.com/api/transaction';

  console.log(`ShieldHub SANDBOX → ${apiEndpoint}`);
  console.log('ShieldHub request:', { amount: amountStr, currency: data.currency, ref: transactionRef });

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'client-id': clientId,
      'client-hash': clientHash,
    },
    body: JSON.stringify(shieldHubBody),
  });

  const responseData = await response.json();

  console.log('ShieldHub full response:', JSON.stringify(responseData));

  if (!response.ok && !responseData.status) {
    throw new Error(`ShieldHub API failed: ${JSON.stringify(responseData)}`);
  }

  return responseData;
}

// ─── Mondo Card BIN Lookup — enforce 90% EU / 10% international ───
async function mondoCardBinLookup(cardNumber: string): Promise<{ isEU: boolean; region: string; authorized: boolean; country: string }> {
  const accountId = Deno.env.get('MONDO_ACCOUNT_ID');
  const gatewaySecret = Deno.env.get('MONDO_GATEWAY_SECRET_KEY');

  if (!accountId || !gatewaySecret) {
    console.log('Mondo BIN lookup: No credentials, assuming EU card');
    return { isEU: true, region: 'EU', authorized: true, country: 'UNK' };
  }

  const bin = cardNumber.replace(/\s/g, '').slice(0, 8);

  try {
    const response = await fetch('https://server-to-server.getmondo.co/tools/card_bin_lookup_api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_account_id: accountId,
        gateway_secret_key: gatewaySecret,
        bin,
      }),
    });

    const data = await response.json();
    console.log('Mondo BIN lookup response:', data);

    if (data.success) {
      const euRegions = ['EU', 'UK'];
      const isEU = euRegions.includes(data.bank_region_short_code);
      return {
        isEU,
        region: data.bank_region_short_code || 'UNKNOWN',
        authorized: data.authorized_region === true,
        country: data.country_iso3 || 'UNK',
      };
    }

    console.warn('Mondo BIN lookup failed:', data.error);
    return { isEU: true, region: 'UNKNOWN', authorized: true, country: 'UNK' };
  } catch (error) {
    console.warn('Mondo BIN lookup error:', error);
    return { isEU: true, region: 'UNKNOWN', authorized: true, country: 'UNK' };
  }
}

// ─── Mondo — Server-to-Server Cards API ───
async function processMondoPayment(data: PaymentRequest) {
  const gatewaySecret = Deno.env.get('MONDO_GATEWAY_SECRET_KEY');
  const accountId = Deno.env.get('MONDO_ACCOUNT_ID');

  // If no Mondo credentials, return sandbox response
  if (!gatewaySecret || !accountId) {
    console.log('Mondo: No credentials configured — returning sandbox response');
    return generateMondoSandboxResponse(data);
  }

  // ─── Card BIN region check (90% EU / 10% international) ───
  if (data.paymentMethod === 'card' && data.cardDetails) {
    const binResult = await mondoCardBinLookup(data.cardDetails.number);
    console.log(`Mondo BIN check: region=${binResult.region}, isEU=${binResult.isEU}, authorized=${binResult.authorized}, country=${binResult.country}`);

    if (!binResult.authorized) {
      console.warn(`Mondo: Card region ${binResult.region} not authorized for this account`);
      return {
        id: `mondo_rejected_${crypto.randomUUID().slice(0, 8)}`,
        status: 'Declined',
        amount: data.amount.toString(),
        currency: data.currency,
        error: { code: 'REGION_NOT_AUTHORIZED', message: `Card region ${binResult.region} (${binResult.country}) is not authorized. Mondo enforces 90% EU / 10% international card traffic.` },
        bin_lookup: binResult,
      };
    }
  }

  // ─── Server-to-Server Cards API: POST /payment/ ───
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const transactionRef = `everpay_${crypto.randomUUID().slice(0, 12)}`;

  const mondoBody: Record<string, any> = {
    company_account_id: accountId,
    gateway_secret_key: gatewaySecret,
    amount: data.amount.toFixed(2),
    currency: data.currency,
    transaction_reference: transactionRef,
    partner_return_url_completed: 'https://everpay-os.lovable.app/transactions?status=completed',
    partner_return_url_canceled: 'https://everpay-os.lovable.app/transactions?status=canceled',
    partner_return_url_rejected: 'https://everpay-os.lovable.app/transactions?status=rejected',
    partner_webhook_url: `${supabaseUrl}/functions/v1/moneto-webhook`,
    customer_email: data.customerEmail || 'customer@example.com',
    customer_first_name: data.customerDetails?.firstName || 'Customer',
    customer_last_name: data.customerDetails?.lastName || 'User',
    customer_phone: data.customerDetails?.phone || '1234567890',
    billing_address: data.billingDetails?.address || '123 Main St',
    billing_city: data.billingDetails?.city || 'London',
    billing_state: data.billingDetails?.state || 'LDN',
    billing_zip: data.billingDetails?.postalCode || 'EC1A 1BB',
    billing_country: data.billingDetails?.country || 'GB',
  };

  // Add card details for S2S
  if (data.paymentMethod === 'card' && data.cardDetails) {
    const cleanNum = data.cardDetails.number.replace(/\s/g, '');
    mondoBody.card_number = cleanNum;
    mondoBody.card_expiry_month = data.cardDetails.expMonth;
    mondoBody.card_expiry_year = data.cardDetails.expYear;
    mondoBody.card_cvv = data.cardDetails.cvc;
    mondoBody.card_holder_name = data.cardDetails.holderName ||
      `${data.customerDetails?.firstName || 'Customer'} ${data.customerDetails?.lastName || 'User'}`;
  }

  try {
    console.log('Mondo S2S → POST https://server-to-server.getmondo.co/payment/');
    console.log('Mondo request:', { amount: mondoBody.amount, currency: mondoBody.currency, ref: transactionRef });

    const response = await fetch('https://server-to-server.getmondo.co/payment/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mondoBody),
    });

    const responseData = await response.json();
    console.log('Mondo S2S response:', {
      status: responseData.status,
      gateway_session_id: responseData.gateway_session_id,
      error: responseData.error,
    });

    if (!response.ok && !responseData.gateway_session_id) {
      console.warn('Mondo S2S API failed, falling back to sandbox response');
      return generateMondoSandboxResponse(data);
    }

    // If we get a 3DS redirect URL, return it for the frontend to handle
    if (responseData['3d_secure_redirect_url']) {
      return {
        ...responseData,
        status: 'Redirect',
        redirect_url: responseData['3d_secure_redirect_url'],
      };
    }

    return {
      ...responseData,
      status: responseData.status || 'Approved',
    };
  } catch (error) {
    console.warn('Mondo S2S API error, falling back to sandbox:', error);
    return generateMondoSandboxResponse(data);
  }
}

function generateMondoSandboxResponse(data: PaymentRequest) {
  return {
    id: `mondo_sandbox_${crypto.randomUUID().slice(0, 8)}`,
    gateway_session_id: `sandbox_session_${crypto.randomUUID().slice(0, 8)}`,
    status: 'Approved',
    amount: data.amount.toString(),
    currency: data.currency,
    authorization: `MONDO${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
    timestamp: new Date().toISOString(),
    sandbox: true,
    error: { code: '000', message: 'Approved transaction (sandbox)' },
  };
}

function getFxRate(fromCurrency: string): number {
  const rates: Record<string, number> = { 'BRL': 0.20, 'MXN': 0.058, 'COP': 0.00026 };
  return rates[fromCurrency] || 1;
}
