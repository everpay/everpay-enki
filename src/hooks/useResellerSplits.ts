import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { extSelect, extUpsert } from "@/hooks/useExternalData";

export function useResellerSplits(resellerId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["reseller-splits", resellerId],
    queryFn: async () => {
      try {
        const filters = resellerId ? { reseller_id: resellerId } : undefined;
        const splits = await extSelect("reseller_splits", { filters, order: { column: "created_at", ascending: false } });
        const merchants = await extSelect("merchants", { select: "id, name" });
        const nameMap = new Map(merchants.map((m: any) => [m.id, m.name]));
        return splits.map((s: any) => ({ ...s, merchants: { name: nameMap.get(s.merchant_id) || s.merchant_id?.slice(0, 8) } }));
      } catch {
        // Table may not exist on external DB yet
        return [];
      }
    },
  });

  const upsert = useMutation({
    mutationFn: async (split: { reseller_id: string; merchant_id: string; revenue_share_pct: number; active: boolean }) => {
      await extUpsert("reseller_splits", split, "reseller_id,merchant_id");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reseller-splits"] }),
  });

  return { ...query, upsert };
}
