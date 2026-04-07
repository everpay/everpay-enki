import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Matrix Pay Solution Integration
 * Gaming, Online Casinos, Lottery merchant types only.
 * NOT available for US-based customers/cards/wallets.
 * 
 * Auth: Basic HTTP Auth — public_key:secret_key
 * Without secret_key, runs in simulation mode.
 * Card.js frontend SDK only needs public_key.
 */

const SANDBOX_URL = 'https://api-sandbox.matrixpaysolution.com';
const LIVE_URL = 'https://api.matrixpaysolution.com';

const STATUS_CODE_MAP: Record<number, string> = {
  0: 'Successful transaction',
  1003: 'No payment routes found',
  1020: 'Transaction is suspended',
  1030: 'Transaction is blocked',
  1500: 'Internal error',
  2010: 'Cancelled by customer',
  2020: 'Declined by Antifraud',
  2022: 'Declined by 3-D Secure',
  2025: 'Declined by Bank',
  2026: 'Declined by Bank: No Requisites',
  2030: 'Limit reached',
  2031: 'Customer limit reached',
  2035: 'Card limit reached',
  2040: 'Insufficient funds',
  2050: 'Incorrect card data',
  2099: 'Pending cascading after 3DS',
};

const API_RESPONSE_CODES: Record<number, string> = {
  0: 'Successful operation',
  30003: 'No payment routes found',
  30005: 'Unknown merchant account',
  30010: 'Invalid order data',
  30011: 'Invalid parent transaction',
  30012: 'Order already exists',
  30020: 'Unknown payment provider',
  30022: 'Unknown payment route',
  30030: 'Blocked by antifraud',
  30031: 'Blocked manually',
  30401: 'Unauthorized request',
  30404: 'Transaction is not found',
  30500: 'Internal server error',
  30600: 'Foreign error',
  30700: 'Request timed out',
};

function simulateResponse(action: string, params: any) {
  const txId = `mtx_sim_${Date.now().toString(36)}`;
  switch (action) {
    case 'customer_token':
      return { customer_token: `ct_sim_${Date.now().toString(36)}` };
    case 'pay':
    case 'h2h_payment':
      return {
        status: 'success', code: 0, reason: 'ok',
        id: params.order_id || txId,
        transactions: [{
          id: txId, status: 'success', code: 0, reason: 'ok',
          amount: params.amount, currency: params.currency || 'EUR',
          status_description: 'Successful transaction',
        }],
      };
    case 'checkout':
      return {
        status: 'pending',
        redirect_url: `https://checkout-sandbox.matrixpaysolution.com/pay/${txId}`,
        id: txId,
      };
    case 'refund':
      return { status: 'success', code: 0, reason: 'ok', id: txId };
    case 'status':
      return { status: 'success', code: 0, transactions: [] };
    case 'plan_create':
    case 'plan_update':
    case 'plan_deactivate':
    case 'plan_details':
      return { status: 'success', code: 0, plan_id: `plan_sim_${Date.now().toString(36)}` };
    case 'subscription_init':
    case 'subscription_details':
    case 'subscription_list':
    case 'subscription_cancel':
      return { status: 'success', code: 0, subscription_id: `sub_sim_${Date.now().toString(36)}` };
    default:
      return { status: 'ok' };
  }
}

// Map action -> Matrix API endpoint
function getEndpoint(action: string): string {
  const map: Record<string, string> = {
    customer_token: '/v1/customer/token',
    pay: '/v1/transaction/pay',
    checkout: '/v1/checkout/pay',
    refund: '/v1/transaction/refund',
    status: '/v1/transaction/status',
    payout: '/v1/transaction/payout/init',
    h2h_payment: '/v1/h2h/payment',
    h2h_apm: '/v1/h2h/apm/payment',
    cascade: '/v1/transaction/cascade',
    cascade_reject: '/v1/transaction/cascade/reject',
    order_status: '/v1/order/status',
    // Subscriptions v2
    plan_create: '/v2/subscription/plan/create',
    plan_update: '/v2/subscription/plan/update',
    plan_deactivate: '/v2/subscription/plan/deactivate',
    plan_details: '/v2/subscription/plan/details',
    subscription_init: '/v2/subscription/init',
    subscription_hpp: '/v2/checkout/subscription/init',
    subscription_details: '/v2/subscription/details',
    subscription_list: '/v2/subscription/list',
    subscription_cancel: '/v2/subscription/cancel',
    subscription_token_pay: '/v1/subscription/transaction/pay',
    // Oneclick
    oneclick_create: '/v1/checkout/oneclick/init',
    oneclick_pay: '/v1/oneclick/transaction/pay',
    // Project/MID
    project_details: '/v1/project/details',
    mid_details: '/v1/mid/details',
    mid_balance: '/v1/balance/mid',
  };
  return map[action] || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, sandbox = true, ...params } = body;

    // Block US-based customers/cards
    const customerCountry = params.country || params.billingDetails?.country || '';
    if (customerCountry === 'US') {
      return new Response(JSON.stringify({
        error: 'Matrix Pay is not available for US-based customers',
        code: 'REGION_BLOCKED',
      }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const MATRIX_PUBLIC_KEY = Deno.env.get('MATRIX_PUBLIC_KEY');
    const MATRIX_SECRET_KEY = Deno.env.get('MATRIX_SECRET_KEY');
    const MATRIX_PROJECT_ID = '1219560793';

    if (!MATRIX_PUBLIC_KEY) {
      return new Response(JSON.stringify({
        error: 'Matrix public key not configured',
        code: 'CONFIG_ERROR',
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Without secret key, return simulation
    if (!MATRIX_SECRET_KEY) {
      console.log(`[Matrix] Simulation mode (no secret key) — action: ${action}, project: ${MATRIX_PROJECT_ID}`);
      return new Response(JSON.stringify({
        simulation: true,
        public_key_configured: true,
        project_id: MATRIX_PROJECT_ID,
        ...simulateResponse(action, params),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Live API call with both keys
    const baseUrl = sandbox ? SANDBOX_URL : LIVE_URL;
    const endpoint = getEndpoint(action);

    if (!endpoint) {
      return new Response(JSON.stringify({
        error: `Unknown action: ${action}`,
        code: 'INVALID_ACTION',
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const authHeader = `Basic ${btoa(`${MATRIX_PUBLIC_KEY}:${MATRIX_SECRET_KEY}`)}`;

    // Inject project_id into params for Matrix API
    const enrichedParams = { ...params, project_id: MATRIX_PROJECT_ID };

    console.log(`[Matrix] ${action} -> ${baseUrl}${endpoint} (project: ${MATRIX_PROJECT_ID})`);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(enrichedParams),
    });

    const responseText = await response.text();
    console.log(`[Matrix] Response ${response.status}: ${responseText.substring(0, 500)}`);

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw_response: responseText };
    }

    // Enrich with human-readable status descriptions
    if (data.code !== undefined) {
      data.status_description = STATUS_CODE_MAP[data.code] || API_RESPONSE_CODES[data.code] || `Code ${data.code}`;
    }
    if (data.transactions) {
      for (const tx of data.transactions) {
        if (tx.code !== undefined) {
          tx.status_description = STATUS_CODE_MAP[tx.code] || `Code ${tx.code}`;
        }
      }
    }

    return new Response(JSON.stringify({
      sandbox,
      matrix_status: response.status,
      ...data,
    }), {
      status: response.ok ? 200 : response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[Matrix] Error:', err);
    return new Response(JSON.stringify({
      error: 'Matrix processing error',
      message: String(err),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
