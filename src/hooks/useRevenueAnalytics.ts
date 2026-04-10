import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRevenueAnalytics() {
  return useQuery({
    queryKey: ["revenue-analytics"],
    queryFn: async () => {
      const { data: fees, error } = await supabase
        .from("fee_breakdowns")
        .select("processor_fee, sponsor_fee, everpay_fee, total_fee, transaction_amount, merchant_id, created_at, merchants(name)")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;

      const totalRevenue = (fees || []).reduce((s, f) => s + Number(f.everpay_fee), 0);
      const totalProcessorCosts = (fees || []).reduce((s, f) => s + Number(f.processor_fee), 0);
      const totalSponsorCosts = (fees || []).reduce((s, f) => s + Number(f.sponsor_fee), 0);
      const totalVolume = (fees || []).reduce((s, f) => s + Number(f.transaction_amount), 0);
      const netMargin = totalRevenue;
      const transactionCount = fees?.length || 0;

      // Per-merchant breakdown
      const byMerchant = new Map<string, { name: string; volume: number; fees: number; everpay: number; count: number }>();
      for (const f of fees || []) {
        const mid = f.merchant_id;
        const existing = byMerchant.get(mid) || { name: (f.merchants as any)?.name || "Unknown", volume: 0, fees: 0, everpay: 0, count: 0 };
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
