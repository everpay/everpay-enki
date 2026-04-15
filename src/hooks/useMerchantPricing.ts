import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { extSelect, extUpsert } from "@/hooks/useExternalData";

export function useMerchantPricing(merchantId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["merchant-pricing", merchantId],
    queryFn: async () => {
      const filters = merchantId ? { merchant_id: merchantId } : undefined;
      const rows = await extSelect("merchant_pricing", { filters, order: { column: "created_at", ascending: false } });
      // Enrich with merchant names
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
      sponsor_fee_pct: number;
      active: boolean;
    }) => {
      await extUpsert("merchant_pricing", pricing, "merchant_id,currency");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant-pricing"] }),
  });

  return { ...query, upsert };
}
