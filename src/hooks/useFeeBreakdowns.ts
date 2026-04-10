import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFeeBreakdowns(merchantId?: string, limit = 100) {
  return useQuery({
    queryKey: ["fee-breakdowns", merchantId, limit],
    queryFn: async () => {
      let q = supabase.from("fee_breakdowns").select("*, merchants(name)").order("created_at", { ascending: false }).limit(limit);
      if (merchantId) q = q.eq("merchant_id", merchantId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}
