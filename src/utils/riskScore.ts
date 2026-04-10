// Risk-Based Scoring Algorithm for AML/Compliance
export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  timestamp: string;
  location?: string;
  status?: string;
}

export interface RiskScoreResult {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
}

const HIGH_RISK_COUNTRIES = ['KP', 'IR', 'SY', 'CU', 'VE'];
const THRESHOLD_LARGE_TRANSACTION = 10000;
const THRESHOLD_FREQUENT_TRANSACTIONS = 10;

export function calculateRiskScore(
  transaction: Transaction,
  userHistory: Transaction[] = []
): RiskScoreResult {
  let score = 0;
  const factors: string[] = [];

  // 1. Transaction Amount Risk (0-30 points)
  if (transaction.amount > THRESHOLD_LARGE_TRANSACTION) {
    score += 30;
    factors.push(`Large transaction: $${transaction.amount.toLocaleString()}`);
  } else if (transaction.amount > 5000) {
    score += 15;
    factors.push(`Medium-sized transaction: $${transaction.amount.toLocaleString()}`);
  }

  // 2. High-Risk Geography (0-25 points)
  if (transaction.location && HIGH_RISK_COUNTRIES.includes(transaction.location)) {
    score += 25;
    factors.push(`High-risk country: ${transaction.location}`);
  }

  // 3. Frequency of Transactions (0-20 points)
  const recentTransactions = userHistory.filter(t => {
    const txDate = new Date(t.timestamp);
    const now = new Date();
    const hoursDiff = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  });

  if (recentTransactions.length > THRESHOLD_FREQUENT_TRANSACTIONS) {
    score += 20;
    factors.push(`High frequency: ${recentTransactions.length} transactions in 24h`);
  } else if (recentTransactions.length > 5) {
    score += 10;
    factors.push(`Moderate frequency: ${recentTransactions.length} transactions in 24h`);
  }

  // 4. Velocity Check - Rapid successive transactions (0-15 points)
  if (userHistory.length >= 3) {
    const last3Transactions = userHistory.slice(-3);
    const totalAmount = last3Transactions.reduce((sum, t) => sum + t.amount, 0);
    
    if (totalAmount > THRESHOLD_LARGE_TRANSACTION) {
      score += 15;
      factors.push(`Structuring pattern detected: $${totalAmount.toLocaleString()} in recent transactions`);
    }
  }

  // 5. New User Risk (0-10 points)
  if (userHistory.length < 3) {
    score += 10;
    factors.push('New user with limited history');
  }

  // Determine risk level
  let level: RiskScoreResult['level'];
  if (score >= 70) {
    level = 'critical';
  } else if (score >= 50) {
    level = 'high';
  } else if (score >= 30) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return { score, level, factors };
}

export function getRiskColor(level: RiskScoreResult['level']): string {
  const colors = {
    low: 'green',
    medium: 'yellow',
    high: 'orange',
    critical: 'red'
  };
  return colors[level];
}

export function shouldFlagTransaction(riskScore: RiskScoreResult): boolean {
  return riskScore.score >= 50;
}
