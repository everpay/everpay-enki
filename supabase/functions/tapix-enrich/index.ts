import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TAPIX_BASE = 'https://api.tapix.io/v6';

interface EnrichRequest {
  action: 'enrich_card' | 'enrich_bank_transfer' | 'get_shop' | 'get_merchant' | 'enrich_full';
  // Card transaction params
  posId?: string;
  merchantId?: string;
  description?: string;
  city?: string;
  country?: string;
  mcc?: string;
  // Bank transfer params
  transferType?: 'sepa' | 'uk' | 'certis';
  bic?: string;
  iban?: string;
  accountNumber?: string;
  sortCode?: string;
  name?: string;
  zip?: string;
  paymentType?: string;
  paymentMethod?: string;
  // Shop/merchant lookup
  shopUid?: string;
  merchantUid?: string;
  // Full enrichment (BFF pattern) - one call does everything
  transactionId?: string;
  transactionMerchantId?: string;
}

async function tapixFetch(path: string, token: string): Promise<any> {
  const res = await fetch(`${TAPIX_BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Tapix API [${res.status}]: ${body}`);
  }
  return res.json();
}

async function findByCardTransaction(params: Record<string, string>, token: string) {
  const qs = new URLSearchParams(params).toString();
  return tapixFetch(`/shops/complete/findByCardTransaction?${qs}`, token);
}

async function findByBankTransfer(type: string, params: Record<string, string>, token: string) {
  const qs = new URLSearchParams(params).toString();
  return tapixFetch(`/shops/findByBankTransfer/${type}?${qs}`, token);
}

async function getShop(shopUid: string, token: string) {
  return tapixFetch(`/shops/${shopUid}`, token);
}

async function getMerchant(merchantUid: string, token: string) {
  return tapixFetch(`/merchants/${merchantUid}`, token);
}

