import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, Shield, Activity } from 'lucide-react';
import { calculateRiskScore, Transaction, RiskScoreResult } from '@/utils/riskScore';
import { detectAnomalies } from '@/utils/anomalyDetection';
import { analyzeTransactionPatterns } from '@/utils/patternMatching';

const AdminTransactionMonitoring = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [flaggedTransactions, setFlaggedTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, flagged: 0, highRisk: 0, anomalies: 0 });

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (txError) throw txError;

      const processedTransactions = await Promise.all(
        (txData || []).filter(tx => tx.merchant_id != null).map(async (tx) => {
          const { data: history } = await supabase
            .from('transactions')
            .select('*')
            .eq('merchant_id', tx.merchant_id)
            .neq('id', tx.id)
            .order('created_at', { ascending: false })
            .limit(50);

          const userHistory: Transaction[] = (history || []).map(h => ({
            id: h.id, user_id: h.merchant_id || '', amount: parseFloat(String(h.amount || 0)),
            currency: h.currency || 'USD', timestamp: h.created_at,
          }));

          const transaction: Transaction = {
            id: tx.id, user_id: tx.merchant_id || '', amount: parseFloat(String(tx.amount || 0)),
            currency: tx.currency || 'USD', timestamp: tx.created_at,
          };

          const riskScore = calculateRiskScore(transaction, userHistory);
          const anomaly = detectAnomalies(transaction, userHistory);
          const patterns = analyzeTransactionPatterns(transaction, userHistory);

          return { ...tx, riskScore, anomaly, patterns, isFlagged: riskScore.score >= 50 || anomaly.isAnomaly };
        })
      );

      setTransactions(processedTransactions);
      const flagged = processedTransactions.filter(tx => tx.isFlagged);
      setFlaggedTransactions(flagged);
      setStats({
        total: processedTransactions.length,
        flagged: flagged.length,
        highRisk: processedTransactions.filter(tx => tx.riskScore.score >= 70).length,
        anomalies: processedTransactions.filter(tx => tx.anomaly.isAnomaly).length,
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeColor = (level: RiskScoreResult['level']) => {
    const colors = { low: 'bg-green-100 text-green-800', medium: 'bg-yellow-100 text-yellow-800', high: 'bg-orange-100 text-orange-800', critical: 'bg-red-100 text-red-800' };
    return colors[level];
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Transaction Monitoring & AML</h1>
          <p className="text-muted-foreground">Real-time compliance and risk assessment</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Transactions</CardTitle><Activity className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Flagged</CardTitle><AlertCircle className="h-4 w-4 text-orange-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{stats.flagged}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">High Risk</CardTitle><Shield className="h-4 w-4 text-red-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{stats.highRisk}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Anomalies</CardTitle><TrendingUp className="h-4 w-4 text-purple-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">{stats.anomalies}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Flagged Transactions</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : flaggedTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No flagged transactions</div>
            ) : (
              <div className="space-y-4">
                {flaggedTransactions.map((tx) => (
                  <div key={tx.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">${parseFloat(String(tx.amount || 0)).toLocaleString()} {(tx.currency || 'USD').toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Merchant: {tx.merchant_id}</p>
                      </div>
                      <Badge className={getRiskBadgeColor(tx.riskScore.level)}>
                        {tx.riskScore.level.toUpperCase()} - Score: {tx.riskScore.score}
                      </Badge>
                    </div>
                    {tx.riskScore.factors.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Risk Factors:</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {tx.riskScore.factors.map((factor: string, idx: number) => <li key={idx}>{factor}</li>)}
                        </ul>
                      </div>
                    )}
                    {tx.anomaly.isAnomaly && (
                      <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded">
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-300">Anomaly Detected:</p>
                        <p className="text-sm text-purple-700 dark:text-purple-400">{tx.anomaly.reason}</p>
                      </div>
                    )}
                    {tx.patterns.structuring.isStructuring && (
                      <div className="bg-red-50 dark:bg-red-950/30 p-2 rounded">
                        <p className="text-sm font-medium text-red-900 dark:text-red-300">Structuring Pattern:</p>
                        <p className="text-sm text-red-700 dark:text-red-400">{tx.patterns.structuring.reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminTransactionMonitoring;
