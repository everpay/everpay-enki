import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { extSelect, extInsert, extUpdate } from "@/hooks/useExternalData";

/**
 * Backfill: ensure every merchant_pricing row has a stable primary key (id).
 *
 * The external DB has no composite unique constraint on (merchant_id, currency),
 * so the upsert path performs a manual find-and-update keyed by `id`. This helper
 * re-reads every pricing row and re-inserts any that are missing an `id`, returning
 * the count of rows that needed backfilling. Callable from an admin action button.
 */
export async function backfillMerchantPricingIds(): Promise<{ scanned: number; backfilled: number }> {
  const rows = await extSelect("merchant_pricing", { limit: 10_000 });
  let backfilled = 0;
  for (const r of rows as any[]) {
    if (r?.id) continue;
    // Re-insert without id so the DB assigns a fresh UUID PK; original orphan stays.
    const { id: _ignore, created_at, updated_at, ...payload } = r;
    await extInsert("merchant_pricing", payload);
    backfilled += 1;
  }
  return { scanned: rows.length, backfilled };
}

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
        return { mode: "update" as const, id: existingId };
      } else {
        const { id: _ignore, ...insertData } = pricing;
        const inserted = await extInsert("merchant_pricing", insertData);
        const newId = Array.isArray(inserted) ? inserted[0]?.id : (inserted as any)?.id;
        return { mode: "insert" as const, id: newId };
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant-pricing"] }),
  });

  return { ...query, upsert };
}