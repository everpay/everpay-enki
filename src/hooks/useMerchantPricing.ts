import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { extSelect, extInsert, extUpdate } from "@/hooks/useExternalData";

export function useMerchantPricing(merchantId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["merchant-pricing", merchantId],
    queryFn: async () => {
      const filters = merchantId ? { merchant_id: merchantId } : undefined;
      const rows = await extSelect("merchant_pricing", { filters, order: { column: "created_at", ascending: false } });
      const merchants = await extSelect("merchants", { select: "id, name" });
      const nameMap = new Map(merchants.map((m: any) => [m.id, m.name]));
      return rows.map((r: any) => ({ ...r, merchants: { name: nameMap.get(r.merchant_id) || r.merchant_id?.slice(0, 8) } }));
    },
  });

  const upsert = useMutation({
    mutationFn: async (pricing: {
      id?: string;
      merchant_id: string;
      model_type: string;
      percentage_fee: number;
      fixed_fee: number;
      currency: string;
      tiers?: any;
      active: boolean;
    }) => {
      // External DB has no composite unique on (merchant_id, currency),
      // so manually find-and-update or insert to avoid ON CONFLICT errors.
      const existing = await extSelect("merchant_pricing", {
        filters: { merchant_id: pricing.merchant_id, currency: pricing.currency },
        limit: 1,
      });
      const existingId = pricing.id || existing?.[0]?.id;
      if (existingId) {
        const { id: _ignore, ...patch } = pricing;
        await extUpdate("merchant_pricing", existingId, patch);
      } else {
        const { id: _ignore, ...insertData } = pricing;
        await extInsert("merchant_pricing", insertData);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant-pricing"] }),
  });

  return { ...query, upsert };
}