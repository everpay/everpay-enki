import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * DC Bank (DCGroup) Integration — Canadian Processing Only
 * 
 * Canada's #1 e-Transfer processor (48% market share in Request Money).
 * Only available for Canadian-based end customers.
 * 
 * Sandbox: https://mrcapisandbox.dcbank.ca
 * Production: https://clientprod.dcbankapi.com/integrationapi/V1.0
 * 
 * Auth: JWT Bearer Token via Login endpoint
 * Services: e-Transfer (Request Money, Bulk Send), EFT, VISA Direct, Bill Payment
 */

const SANDBOX_URL = 'https://mrcapisandbox.dcbank.ca/integrationapi/V1.0';
const PROD_URL = 'https://clientprod.dcbankapi.com/integrationapi/V1.0';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, sandbox = true, ...params } = body;

    const DCBANK_USERNAME = Deno.env.get('DCBANK_USERNAME');
    const DCBANK_PASSWORD = Deno.env.get('DCBANK_PASSWORD');
    const DCBANK_TOKEN = Deno.env.get('DCBANK_TOKEN');

    // Check if we have credentials
    if (!DCBANK_TOKEN && (!DCBANK_USERNAME || !DCBANK_PASSWORD)) {
      return new Response(JSON.stringify({
        error: 'DC Bank credentials not configured',
        simulation: true,
        ...simulateResponse(action, params),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const baseUrl = sandbox ? SANDBOX_URL : PROD_URL;

    // Authenticate if we have username/password but no token
    let bearerToken = DCBANK_TOKEN || '';
    if (!bearerToken && DCBANK_USERNAME && DCBANK_PASSWORD) {
      const loginResp = await fetch(`${baseUrl}/Authentication/Login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: DCBANK_USERNAME, password: DCBANK_PASSWORD }),
      });
      if (!loginResp.ok) {
        const errText = await loginResp.text();
        return new Response(JSON.stringify({
          error: 'DC Bank authentication failed',
          details: errText,
        }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const loginData = await loginResp.json();
      bearerToken = loginData.token || loginData.access_token || '';
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`,
    };

    let endpoint = '';
    let method = 'POST';
    let requestBody: Record<string, any> = {};

    switch (action) {
      case 'create_etransfer':
        // Interac e-Transfer Request Money
        endpoint = '/ETransfer/CreateEtransferTransaction';
        requestBody = {
          amount: params.amount,
          currency: 'CAD',
          email: params.customer_email,
          firstName: params.first_name,
          lastName: params.last_name,
          message: params.description || 'Payment request',
          expiryDate: params.expiry_date,
          callbackUrl: params.callback_url,
        };
        break;

      case 'create_bulk_send':
        // Bulk e-Transfer Send
        endpoint = '/ETransfer/BulkSend';
        requestBody = {
          transactions: params.transactions || [],
        };
        break;

      case 'etransfer_status':
        // Check e-Transfer status
        endpoint = `/ETransfer/GetTransactionStatus/${params.transaction_id}`;
        method = 'GET';
        break;

      case 'create_eft':
        // Electronic Funds Transfer
        endpoint = '/EFT/CreateEftTransaction';
        requestBody = {
          amount: params.amount,
          currency: 'CAD',
          transitNumber: params.transit_number,
          institutionNumber: params.institution_number,
          accountNumber: params.account_number,
          firstName: params.first_name,
          lastName: params.last_name,
        };
        break;

      case 'visa_direct':
        // VISA Direct push to card
        endpoint = '/VisaDirect/PushFunds';
        requestBody = {
          amount: params.amount,
          currency: 'CAD',
          cardNumber: params.card_number,
          recipientName: params.recipient_name,
        };
        break;

      case 'wallet_balance':
        endpoint = '/Wallet/GetBalance';
        method = 'GET';
        break;

      case 'customer_create':
        endpoint = '/Customer/Create';
        requestBody = {
          email: params.email,
          firstName: params.first_name,
          lastName: params.last_name,
          phone: params.phone,
          address: params.address,
          city: params.city,
          province: params.province,
          postalCode: params.postal_code,
          country: 'CA',
        };
        break;

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    console.log(`[DCBank] ${action} → ${baseUrl}${endpoint}`);

    const fetchOpts: RequestInit = {
      method,
      headers,
    };
    if (method === 'POST') {
      fetchOpts.body = JSON.stringify(requestBody);
    }

    const response = await fetch(`${baseUrl}${endpoint}`, fetchOpts);
    const data = await response.json();

    console.log(`[DCBank] Response: ${response.status}`, JSON.stringify(data).substring(0, 500));

    return new Response(JSON.stringify({
      ...data,
      provider: 'dcbank',
      sandbox,
    }), {
      status: response.ok ? 200 : response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[DCBank] Error:', err);
    return new Response(JSON.stringify({ error: 'DC Bank processing error', message: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function simulateResponse(action: string, params: any) {
  const txId = `dcb_sim_${Date.now().toString(36)}`;
  switch (action) {
    case 'create_etransfer':
      return {
        status: 'pending',
        transactionId: txId,
        message: 'e-Transfer request sent to customer',
        amount: params.amount,
        currency: 'CAD',
      };
    case 'etransfer_status':
      return {
        status: 'completed',
        transactionId: params.transaction_id || txId,
      };
    case 'create_eft':
      return {
        status: 'processing',
        transactionId: txId,
        message: 'EFT initiated',
      };
    case 'visa_direct':
      return {
        status: 'completed',
        transactionId: txId,
        message: 'VISA Direct push completed',
      };
    case 'wallet_balance':
      return { balance: 0, currency: 'CAD' };
    case 'customer_create':
      return { customerId: txId, status: 'created' };
    default:
      return { status: 'ok' };
  }
}
