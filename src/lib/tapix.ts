import { supabase } from '@/integrations/supabase/client';

// ─── Tapix Enrichment Types ─────────────────────────────────────
export interface TapixShopData {
  uid?: string;
  type?: string; // 'bricks' | 'online'
  tags?: string[];
  merchantUid?: string;
  category?: {
    name?: string;
    logo?: string;
  };
  location?: {
    address?: {
      street?: string;
      city?: string;
      zip?: string;
      country?: string;
      areas?: Record<string, string>;
    };
    coordinates?: {
      type?: string;
      lat?: number;
      long?: number;
    };
  };
  url?: string;
  googlePlaceId?: string;
}

export interface TapixMerchantData {
  uid?: string;
  name?: string;
  logo?: string;
}

export interface TapixEnrichmentResult {
  cached: boolean;
  findResult?: {
    result: string; // 'found' | 'unsolved' | 'error'
    handle?: string;
    shop?: { uid?: string };
  };
  shopData?: TapixShopData;
  merchantData?: TapixMerchantData;
  handle?: string;
  shopUid?: string;
  merchantUid?: string;
}

export interface TapixCacheRow {
  id: string;
  transaction_id: string;
  merchant_id: string;
  tapix_handle: string | null;
  shop_uid: string | null;
  merchant_uid: string | null;
  enrichment_type: string;
  shop_data: TapixShopData | null;
  merchant_data: TapixMerchantData | null;
  raw_find_response: any;
  created_at: string;
  updated_at: string;
}

// ─── Unified API Client ─────────────────────────────────────────

type TapixAction = 'enrich_card' | 'enrich_bank_transfer' | 'get_shop' | 'get_merchant' | 'enrich_full';

async function callTapix(body: Record<string, any>): Promise<any> {
  const { data, error } = await supabase.functions.invoke('tapix-enrich', { body });
  if (error) throw error;
  return data;
}

/**
 * Enrich a single transaction using the BFF pattern.
 * One call: finds shop → gets shop details → gets merchant details → caches result.
 */
export async function enrichTransaction(
  transactionId: string,
  transactionMerchantId: string
): Promise<TapixEnrichmentResult> {
  const res = await callTapix({
    action: 'enrich_full' as TapixAction,
    transactionId,
    transactionMerchantId,
  });
  return res.data as TapixEnrichmentResult;
}

/**
 * Enrich card payment data directly (without transaction context).
 */
export async function enrichCardPayment(params: {
  posId?: string;
  merchantId?: string;
  description?: string;
  city?: string;
  country?: string;
  mcc?: string;
}) {
  const res = await callTapix({ action: 'enrich_card' as TapixAction, ...params });
  return res.data;
}

/**
 * Enrich bank transfer data directly.
 */
export async function enrichBankTransfer(params: {
  transferType?: 'sepa' | 'uk' | 'certis';
  bic?: string;
  iban?: string;
  accountNumber?: string;
  sortCode?: string;
  name?: string;
  city?: string;
  country?: string;
  zip?: string;
}) {
  const res = await callTapix({ action: 'enrich_bank_transfer' as TapixAction, ...params });
  return res.data;
}

/**
 * Get shop details by UID.
 */
export async function getShopDetails(shopUid: string) {
  const res = await callTapix({ action: 'get_shop' as TapixAction, shopUid });
  return res.data as TapixShopData;
}

/**
 * Get merchant details by UID.
 */
export async function getMerchantDetails(merchantUid: string) {
  const res = await callTapix({ action: 'get_merchant' as TapixAction, merchantUid });
  return res.data as TapixMerchantData;
}

/**
 * Fetch cached enrichment data for multiple transactions (from DB, no API calls).
 */
export async function getCachedEnrichments(transactionIds: string[]): Promise<Record<string, TapixCacheRow>> {
  if (!transactionIds.length) return {};
  
  const { data, error } = await supabase
    .from('tapix_enrichment_cache')
    .select('*')
    .in('transaction_id', transactionIds);

  if (error) {
    console.error('Error fetching cached enrichments:', error);
    return {};
  }

  const map: Record<string, TapixCacheRow> = {};
  for (const row of (data || []) as unknown as TapixCacheRow[]) {
    map[row.transaction_id] = row;
  }
  return map;
}
