import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCachedEnrichments, enrichTransaction, TapixCacheRow } from '@/lib/tapix';

/**
 * Hook to fetch cached Tapix enrichment data for a list of transactions.
 * Does NOT trigger API calls to Tapix — only reads from cache.
 */
export function useTapixCache(transactionIds: string[]) {
  return useQuery({
    queryKey: ['tapix-cache', transactionIds.sort().join(',')],
    queryFn: () => getCachedEnrichments(transactionIds),
    enabled: transactionIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/**
 * Hook to trigger Tapix enrichment for a single transaction.
 * Enriches via the BFF edge function and caches the result.
 */
export function useTapixEnrich() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, merchantId }: { transactionId: string; merchantId: string }) =>
      enrichTransaction(transactionId, merchantId),
    onSuccess: () => {
      // Invalidate cache queries so UI picks up new data
      queryClient.invalidateQueries({ queryKey: ['tapix-cache'] });
    },
  });
}

/**
 * Get enrichment summary from cache row for display purposes.
 */
export function getEnrichmentSummary(cache: TapixCacheRow | undefined) {
  if (!cache) return null;

  const shop = cache.shop_data as any;
  const merchant = cache.merchant_data as any;
  const findResult = cache.raw_find_response as any;

  return {
    found: findResult?.result === 'found',
    merchantName: merchant?.name || null,
    merchantLogo: merchant?.logo || null,
    shopType: shop?.type || null, // 'bricks' | 'online'
    category: shop?.category?.name || null,
    categoryLogo: shop?.category?.logo || null,
    tags: shop?.tags || [],
    address: shop?.location?.address ? 
      [shop.location.address.street, shop.location.address.city, shop.location.address.zip, shop.location.address.country].filter(Boolean).join(', ') : null,
    city: shop?.location?.address?.city || null,
    country: shop?.location?.address?.country || null,
    coordinates: shop?.location?.coordinates ? { lat: shop.location.coordinates.lat, lng: shop.location.coordinates.long } : null,
    shopUrl: shop?.url || null,
    googlePlaceId: shop?.googlePlaceId || null,
    enrichmentType: cache.enrichment_type,
    handle: cache.tapix_handle,
  };
}