// Full enrichment chain: find shop → get shop details → get merchant details
async function enrichFull(
  findResult: any,
  token: string,
  useCompleteEndpoint: boolean = false
) {
  const response: any = { findResult };

  // If complete endpoint was used, shop data is already in findResult
  if (useCompleteEndpoint && findResult.result === 'found' && findResult.shop) {
    response.shopData = findResult.shop;
    if (findResult.shop.merchantUid) {
      try {
        response.merchantData = await getMerchant(findResult.shop.merchantUid, token);
      } catch (e) {
        console.warn('Failed to fetch merchant:', e);
      }
    }
    return response;
  }

  if (findResult.result === 'found' && findResult.shop?.uid) {
    try {
      response.shopData = await getShop(findResult.shop.uid, token);
      if (response.shopData?.merchantUid) {
        try {
          response.merchantData = await getMerchant(response.shopData.merchantUid, token);
        } catch (e) {
          console.warn('Failed to fetch merchant:', e);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch shop:', e);
    }
  }

  return response;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const TAPIX_TOKEN = Deno.env.get('TAPIX_TOKEN');
    if (!TAPIX_TOKEN) throw new Error('TAPIX_TOKEN is not configured');

    const body: EnrichRequest = await req.json();
    const { action } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'action is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let result: any;

    switch (action) {
      case 'enrich_card': {
        const params: Record<string, string> = {};
        if (body.posId) params.posId = body.posId;
        if (body.merchantId) params.merchantId = body.merchantId;
        if (body.description) params.description = body.description;
        if (body.city) params.city = body.city;
        if (body.country) params.country = body.country;
        if (body.mcc) params.mcc = body.mcc;
        params.refresh = 'false';

        const findResult = await findByCardTransaction(params, TAPIX_TOKEN);
        result = await enrichFull(findResult, TAPIX_TOKEN, true);
        break;
      }

      case 'enrich_bank_transfer': {
        const transferType = body.transferType || 'sepa';
        const params: Record<string, string> = {};
        if (body.bic) params.bic = body.bic;
        if (body.iban) params.iban = body.iban;
        if (body.accountNumber) params.accountNumber = body.accountNumber;
        if (body.sortCode) params.sortCode = body.sortCode;
        if (body.name) params.name = body.name;
        if (body.city) params.city = body.city;
        if (body.country) params.country = body.country;
        if (body.zip) params.zip = body.zip;
        if (body.paymentType) params.paymentType = body.paymentType;
        if (body.paymentMethod) params.paymentMethod = body.paymentMethod;
        params.refresh = 'false';

        const findResult = await findByBankTransfer(transferType, params, TAPIX_TOKEN);
        result = await enrichFull(findResult, TAPIX_TOKEN);
        break;
      }

      case 'get_shop': {
        if (!body.shopUid) {
          return new Response(JSON.stringify({ error: 'shopUid is required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        result = await getShop(body.shopUid, TAPIX_TOKEN);
        break;
      }

      case 'get_merchant': {
        if (!body.merchantUid) {
          return new Response(JSON.stringify({ error: 'merchantUid is required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        result = await getMerchant(body.merchantUid, TAPIX_TOKEN);
        break;
      }

      case 'enrich_full': {
        // BFF pattern: one call enriches a transaction and caches the result
        if (!body.transactionId || !body.transactionMerchantId) {
          return new Response(JSON.stringify({ error: 'transactionId and transactionMerchantId are required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Check cache first
        const { data: cached } = await supabaseAdmin
          .from('tapix_enrichment_cache')
          .select('*')
          .eq('transaction_id', body.transactionId)
          .single();

        if (cached) {
          result = {
            cached: true,
            findResult: cached.raw_find_response,
            shopData: cached.shop_data,
            merchantData: cached.merchant_data,
            handle: cached.tapix_handle,
            shopUid: cached.shop_uid,
            merchantUid: cached.merchant_uid,
          };
          break;
        }

        // Get transaction metadata for enrichment params
        const { data: txData } = await supabaseAdmin
          .from('transactions')
          .select('*')
          .eq('id', body.transactionId)
          .single();

        if (!txData) {
          return new Response(JSON.stringify({ error: 'Transaction not found' }), {
            status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const meta = (txData as any).metadata || {};
        let enrichResult: any;
        let enrichmentType = 'card';

        // Determine if card or bank transfer based on metadata
        const paymentMethodType = meta.payment_method_type || meta.payment_type || meta.payment_method || '';
        const isBankTransfer = ['ach', 'sepa', 'pix', 'boleto', 'bank_transfer', 'wire', 'open_banking', 'bacs', 'faster_payment'].some(
          t => paymentMethodType.toLowerCase().includes(t)
        );

        if (isBankTransfer) {
          enrichmentType = 'bank_transfer';
          const bankParams: Record<string, string> = {};
          if (meta.bic) bankParams.bic = meta.bic;
          if (meta.iban) bankParams.iban = meta.iban;
          if (meta.account_number || meta.accountNumber) bankParams.accountNumber = meta.account_number || meta.accountNumber;
          if (meta.sort_code || meta.sortCode) bankParams.sortCode = meta.sort_code || meta.sortCode;
          if (meta.counterparty_name || meta.name) bankParams.name = meta.counterparty_name || meta.name;
          if (meta.city) bankParams.city = meta.city;
          if (meta.country || txData.currency === 'GBP') bankParams.country = meta.country || (txData.currency === 'GBP' ? 'GB' : '');
          if (meta.zip) bankParams.zip = meta.zip;
          bankParams.refresh = 'false';

          // Determine transfer type from currency/country
          let transferType = 'sepa';
          if (txData.currency === 'GBP' || meta.country === 'GB') transferType = 'uk';
          else if (txData.currency === 'CZK' || meta.country === 'CZ') transferType = 'certis';

          try {
            const findResult = await findByBankTransfer(transferType, bankParams, TAPIX_TOKEN);
            enrichResult = await enrichFull(findResult, TAPIX_TOKEN);
          } catch (e) {
            console.warn('Bank transfer enrichment failed:', e);
            enrichResult = { findResult: { result: 'error', error: String(e) } };
          }
        } else {
          // Card enrichment
          const cardParams: Record<string, string> = {};
          if (meta.pos_id || meta.posId) cardParams.posId = meta.pos_id || meta.posId;
          if (meta.acquirer_merchant_id || meta.merchantId) cardParams.merchantId = meta.acquirer_merchant_id || meta.merchantId;
          if (txData.description) cardParams.description = txData.description;
          if (meta.city) cardParams.city = meta.city;
          if (meta.country) cardParams.country = meta.country;
          if (meta.mcc) cardParams.mcc = meta.mcc;
          // Build a synthetic card descriptor from metadata if available
          if (meta.cardFirst6) cardParams.cardNumber = meta.cardFirst6;
          cardParams.refresh = 'false';

          // Tapix requires at least description or posId+merchantId or cardNumber
          const hasEnoughParams = cardParams.description || cardParams.posId || cardParams.merchantId || cardParams.cardNumber;
          if (!hasEnoughParams) {
            console.warn('Insufficient data for card enrichment, skipping');
            enrichResult = { findResult: { result: 'not_found', reason: 'insufficient_params' } };
          } else {
            try {
              const findResult = await findByCardTransaction(cardParams, TAPIX_TOKEN);
              enrichResult = await enrichFull(findResult, TAPIX_TOKEN, true);
            } catch (e) {
              console.warn('Card enrichment failed:', e);
              enrichResult = { findResult: { result: 'error', error: String(e) } };
            }
          }
        }

        // Cache the result
        const cacheEntry = {
          transaction_id: body.transactionId,
          merchant_id: body.transactionMerchantId,
          tapix_handle: enrichResult.findResult?.handle || null,
          shop_uid: enrichResult.shopData?.uid || enrichResult.findResult?.shop?.uid || null,
          merchant_uid: enrichResult.merchantData?.uid || enrichResult.shopData?.merchantUid || null,
          enrichment_type: enrichmentType,
          shop_data: enrichResult.shopData || null,
          merchant_data: enrichResult.merchantData || null,
          raw_find_response: enrichResult.findResult || null,
        };

        await supabaseAdmin.from('tapix_enrichment_cache').upsert(cacheEntry, { onConflict: 'transaction_id' });

        result = {
          cached: false,
          ...enrichResult,
          handle: cacheEntry.tapix_handle,
          shopUid: cacheEntry.shop_uid,
          merchantUid: cacheEntry.merchant_uid,
        };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in tapix-enrich:', error);
    return new Response(JSON.stringify({ error: 'An internal error occurred', details: error instanceof Error ? error.message : 'Unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
