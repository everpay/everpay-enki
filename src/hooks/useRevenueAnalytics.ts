import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";

export function useRevenueAnalytics() {
  return useQuery({
    queryKey: ["revenue-analytics"],
    queryFn: async () => {
      const fees = await extSelect("fee_breakdowns", {
        order: { column: "created_at", ascending: false },
        limit: 1000,
      });

      // Get merchant names
      const merchants = await extSelect("merchants", { select: "id, name" });
      const nameMap = new Map(merchants.map((m: any) => [m.id, m.name]));

      const totalRevenue = (fees || []).reduce((s: number, f: any) => s + Number(f.everpay_fee), 0);
      const totalProcessorCosts = (fees || []).reduce((s: number, f: any) => s + Number(f.processor_fee), 0);
      const totalSponsorCosts = (fees || []).reduce((s: number, f: any) => s + Number(f.sponsor_fee), 0);
      const totalVolume = (fees || []).reduce((s: number, f: any) => s + Number(f.transaction_amount), 0);
      const netMargin = totalRevenue;
      const transactionCount = fees?.length || 0;

      const byMerchant = new Map<string, { name: string; volume: number; fees: number; everpay: number; count: number }>();
      for (const f of fees || []) {
        const mid = f.merchant_id;
        const existing = byMerchant.get(mid) || { name: (nameMap.get(mid) as string) || "Unknown", volume: 0, fees: 0, everpay: 0, count: 0 };
        existing.volume += Number(f.transaction_amount);
        existing.fees += Number(f.total_fee);
        existing.everpay += Number(f.everpay_fee);
        existing.count += 1;
        byMerchant.set(mid, existing);
      }

      return {
        totalRevenue,
        totalProcessorCosts,
        totalSponsorCosts,
        totalVolume,
        netMargin,
        transactionCount,
        merchantBreakdown: Array.from(byMerchant.entries()).map(([id, d]) => ({ merchant_id: id, ...d })),
        raw: fees,
      };
    },
  });
}
