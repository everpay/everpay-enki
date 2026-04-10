// Transaction Pattern Matching for AML Detection
import { Transaction } from './riskScore';

export interface StructuringResult {
  isStructuring: boolean;
  totalAmount: number;
  transactionCount: number;
  timeWindow: string;
  reason?: string;
}

/**
 * Detect structuring (smurfing) - breaking large amounts into smaller transactions
 * to avoid reporting thresholds
 */
export function detectStructuring(
  userHistory: Transaction[],
  threshold: number = 10000,
  windowHours: number = 24,
  minTransactions: number = 3
): StructuringResult {
  const now = new Date();
  
  const recentTransactions = userHistory.filter(t => {
    const txDate = new Date(t.timestamp);
    const hoursDiff = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= windowHours;
  });

  const totalAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const transactionCount = recentTransactions.length;

  const isStructuring = 
    transactionCount >= minTransactions &&
    totalAmount >= threshold &&
    recentTransactions.every(t => t.amount < threshold * 0.8);

  const result: StructuringResult = {
    isStructuring,
    totalAmount,
    transactionCount,
    timeWindow: `${windowHours}h`
  };

  if (isStructuring) {
    result.reason = `Potential structuring: ${transactionCount} transactions totaling $${totalAmount.toLocaleString()} in ${windowHours}h, each below reporting threshold`;
  }

  return result;
}

/**
 * Detect layering patterns - complex transaction chains to obscure money origin
 */
export function detectLayering(
  userHistory: Transaction[],
  windowHours: number = 48
): { isLayering: boolean; pattern?: string } {
  const now = new Date();
  
  const recentTransactions = userHistory.filter(t => {
    const txDate = new Date(t.timestamp);
    const hoursDiff = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= windowHours;
  });

  if (recentTransactions.length < 5) {
    return { isLayering: false };
  }

  let rapidReverseCount = 0;
  for (let i = 1; i < recentTransactions.length; i++) {
    const current = recentTransactions[i];
    const previous = recentTransactions[i - 1];
    
    if (Math.abs(current.amount - previous.amount) < previous.amount * 0.1) {
      rapidReverseCount++;
    }
  }

  const isLayering = rapidReverseCount >= 3;

  return {
    isLayering,
    pattern: isLayering 
      ? `Detected ${rapidReverseCount} similar-amount transactions suggesting layering activity`
      : undefined
  };
}

/**
 * Detect round amount patterns - often indicative of money laundering
 */
export function detectRoundAmountPattern(
  userHistory: Transaction[],
  threshold: number = 0.7
): { isSuspicious: boolean; roundCount: number; percentage: number } {
  if (userHistory.length < 5) {
    return { isSuspicious: false, roundCount: 0, percentage: 0 };
  }

  const roundAmounts = userHistory.filter(t => {
    return t.amount % 100 === 0 || t.amount % 1000 === 0;
  });

  const percentage = roundAmounts.length / userHistory.length;
  const isSuspicious = percentage > threshold;

  return { isSuspicious, roundCount: roundAmounts.length, percentage };
}

/**
 * Detect geographic anomalies - transactions from unusual locations
 */
export function detectGeographicAnomaly(
  transaction: Transaction,
  userHistory: Transaction[]
): { isAnomaly: boolean; reason?: string } {
  const historicalLocations = userHistory
    .filter(t => t.location)
    .map(t => t.location);

  if (historicalLocations.length === 0) {
    return { isAnomaly: false };
  }

  const locationCounts: { [location: string]: number } = {};
  historicalLocations.forEach(loc => {
    if (loc) locationCounts[loc] = (locationCounts[loc] || 0) + 1;
  });

  const currentLocation = transaction.location;
  if (!currentLocation) {
    return { isAnomaly: false };
  }

  const locationCount = locationCounts[currentLocation] || 0;
  const totalTransactions = historicalLocations.length;

  const isAnomaly = locationCount === 0 || (locationCount / totalTransactions) < 0.05;

  return {
    isAnomaly,
    reason: isAnomaly 
      ? `Transaction from unusual location: ${currentLocation} (${locationCount} previous transactions)`
      : undefined
  };
}

/**
 * Comprehensive pattern analysis
 */
export function analyzeTransactionPatterns(
  transaction: Transaction,
  userHistory: Transaction[]
) {
  return {
    structuring: detectStructuring(userHistory),
    layering: detectLayering(userHistory),
    roundAmounts: detectRoundAmountPattern(userHistory),
    geographic: detectGeographicAnomaly(transaction, userHistory)
  };
}
