import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMerchantPricing(merchantId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["merchant-pricing", merchantId],
    queryFn: async () => {
      let q = supabase.from("merchant_pricing").select("*, merchants(name)").order("created_at", { ascending: false });
      if (merchantId) q = q.eq("merchant_id", merchantId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
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
      const { error } = await supabase.from("merchant_pricing").upsert(pricing, { onConflict: "merchant_id,currency" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant-pricing"] }),
  });

  return { ...query, upsert };
}
