import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";

const LOCAL_SUPABASE_URL = "https://schxpniiwnxzscbcnynt.supabase.co";
const LOCAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaHhwbmlpd254enNjYmNueW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjkzMjYsImV4cCI6MjA5MTI0NTMyNn0.AuNS8fpvPVZDazKkP9lpD4ddfW0CUt-jB012lNrrnlI";
const localSupabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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
    retry: 1,
    staleTime: 15_000,
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const { data, error } = await localSupabase.functions.invoke("fee-preview", {
        body: { provider, currency, amount },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw new Error(error.message || "Fee preview failed");
      if (data?.error) throw new Error(data.error);
      return data as FeePreview;
    },
  });
}
