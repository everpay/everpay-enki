// Anomaly Detection using Statistical Methods (Z-Score)
import { Transaction } from './riskScore';

export interface AnomalyResult {
  isAnomaly: boolean;
  zScore: number;
  threshold: number;
  reason?: string;
}

/**
 * Calculate Z-Score for anomaly detection
 * Z-Score = (value - mean) / standardDeviation
 */
export function calculateZScore(value: number, values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  return (value - mean) / stdDev;
}

/**
 * Detect anomalies in transaction patterns
 */
export function detectAnomalies(
  transaction: Transaction,
  userHistory: Transaction[],
  threshold: number = 2.5
): AnomalyResult {
  if (userHistory.length < 5) {
    return {
      isAnomaly: false,
      zScore: 0,
      threshold,
      reason: 'Insufficient transaction history for anomaly detection'
    };
  }

  const historicalAmounts = userHistory.map(t => t.amount);
  const zScore = calculateZScore(transaction.amount, historicalAmounts);
  const isAnomaly = Math.abs(zScore) > threshold;

  let reason: string | undefined;
  if (isAnomaly) {
    if (zScore > threshold) {
      reason = `Transaction amount significantly higher than user's typical pattern (Z-Score: ${zScore.toFixed(2)})`;
    } else {
      reason = `Transaction amount significantly lower than user's typical pattern (Z-Score: ${zScore.toFixed(2)})`;
    }
  }

  return { isAnomaly, zScore, threshold, reason };
}

/**
 * Detect unusual time patterns
 */
export function detectTimeAnomaly(
  transaction: Transaction,
  userHistory: Transaction[]
): { isAnomaly: boolean; reason?: string } {
  if (userHistory.length < 10) {
    return { isAnomaly: false };
  }

  const txHour = new Date(transaction.timestamp).getHours();
  const historicalHours = userHistory.map(t => new Date(t.timestamp).getHours());
  const hourCounts: { [hour: number]: number } = {};
  
  historicalHours.forEach(hour => {
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const currentHourCount = hourCounts[txHour] || 0;
  const maxHourCount = Math.max(...Object.values(hourCounts));

  if (currentHourCount === 0 || currentHourCount < maxHourCount * 0.1) {
    return {
      isAnomaly: true,
      reason: `Unusual transaction time: ${txHour}:00 (not typical for this user)`
    };
  }

  return { isAnomaly: false };
}

/**
 * Detect velocity anomalies (too many transactions too quickly)
 */
export function detectVelocityAnomaly(
  userHistory: Transaction[],
  windowMinutes: number = 60,
  maxTransactions: number = 10
): { isAnomaly: boolean; count: number; reason?: string } {
  const now = new Date();
  const recentTransactions = userHistory.filter(t => {
    const txDate = new Date(t.timestamp);
    const minutesDiff = (now.getTime() - txDate.getTime()) / (1000 * 60);
    return minutesDiff <= windowMinutes;
  });

  const isAnomaly = recentTransactions.length > maxTransactions;
  
  return {
    isAnomaly,
    count: recentTransactions.length,
    reason: isAnomaly 
      ? `Unusual transaction velocity: ${recentTransactions.length} transactions in ${windowMinutes} minutes`
      : undefined
  };
}
