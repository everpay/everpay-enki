import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useResellerSplits(resellerId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["reseller-splits", resellerId],
    queryFn: async () => {
      let q = supabase.from("reseller_splits").select("*, merchants(name)").order("created_at", { ascending: false });
      if (resellerId) q = q.eq("reseller_id", resellerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async (split: { reseller_id: string; merchant_id: string; revenue_share_pct: number; active: boolean }) => {
      const { error } = await supabase.from("reseller_splits").upsert(split, { onConflict: "reseller_id,merchant_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reseller-splits"] }),
  });

  return { ...query, upsert };
}
