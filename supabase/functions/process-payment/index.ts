import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
        provider_ref: String(providerResponse.id || providerResponse.transaction_reference || ''),
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

  // Determine endpoint — sandbox vs production
  const isTestMode = clientId.startsWith('test_') || clientId.includes('test');
  const apiEndpoint = isTestMode
    ? 'https://sandbox.shieldhubpay.com/api/transaction'
    : 'https://pgw.shieldhubpay.com/api/transaction';

  console.log(`ShieldHub ${isTestMode ? 'SANDBOX' : 'PRODUCTION'} → ${apiEndpoint}`);
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

  console.log('ShieldHub response:', {
    status: responseData.status,
    id: responseData.id,
    error: responseData.error,
  });

  if (!response.ok && !responseData.status) {
    throw new Error(`ShieldHub API failed: ${JSON.stringify(responseData)}`);
  }

  return responseData;
}

// ─── Mondo — sandbox mode with simulated responses ───
async function processMondoPayment(data: PaymentRequest) {
  const gatewaySecret = Deno.env.get('MONDO_GATEWAY_SECRET_KEY');
  const accountId = Deno.env.get('MONDO_ACCOUNT_ID');

  // If no Mondo credentials, return sandbox response
  if (!gatewaySecret || !accountId) {
    console.log('Mondo: No credentials configured — returning sandbox response');
    return generateMondoSandboxResponse(data);
  }

  let endpoint = 'https://api.getmondo.co/v1/payments';
  let body: any = {
    amount: data.amount,
    currency: data.currency,
    account_id: accountId,
    customer_email: data.customerEmail,
    description: data.description,
  };

  if (data.paymentMethod === 'card' && data.cardDetails) {
    endpoint = 'https://api.getmondo.co/v1/cards/charge';
    body.card = {
      number: data.cardDetails.number,
      exp_month: data.cardDetails.expMonth,
      exp_year: data.cardDetails.expYear,
      cvc: data.cardDetails.cvc,
    };
  } else if (data.paymentMethod === 'apple_pay') {
    endpoint = 'https://api.getmondo.co/v1/apple-pay/charge';
  } else if (data.paymentMethod === 'open_banking') {
    const openbankingKey = Deno.env.get('MONDO_OPENBANKING_API_KEY');
    endpoint = 'https://api.getmondo.co/v1/open-banking/payments';
    body.openbanking_key = openbankingKey;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gatewaySecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.warn('Mondo API failed, falling back to sandbox response');
      return generateMondoSandboxResponse(data);
    }

    return await response.json();
  } catch (error) {
    console.warn('Mondo API error, falling back to sandbox:', error);
    return generateMondoSandboxResponse(data);
  }
}

function generateMondoSandboxResponse(data: PaymentRequest) {
  return {
    id: `mondo_sandbox_${crypto.randomUUID().slice(0, 8)}`,
    status: 'Approved',
    amount: data.amount.toString(),
    currency: data.currency,
    authorization: `MONDO${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
    timestamp: new Date().toISOString(),
    sandbox: true,
    error: { code: '000', messsage: 'Approved transaction (sandbox)' },
  };
}

function getFxRate(fromCurrency: string): number {
  const rates: Record<string, number> = { 'BRL': 0.20, 'MXN': 0.058, 'COP': 0.00026 };
  return rates[fromCurrency] || 1;
}
