import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
 * Auth: Basic HTTP Auth with public_key:secret_key
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

// Matrix test cards
const TEST_CARDS = {
  visa_3ds: { number: '4012000300001003', expiry: '01/29', cvv: '030' },
  visa_no3ds: { number: '4012888888881881', expiry: '10/27', cvv: '000' },
  mc_no3ds: { number: '5413330300003002', expiry: '04/28', cvv: '440' },
  mc_no3ds_2: { number: '5555555555554444', expiry: '12/27', cvv: '111' },
  amex: { number: '371449635398431', expiry: '01/28', cvv: '0203' },
  unionpay: { number: '6212345678901232', expiry: '02/28', cvv: '092' },
};

// Matrix transaction status codes mapped to human-readable
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

    const MATRIX_PUBLIC_KEY = Deno.env.get('MATRIX_PUBLIC_KEY');
    const MATRIX_SECRET_KEY = Deno.env.get('MATRIX_SECRET_KEY');

    if (!MATRIX_PUBLIC_KEY || !MATRIX_SECRET_KEY) {
      return new Response(JSON.stringify({
        error: 'Matrix API keys not configured',
        simulation: true,
        ...simulateResponse(action, params),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const baseUrl = sandbox ? SANDBOX_URL : LIVE_URL;
    const authHeader = 'Basic ' + btoa(`${MATRIX_PUBLIC_KEY}:${MATRIX_SECRET_KEY}`);

    let endpoint = '';
    let requestBody: Record<string, any> = {};

    switch (action) {
      case 'customer_token':
        endpoint = '/v1/customer/token';
        requestBody = {
          id: params.customer_id,
          details: params.details || {},
        };
        break;

      case 'pay':
        endpoint = '/v1/transaction/pay';
        requestBody = {
          reference: params.reference || `evp_${Date.now()}`,
          order_id: params.order_id || `order_${Date.now()}`,
          order_description: params.description || 'Payment',
          token: params.payment_token,
          amount: Math.round(params.amount * 100), // minor units
          currency: params.currency || 'EUR',
          result_url: params.result_url,
          allow_cascading_after_3ds: params.allow_cascading || false,
        };
        break;

      case 'checkout':
        endpoint = '/v1/checkout/pay';
        requestBody = {
          reference: params.reference || `evp_${Date.now()}`,
          order_id: params.order_id || `order_${Date.now()}`,
          order_description: params.description || 'Checkout',
          amount: Math.round(params.amount * 100),
          currency: params.currency || 'EUR',
          result_url: params.result_url,
          success_url: params.success_url,
          error_url: params.error_url,
          customer_token: params.customer_token,
          callback_url: params.callback_url,
        };
        break;

      case 'h2h_payment':
        endpoint = '/v1/h2h/payment';
        requestBody = {
          order_id: params.order_id || `h2h_${Date.now()}`,
          order_description: params.description || 'H2H Payment',
          amount: Math.round(params.amount * 100),
          currency: params.currency || 'EUR',
          payment_account: {
            number: params.card_number,
            expiry_month: params.exp_month,
            expiry_year: params.exp_year,
            verification_value: params.cvv,
          },
          customer_ip: params.customer_ip || '127.0.0.1',
          result_url: params.result_url,
          callback_url: params.callback_url,
          extra_params: {
            email: params.email,
            first_name: params.first_name,
            last_name: params.last_name,
            address: (params.address || '').substring(0, 35),
            country: params.country,
            city: params.city,
            zip: params.zip,
            phone: params.phone,
          },
          customer_id: params.customer_id,
        };
        break;

      case 'h2h_apm':
        endpoint = '/v1/h2h/apm/payment';
        requestBody = {
          order_id: params.order_id || `apm_${Date.now()}`,
          order_description: params.description || 'APM Payment',
          amount: Math.round(params.amount * 100),
          currency: params.currency || 'EUR',
          payment_account: {
            method: params.method, // 'applepay' or 'googlepay'
          },
          details: { fullname: params.fullname || 'Customer' },
          customer_ip: params.customer_ip || '127.0.0.1',
          result_url: params.result_url,
          callback_url: params.callback_url,
          extra_params: {
            email: params.email,
            first_name: params.first_name,
            last_name: params.last_name,
            address: (params.address || '').substring(0, 35),
            country: params.country,
            city: params.city,
            zip: params.zip,
            phone: params.phone,
          },
          customer_id: params.customer_id,
        };
        break;

      case 'refund':
        endpoint = '/v1/transaction/refund';
        requestBody = {
          reference: params.reference || `ref_${Date.now()}`,
          order_id: params.order_id,
          order_description: params.description || 'Refund',
          parent_transaction_id: params.transaction_id,
          amount: params.amount ? Math.round(params.amount * 100) : undefined,
        };
        break;

      case 'payout':
        endpoint = '/v1/transaction/payout';
        requestBody = {
          reference: params.reference || `po_${Date.now()}`,
          order_id: params.order_id || `po_order_${Date.now()}`,
          order_description: params.description || 'Payout',
          token: params.payment_token,
          amount: Math.round(params.amount * 100),
          currency: params.currency || 'EUR',
        };
        break;

      case 'status':
        endpoint = '/v1/transaction/status';
        requestBody = params.transaction_id
          ? { transaction_id: params.transaction_id }
          : { order_id: params.order_id };
        break;

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    console.log(`[Matrix] ${action} → ${baseUrl}${endpoint}`);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // Map Matrix status codes
    if (data.transactions) {
      data.transactions = data.transactions.map((tx: any) => ({
        ...tx,
        status_description: STATUS_CODE_MAP[tx.code] || tx.reason || 'Unknown',
      }));
    }

    console.log(`[Matrix] Response: ${response.status}`, JSON.stringify(data).substring(0, 500));

    return new Response(JSON.stringify({
      ...data,
      provider: 'matrix',
      sandbox,
    }), {
      status: response.ok ? 200 : response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[Matrix] Error:', err);
    return new Response(JSON.stringify({ error: 'Matrix processing error', message: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Simulation for when keys aren't configured
function simulateResponse(action: string, params: any) {
  const txId = `mtx_sim_${Date.now().toString(36)}`;
  switch (action) {
    case 'customer_token':
      return { customer_token: `ct_sim_${Date.now().toString(36)}` };
    case 'pay':
    case 'h2h_payment':
      return {
        status: 'success',
        code: 0,
        reason: 'ok',
        id: params.order_id || txId,
        transactions: [{
          id: txId,
          status: 'success',
          code: 0,
          reason: 'ok',
          amount: params.amount,
          currency: params.currency || 'EUR',
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
    default:
      return { status: 'ok' };
  }
}
