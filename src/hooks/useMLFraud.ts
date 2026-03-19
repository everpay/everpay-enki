import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { FraudFeatures, BINResult } from '@/lib/everpay-api';

export interface MLPrediction {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  action: 'allow' | 'review' | 'block';
  features: {
    amount_normalized: number;
    country_mismatch: number;
    attempt_velocity: number;
    proxy_detected: number;
    time_anomaly: number;
    bin_risk: number;
  };
}

export function useMLFraud() {
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<MLPrediction | null>(null);

  const predictRisk = async (features: FraudFeatures): Promise<MLPrediction | null> => {
    setIsPredicting(true);
    try {
      const { data, error } = await supabase.functions.invoke('ml-fraud-predict', {
        body: features,
      });
      if (error) throw error;
      const result = data?.prediction as MLPrediction;
      setPrediction(result);
      return result;
    } catch (error) {
      console.error('ML prediction error:', error);
      return null;
    } finally {
      setIsPredicting(false);
    }
  };

  const lookupBIN = async (bin: string): Promise<BINResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('bin-lookup', {
        body: { bin },
      });
      if (error) throw error;
      return data as BINResult;
    } catch (error) {
      console.error('BIN lookup error:', error);
      return null;
    }
  };

  const triggerRetrain = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ml-retrain');
      if (error) throw error;
      return data?.retrain_result;
    } catch (error) {
      console.error('Retrain error:', error);
      return null;
    }
  };

  return { isPredicting, prediction, predictRisk, lookupBIN, triggerRetrain };
}
