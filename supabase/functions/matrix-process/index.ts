import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Matrix Pay Solution — Full API Integration
 * Gaming, Online Casinos, Lottery merchant types.
 * NOT available for US-based customers/cards/wallets.
 * Auth: Basic HTTP Auth — public_key:secret_key
 * Without secret_key → simulation mode.
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

// Full endpoint map covering every Matrix API method
const ENDPOINT_MAP: Record<string, string> = {
  // Core payments
  customer_token: '/v1/customer/token',
  pay: '/v1/transaction/pay',
  checkout: '/v1/checkout/pay',
  refund: '/v1/transaction/refund',
  status: '/v1/transaction/status',
  order_status: '/v1/order/status',
  // Payout
  payout: '/v1/transaction/payout/init',
  // Cascading
  cascade: '/v1/transaction/cascade',
  cascade_reject: '/v1/transaction/cascade/reject',
  // H2H (host-to-host) — PCI DSS Level 1 required
  h2h_payment: '/v1/h2h/payment',
  h2h_payout: '/v1/h2h/payout/init',
  h2h_p2p_init: '/v1/h2h/payment/p2p/init',
  h2h_apm: '/v1/h2h/apm/payment',
  // Subscriptions v2 — Billing Plans
  plan_create: '/v2/subscription/plan/create',
  plan_update: '/v2/subscription/plan/update',
  plan_deactivate: '/v2/subscription/plan/deactivate',
  plan_details: '/v2/subscription/plan/details',
  subscription_init: '/v2/subscription/init',
  subscription_hpp: '/v2/checkout/subscription/init',
  subscription_details: '/v2/subscription/details',
  subscription_list: '/v2/subscription/list',
  subscription_cancel: '/v2/subscription/cancel',
  // Subscription tokens (flexible recurring)
  subscription_token_pay: '/v1/subscription/transaction/pay',
  // Oneclick
  oneclick_create: '/v1/checkout/oneclick/init',
  oneclick_pay: '/v1/oneclick/transaction/pay',
  checkout_oneclick_pay: '/v1/checkout/oneclick/pay',
  // Project & MID details
  project_details: '/v1/project/details',
  mid_details: '/v1/mid/details',
  external_mid_details: '/v1/external_mid/details',
  mid_balance: '/v1/balance/mid',
  external_mid_balance: '/v1/balance/external_mid',
  aggregated_mid_balance: '/v1/balance/aggregated_mid',
};

