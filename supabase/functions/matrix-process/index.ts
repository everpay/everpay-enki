import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Matrix Pay Solution Integration
 * Only for Gaming, Online Casinos, Lottery merchant types.
 * 
 * Sandbox: https://api-sandbox.matrixpaysolution.com/
 * Live:    https://api.matrixpaysolution.com/
 * 
 * Auth: Basic HTTP Auth with public_key:secret_key (for live)
 * Sandbox: Only public_key needed for checkout/HPP
 * Currencies: EUR, USD (sandbox)
 * 
 * API Methods:
 *   POST /v1/customer/token      — Get customer token
 *   POST /v1/transaction/pay     — Card payment
 *   POST /v1/checkout/pay        — Hosted checkout (HPP)
 *   POST /v1/transaction/payout  — Payout to card
 *   POST /v1/transaction/refund  — Refund
 *   POST /v1/transaction/status  — Check status
 *   POST /v1/h2h/payment         — H2H card payment
 *   POST /v1/h2h/apm/payment     — H2H APM (Apple Pay, Google Pay)
 */

const SANDBOX_URL = 'https://api-sandbox.matrixpaysolution.com';
const LIVE_URL = 'https://api.matrixpaysolution.com';

// Matrix transaction status codes
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
    if (!MATRIX_PUBLIC_KEY) {
      return new Response(JSON.stringify({
        error: 'Matrix public key not configured',
        code: 'CONFIG_ERROR',
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const baseUrl = sandbox ? SANDBOX_URL : LIVE_URL;

    // Build auth header — sandbox only needs public key
    const authHeader = `Basic ${btoa(MATRIX_PUBLIC_KEY + ':')}`;

    let endpoint: string;
    let payload: Record<string, unknown>;

    switch (action) {
      case 'checkout': {
        // Hosted Payment Page — redirect-based, public key only
        endpoint = '/v1/checkout/pay';
        payload = {
          public_key: MATRIX_PUBLIC_KEY,
          order_id: params.order_id || `ord_${Date.now().toString(36)}`,
          order_amount: params.amount,
          order_currency: params.currency || 'EUR',
          order_description: params.description || 'Payment',
          customer_first_name: params.first_name || 'Test',
          customer_last_name: params.last_name || 'Customer',
          customer_email: params.email || 'test@example.com',
          customer_country: params.country || 'GB',
          url_target: params.success_url || '',
          url_back: params.cancel_url || '',
        };
        break;
      }

      case 'status': {
        endpoint = '/v1/transaction/status';
        payload = {
          public_key: MATRIX_PUBLIC_KEY,
          order_id: params.order_id,
          transaction_id: params.transaction_id,
        };
        break;
      }

      case 'refund': {
        endpoint = '/v1/transaction/refund';
        payload = {
          public_key: MATRIX_PUBLIC_KEY,
          transaction_id: params.transaction_id,
          amount: params.amount,
        };
        break;
      }

      case 'customer_token': {
        endpoint = '/v1/customer/token';
        payload = {
          public_key: MATRIX_PUBLIC_KEY,
          customer_first_name: params.first_name || 'Test',
          customer_last_name: params.last_name || 'Customer',
          customer_email: params.email || 'test@example.com',
          customer_country: params.country || 'GB',
        };
        break;
      }

      case 'pay':
      case 'h2h_payment': {
        endpoint = '/v1/h2h/payment';
        payload = {
          public_key: MATRIX_PUBLIC_KEY,
          order_id: params.order_id || `ord_${Date.now().toString(36)}`,
          order_amount: params.amount,
          order_currency: params.currency || 'EUR',
          order_description: params.description || 'Payment',
          card_number: params.card_number,
          card_exp_month: params.card_exp_month,
          card_exp_year: params.card_exp_year,
          card_cvv2: params.card_cvv,
          customer_first_name: params.first_name || 'Test',
          customer_last_name: params.last_name || 'Customer',
          customer_email: params.email || 'test@example.com',
          customer_country: params.country || 'GB',
          customer_ip: params.ip || '127.0.0.1',
        };
        break;
      }

      default:
        return new Response(JSON.stringify({
          error: `Unknown action: ${action}`,
          code: 'INVALID_ACTION',
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[Matrix] ${action} -> ${baseUrl}${endpoint}`);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log(`[Matrix] Response ${response.status}: ${responseText}`);

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw_response: responseText };
    }

    // Map status codes to human-readable descriptions
    if (data.code !== undefined && STATUS_CODE_MAP[data.code]) {
      data.status_description = STATUS_CODE_MAP[data.code];
    }
    if (data.transactions) {
      for (const tx of data.transactions) {
        if (tx.code !== undefined && STATUS_CODE_MAP[tx.code]) {
          tx.status_description = STATUS_CODE_MAP[tx.code];
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
