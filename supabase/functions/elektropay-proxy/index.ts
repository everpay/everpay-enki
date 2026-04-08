import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ELEKTROPAY_API_URL = 'https://apiv3.elektropay.com/int';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('ELEKTROPAY_API_KEY');
    const apiSecret = Deno.env.get('ELEKTROPAY_API_SECRET');
    if (!apiKey || !apiSecret) throw new Error('Elektropay credentials not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    let merchantId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: merchant } = await supabase
          .from('merchants').select('id').eq('user_id', user.id).single();
        if (merchant) merchantId = merchant.id;
      }
    }

    const body = await req.json();
    const { action, ...params } = body;

    const basicAuth = btoa(`${apiKey}:${apiSecret}`);
    const headers = {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
    };

    let result: any;

    switch (action) {
      case 'get_assets': {
        const res = await fetch(`${ELEKTROPAY_API_URL}/assets`, { headers });
        result = await res.json();
        break;
      }

      case 'get_accounts': {
        const res = await fetch(`${ELEKTROPAY_API_URL}/accounts`, { headers });
        result = await res.json();
        break;
      }

      case 'convert': {
        const res = await fetch(`${ELEKTROPAY_API_URL}/convert`, {
          method: 'POST', headers,
          body: JSON.stringify({
            from_amount: params.from_amount,
            from_asset_id: params.from_asset_id,
            asset_id: params.asset_id,
          }),
        });
        result = await res.json();
        break;
      }

      case 'create_payment': {
        const webhookUrl = `${supabaseUrl}/functions/v1/elektropay-webhook`;
        const successUrl = params.success_url || `${supabaseUrl.replace('.supabase.co', '.supabase.co')}/checkout/thank-you`;

        // Calculate fees: 5% commission + $1.00 flat
        const fiatAmount = parseFloat(params.amount);
        const commissionAmount = fiatAmount * 0.05;
        const flatFee = 1.00;
        const totalFees = commissionAmount + flatFee;

        const paymentPayload: any = {
          payment_type: params.payment_type || 'FIXED_AMOUNT',
          amount: fiatAmount,
          asset_id: params.fiat_currency || 'USD',
          payment_asset_id: params.crypto_currency || 'USDT.TRC20',
          payer_email: params.customer_email,
          payer_name: params.customer_name,
          payer_lang: 'en',
          description: params.description || 'Payment via Everpay',
          webhook_url: webhookUrl,
          success_url: params.success_url || successUrl,
          cancel_url: params.cancel_url,
          custom: JSON.stringify({
            merchant_id: merchantId,
            everpay_transaction_id: params.transaction_id,
            commission_rate: 0.05,
            flat_fee: 1.00,
          }),
        };

        const res = await fetch(`${ELEKTROPAY_API_URL}/payment`, {
          method: 'POST', headers,
          body: JSON.stringify(paymentPayload),
        });
        result = await res.json();

        // Store in our DB
        if (merchantId && result.payment_id) {
          await supabase.from('elektropay_payments').insert({
            merchant_id: merchantId,
            transaction_id: params.transaction_id || null,
            elektropay_payment_id: result.payment_id,
            payment_type: paymentPayload.payment_type,
            fiat_amount: fiatAmount,
            fiat_currency: paymentPayload.asset_id,
            crypto_amount: parseFloat(result.payment_amount || '0'),
            crypto_currency: result.payment_asset_id,
            crypto_network: result.crypto_network,
            exchange_rate: result.rate,
            rate_date: result.rate_date,
            remain_amount: parseFloat(result.remain_amount || '0'),
            status: 'open',
            payment_url: result.payment_url,
            qrcode_url: result.qrcode_url,
            wallet_address: result.address,
            customer_email: params.customer_email,
            customer_name: params.customer_name,
            commission_rate: 0.05,
            commission_amount: commissionAmount,
            flat_fee: flatFee,
            total_fees: totalFees,
            net_amount: fiatAmount - totalFees,
          });
        }
        break;
      }

      case 'get_payment': {
        const res = await fetch(`${ELEKTROPAY_API_URL}/payment/${params.payment_id}`, { headers });
        result = await res.json();
        break;
      }

      case 'create_withdrawal': {
        const res = await fetch(`${ELEKTROPAY_API_URL}/withdraw`, {
          method: 'POST', headers,
          body: JSON.stringify({
            amount: params.amount,
            asset_id: params.asset_id,
            withdraw_asset_id: params.withdraw_asset_id || params.asset_id,
            address: params.address,
            payer_email: params.payer_email,
            payer_name: params.payer_name,
            description: params.description || 'Withdrawal via Everpay',
            webhook_url: `${supabaseUrl}/functions/v1/elektropay-webhook`,
          }),
        });
        result = await res.json();

        if (merchantId && result.withdraw_id) {
          await supabase.from('elektropay_withdrawals').insert({
            merchant_id: merchantId,
            elektropay_withdraw_id: result.withdraw_id,
            amount: params.amount,
            asset_id: params.asset_id,
            withdraw_asset_id: params.withdraw_asset_id || params.asset_id,
            destination_address: params.address,
            fee: parseFloat(result.fee || '0'),
            fee_asset_id: result.fee_asset_id,
            status: 'open',
            crypto_network: result.crypto_network,
          });
        }
        break;
      }

      case 'create_transfer': {
        const res = await fetch(`${ELEKTROPAY_API_URL}/transfer`, {
          method: 'POST', headers,
          body: JSON.stringify({
            to_store_id: params.to_store_id,
            amount: params.amount,
            asset_id: params.asset_id,
            description: params.description,
          }),
        });
        result = await res.json();
        break;
      }

      case 'dedicate_address': {
        const res = await fetch(`${ELEKTROPAY_API_URL}/dedicate`, {
          method: 'POST', headers,
          body: JSON.stringify({
            asset_id: params.asset_id || 'USDT.TRC20',
            payer_email: params.payer_email,
            payer_name: params.payer_name,
            payer_lang: 'en',
            description: params.description || 'Dedicated wallet address',
            address_alloc: 'NEW',
            dedicate_type: 'USES',
            webhook_url: `${supabaseUrl}/functions/v1/elektropay-webhook`,
          }),
        });
        result = await res.json();

        // Store wallet address for merchant
        if (merchantId && result.address) {
          await supabase.from('elektropay_wallets').upsert({
            merchant_id: merchantId,
            asset_id: result.asset_id || params.asset_id,
            currency: result.asset_id?.split('.')[0] || params.asset_id,
            crypto_network: result.crypto_network,
            crypto_network_name: result.crypto_network_name,
            wallet_address: result.address,
            address_id: result.address_id,
            dedicate_id: result.dedicate_id,
            elektropay_account_id: result.account_id,
            elektropay_store_id: result.store_id,
          }, { onConflict: 'merchant_id,asset_id' });
        }
        break;
      }

      case 'create_deposit': {
        const webhookUrl = `${supabaseUrl}/functions/v1/elektropay-webhook`;
        const depositPayload: any = {
          asset_id: params.crypto_currency || 'USDT.TRC20',
          payer_email: params.payer_email,
          payer_name: params.payer_name,
          payer_lang: 'en',
          description: params.description || 'Deposit via Everpay',
          timeout: params.timeout || 1440,
          webhook_url: webhookUrl,
        };

        const res = await fetch(`${ELEKTROPAY_API_URL}/deposit`, {
          method: 'POST', headers,
          body: JSON.stringify(depositPayload),
        });
        result = await res.json();

        if (merchantId && result.deposit_id) {
          await supabase.from('elektropay_payments').insert({
            merchant_id: merchantId,
            elektropay_payment_id: result.deposit_id,
            payment_type: 'DEPOSIT',
            fiat_amount: 0,
            fiat_currency: 'USD',
            crypto_currency: params.crypto_currency || 'USDT.TRC20',
            crypto_network: result.crypto_network,
            status: 'open',
            wallet_address: result.address,
            customer_email: params.payer_email,
            customer_name: params.payer_name,
            commission_rate: 0.05,
            flat_fee: 1.00,
          });
        }
        break;
      }

      case 'sync_balances': {
        const res = await fetch(`${ELEKTROPAY_API_URL}/accounts`, { headers });
        const accountsData = await res.json();

        if (merchantId && accountsData.accounts) {
          for (const acct of accountsData.accounts) {
            await supabase.from('elektropay_wallets').upsert({
              merchant_id: merchantId,
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

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Elektropay proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
