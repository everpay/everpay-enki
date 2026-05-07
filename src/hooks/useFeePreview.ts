import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeePreview {
  profile: any | null;
  amount: number;
  percentageAmount: number;
  fixedAmount: number;
  totalFee: number;
  net: number;
  matched: boolean;
}

export function useFeePreview(provider: string, currency: string, amount: number) {
  return useQuery<FeePreview>({
    queryKey: ["fee-preview", provider, currency, amount],
    enabled: !!provider && !!currency,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      let profile: any = null;
      if (user) {
        const { data: merchant } = await supabase
          .from("merchants").select("id").eq("user_id", user.id).maybeSingle();
        if (merchant?.id) {
          // case-insensitive provider match
          const { data: rows } = await supabase
            .from("processor_fee_profiles")
            .select("*")
            .eq("merchant_id", merchant.id)
            .ilike("provider", provider)
            .eq("currency", currency.toUpperCase())
            .limit(1);
          profile = rows?.[0] ?? null;
          if (!profile) {
            // fallback: any profile for this provider regardless of currency
            const { data: fallback } = await supabase
              .from("processor_fee_profiles")
              .select("*")
              .eq("merchant_id", merchant.id)
              .ilike("provider", provider)
              .limit(1);
            profile = fallback?.[0] ?? null;
          }
        }
      }
      const amt = Number(amount) || 0;
      const pct = Number(profile?.percentage_fee ?? 0);
      const fix = Number(profile?.fixed_fee ?? 0);
      const percentageAmount = +(amt * (pct / 100)).toFixed(2);
      const fixedAmount = +fix.toFixed(2);
      const totalFee = +(percentageAmount + fixedAmount).toFixed(2);
      return {
        profile,
        amount: amt,
        percentageAmount,
        fixedAmount,
        totalFee,
        net: +(amt - totalFee).toFixed(2),
        matched: !!profile,
      };
    },
  });
}
