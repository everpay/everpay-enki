import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RiskProfile {
  id: string;
  merchant_id: string;
  risk_score: number;
  adaptive_multiplier: number;
  success_rate: number;
  chargeback_rate: number;
  fraud_score: number;
  velocity_score: number;
  locked: boolean;
}

export function useRiskProfile(merchantId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['risk-profile', merchantId],
    enabled: !!user && !!merchantId,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_risk_profiles')
        .select('*')
        .eq('merchant_id', merchantId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return data as unknown as RiskProfile;
    },
  });
}

export function useRiskSignals(merchantId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['risk-signals', merchantId],
    enabled: !!user && !!merchantId,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_risk_signals')
        .select('*')
        .eq('merchant_id', merchantId!)
        .order('recorded_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        merchant_id: string;
        signal_type: string;
        value: number;
        recorded_at: string;
      }>;
    },
  });
}
