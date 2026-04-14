import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Users, DollarSign, Activity, Shield } from 'lucide-react';

interface RiskMetrics {
  totalTransactions: number;
  flaggedCount: number;
  highRiskUsers: number;
  totalVolume: number;
  anomalyRate: number;
  avgRiskScore: number;
}

interface RiskDashboardProps {
  metrics: RiskMetrics;
}

const RiskDashboard = ({ metrics }: RiskDashboardProps) => {
  const flaggedPercentage = metrics.totalTransactions > 0
    ? ((metrics.flaggedCount / metrics.totalTransactions) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Monitored transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.flaggedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">{flaggedPercentage}% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Risk Users</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.highRiskUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Requiring review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Transaction volume</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Anomaly Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.anomalyRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Statistical anomalies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgRiskScore.toFixed(0)}</div>
            <div className="flex gap-1 mt-1">
              {metrics.avgRiskScore < 30 && <Badge variant="outline" className="text-green-700 border-green-700">Low</Badge>}
              {metrics.avgRiskScore >= 30 && metrics.avgRiskScore < 50 && <Badge variant="outline" className="text-yellow-700 border-yellow-700">Medium</Badge>}
              {metrics.avgRiskScore >= 50 && <Badge variant="outline" className="text-red-700 border-red-700">High</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RiskDashboard;
