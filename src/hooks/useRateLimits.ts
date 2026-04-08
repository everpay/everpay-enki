import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useRateLimits(merchantId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['rate-limits', merchantId],
    enabled: !!user && !!merchantId,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_endpoint_rate_limits')
        .select('*')
        .eq('merchant_id', merchantId!);
      if (error) throw error;

      // Build default entries for missing endpoint types
      const endpointTypes = ['payments', 'payouts', 'api'];
      const limitsMap = new Map((data || []).map((r: any) => [r.endpoint_type, r]));

      return endpointTypes.map(ep => {
        const existing = limitsMap.get(ep) as any;
        return {
          endpoint_type: ep,
          requests_per_minute: existing?.requests_per_minute ?? 120,
          burst_limit: existing?.burst_limit ?? 30,
          id: existing?.id ?? null,
          merchant_id: merchantId!,
        };
      });
    },
  });
}
