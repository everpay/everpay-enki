import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useBillingPeriods(merchantId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["billing-periods", merchantId],
    queryFn: async () => {
      let q = supabase.from("billing_periods").select("*, merchants(name), invoices(id, status)").order("period_start", { ascending: false });
      if (merchantId) q = q.eq("merchant_id", merchantId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const generateBilling = useMutation({
    mutationFn: async (merchantIdParam?: string) => {
      const { data, error } = await supabase.functions.invoke("generate-billing", {
        body: { merchant_id: merchantIdParam },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["billing-periods"] }),
  });

  return { ...query, generateBilling };
}