function simulateResponse(action: string, params: any) {
  const txId = `mtx_sim_${Date.now().toString(36)}`;
  const orderId = params.order_id || `ord_${Date.now().toString(36)}`;
  const now = Math.floor(Date.now() / 1000);

  switch (action) {
    case 'customer_token':
      return {
        status: 'success', code: 0, reason: 'ok',
        customer_token: `ct_sim_${Date.now().toString(36)}`,
      };

    case 'pay':
    case 'h2h_payment':
    case 'h2h_p2p_init':
      return {
        status: 'success', code: 0, reason: 'ok',
        id: orderId, timestamp: now,
        transactions: [{
          id: txId, status: 'success', code: 0, reason: 'ok',
          amount: params.amount || 100, currency: params.currency || 'EUR',
          status_description: 'Successful transaction',
          type: 'payment',
        }],
        card: { mask: '424242******4242', brand: 'visa' },
      };

    case 'checkout':
      return {
        status: 'pending', code: 0, reason: 'ok',
        redirect_url: `https://checkout-sandbox.matrixpaysolution.com/pay/${txId}`,
        id: orderId,
      };

    case 'refund':
      return {
        status: 'success', code: 0, reason: 'ok',
        id: orderId, timestamp: now,
        transactions: [{
          id: txId, status: 'success', code: 0, reason: 'ok',
          amount: params.amount || 100, type: 'refund',
          status_description: 'Successful transaction',
        }],
      };

    case 'payout':
    case 'h2h_payout':
      return {
        status: 'success', code: 0, reason: 'ok',
        id: orderId, timestamp: now,
        transactions: [{
          id: txId, status: 'success', code: 0, reason: 'ok',
          amount: params.amount || 100, currency: params.currency || 'EUR',
          type: 'payout', status_description: 'Successful transaction',
        }],
      };

    case 'status':
    case 'order_status':
      return {
        status: 'success', code: 0, reason: 'ok',
        id: params.order_id || params.transaction_id || orderId,
        timestamp: now,
        transactions: [{
          id: txId, status: 'success', code: 0, reason: 'ok',
          amount: 100, currency: 'EUR', type: 'payment',
          status_description: 'Successful transaction',
        }],
      };

    case 'cascade':
    case 'cascade_reject':
      return {
        status: 'success', code: 0, reason: 'ok',
        id: orderId, timestamp: now,
        transactions: [{
          id: txId, status: action === 'cascade' ? 'pending' : 'error',
          code: action === 'cascade' ? 2099 : 2025,
        }],
      };

    case 'h2h_apm':
      return {
        status: 'pending', code: 0, reason: 'ok',
        redirect_url: `https://checkout-sandbox.matrixpaysolution.com/apm/${txId}`,
        id: orderId,
      };

    // Subscription Plans
    case 'plan_create':
      return {
        status: 'success', code: 0, reason: 'ok',
        plan: {
          id: `plan_sim_${Date.now().toString(36)}`,
          name: params.name || 'Test Plan',
          status: 'ACTIVE',
          billing_period: params.billing_period || { kind: 'MONTHS', value: 1 },
          prices: params.prices || [{ currency: 'USD', value: 999 }],
        },
      };
    case 'plan_update':
      return {
        status: 'success', code: 0, reason: 'ok',
        plan: { id: params.id, name: params.name, status: 'ACTIVE' },
      };
    case 'plan_deactivate':
      return {
        status: 'success', code: 0, reason: 'ok',
        plan: { id: params.id, status: 'DEACTIVATED' },
      };
    case 'plan_details':
      return {
        status: 'success', code: 0, reason: 'ok',
        plan: {
          id: params.id, name: 'Sample Plan', status: 'ACTIVE',
          billing_period: { kind: 'MONTHS', value: 1 },
          prices: [{ currency: 'USD', value: 999 }, { currency: 'EUR', value: 899 }],
          retries: [{ kind: 'N_DAY', value: 3 }],
        },
      };

    // Subscriptions
    case 'subscription_init':
    case 'subscription_hpp':
      return {
        status: 'success', code: 0, reason: 'ok',
        subscription_id: `sub_sim_${Date.now().toString(36)}`,
        redirect_url: action === 'subscription_hpp'
          ? `https://checkout-sandbox.matrixpaysolution.com/sub/${txId}`
          : undefined,
        transactions: [{
          id: txId, status: 'success', code: 0, amount: 999,
          currency: params.currency || 'USD',
        }],
      };
    case 'subscription_details':
      return {
        status: 'success', code: 0, reason: 'ok',
        subscription: {
          id: params.subscription_id,
          status: 'ACTIVE',
          plan_id: 'plan_sim_test',
          next_payment_date: new Date(Date.now() + 30 * 86400000).toISOString(),
          invoices: [{ id: 'inv_1', status: 'paid', amount: 999, currency: 'USD' }],
        },
      };
    case 'subscription_list':
      return {
        status: 'success', code: 0, reason: 'ok',
        subscriptions: [
          { id: 'sub_sim_1', status: 'ACTIVE', plan_id: 'plan_1' },
          { id: 'sub_sim_2', status: 'DEACTIVATED', plan_id: 'plan_2' },
        ],
      };
    case 'subscription_cancel':
      return { status: 'success', code: 0, reason: 'ok' };
    case 'subscription_token_pay':
      return {
        status: 'success', code: 0, reason: 'ok',
        id: orderId, timestamp: now,
        transactions: [{
          id: txId, status: 'success', code: 0,
          amount: params.amount || 100, currency: params.currency || 'USD',
          type: 'subscription_payment',
        }],
      };

    // Oneclick
    case 'oneclick_create':
      return {
        status: 'pending', code: 0, reason: 'ok',
        redirect_url: `https://checkout-sandbox.matrixpaysolution.com/oneclick/${txId}`,
        oneclick_token: `oc_sim_${Date.now().toString(36)}`,
        id: orderId,
      };
    case 'oneclick_pay':
      return {
        status: 'success', code: 0, reason: 'ok',
        id: orderId, timestamp: now,
        transactions: [{
          id: txId, status: 'success', code: 0,
          amount: params.amount || 100, currency: params.currency || 'USD',
          type: 'oneclick_payment',
        }],
      };
    case 'checkout_oneclick_pay':
      return {
        status: 'pending', code: 0, reason: 'ok',
        redirect_url: `https://checkout-sandbox.matrixpaysolution.com/oneclick-pay/${txId}`,
        id: orderId,
      };

    // Project & MID
    case 'project_details':
      return {
        status: 'success', code: 0,
        project: {
          id: '1219560793', name: 'Everpay Matrix Project',
          status: 'active', mode: 'test',
          mids: [
            { mid: 'TZ-0000000001', status: 'active', provider: 'Provider A', currency: 'EUR' },
            { mid: 'TZ-0000000002', status: 'active', provider: 'Provider B', currency: 'USD' },
          ],
        },
      };
    case 'mid_details':
      return {
        status: 'success', code: 0,
        mid: {
          id: params.mid || 'TZ-0000000001',
          status: 'active', provider: 'Provider A',
          currency: 'EUR', descriptor: 'EVERPAY*PAYMENT',
          payment_methods: ['visa', 'mastercard', 'amex'],
          features: { subscriptions: true, payouts: true, refunds: true },
        },
      };
    case 'external_mid_details':
      return {
        status: 'success', code: 0,
        external_mid: {
          id: params.id || 'ext_mid_001',
          status: 'active', provider: 'External Provider',
          currency: 'USD',
        },
      };
    case 'mid_balance':
      return {
        status: 'success', code: 0,
        balance: {
          mid: params.mid || 'TZ-0000000001',
          currency: 'EUR',
          available: 125000, pending: 8500, reserved: 12000,
          total: 145500,
        },
      };
    case 'external_mid_balance':
      return {
        status: 'success', code: 0,
        balance: {
          id: params.id || 'ext_mid_001',
          currency: 'USD',
          available: 50000, pending: 3200, reserved: 5000,
        },
      };
    case 'aggregated_mid_balance':
      return {
        status: 'success', code: 0,
        balances: [
          { mid: 'TZ-0000000001', currency: 'EUR', available: 125000, pending: 8500 },
          { mid: 'TZ-0000000002', currency: 'USD', available: 98000, pending: 4200 },
        ],
        total: { EUR: 133500, USD: 102200 },
      };

    default:
      return { status: 'ok', code: 0 };
  }
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

    // Without secret key → simulation mode
    if (!MATRIX_SECRET_KEY) {
      console.log(`[Matrix] Simulation mode — action: ${action}`);
      return new Response(JSON.stringify({
        simulation: true,
        public_key_configured: true,
        project_id: MATRIX_PROJECT_ID,
        ...simulateResponse(action, params),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Live API call
    const baseUrl = sandbox ? SANDBOX_URL : LIVE_URL;
    const endpoint = ENDPOINT_MAP[action];

    if (!endpoint) {
      return new Response(JSON.stringify({
        error: `Unknown action: ${action}`,
        code: 'INVALID_ACTION',
        available_actions: Object.keys(ENDPOINT_MAP),
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const encoder = new TextEncoder();
    const credentials = encoder.encode(`${MATRIX_PUBLIC_KEY}:${MATRIX_SECRET_KEY}`);
    const authHeader = `Basic ${btoa(String.fromCharCode(...credentials))}`;

    const enrichedParams = { ...params, project_id: MATRIX_PROJECT_ID };

    console.log(`[Matrix] ${action} -> ${baseUrl}${endpoint}`);

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
