import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FraudRiskResult {
  total_score: number;
  velocity_score: number;
  device_score: number;
  geo_score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  action: 'allow' | 'review' | 'block';
  factors: string[];
}

interface FraudCheckParams {
  card_bin?: string;
  card_last4?: string;
  customer_email?: string;
  amount: number;
  currency: string;
  device_fingerprint?: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  timezone?: string;
  transaction_id?: string;
}

export function useFraudDetection() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<FraudRiskResult | null>(null);

  const checkFraud = async (params: FraudCheckParams): Promise<FraudRiskResult | null> => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('fraud-detection', {
        body: params,
      });
      if (error) throw error;
      const result = data?.risk as FraudRiskResult;
      setLastResult(result);
      return result;
    } catch (error) {
      console.error('Fraud check error:', error);
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  return { isChecking, lastResult, checkFraud };
}
