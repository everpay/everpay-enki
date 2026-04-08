import { AppLayout } from '@/components/AppLayout';
import { RiskScoreGauge } from '@/components/RiskScoreGauge';
import { useRiskProfile, useRiskSignals } from '@/hooks/useRiskProfile';
import { useAccounts } from '@/hooks/useAccounts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, TrendingUp, TrendingDown, Lock, Activity } from 'lucide-react';

const signalLabels: Record<string, string> = {
  success_rate: 'Success Rate',
  chargeback_rate: 'Chargeback Rate',
  fraud_score: 'Fraud Score',
  velocity_score: 'Velocity Score',
};

const RiskProfile = () => {
  const { data: accounts = [] } = useAccounts();
  const merchantId = accounts[0]?.merchant_id;
  const { data: profile, isLoading } = useRiskProfile(merchantId);
  const { data: signals = [] } = useRiskSignals(merchantId);

  const chartData = signals
    .slice()
    .reverse()
    .reduce((acc: any[], s) => {
      const date = new Date(s.recorded_at).toLocaleDateString();
      const existing = acc.find(a => a.date === date);
      if (existing) {
        existing[s.signal_type] = s.value;
      } else {
        acc.push({ date, [s.signal_type]: s.value });
      }
      return acc;
    }, []);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Risk Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your risk assessment and adaptive rate limiting signals.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !profile ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No risk profile data available yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Your risk profile will be generated after processing transactions.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Score + Multiplier */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="flex items-center justify-center py-8">
              <RiskScoreGauge score={Number(profile.risk_score)} size="lg" />
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Adaptive Multiplier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">
                  ×{Number(profile.adaptive_multiplier).toFixed(3)}
                </div>
                {profile.locked && (
                  <Badge variant="outline" className="mt-2 text-yellow-600 border-yellow-600">
                    <Lock className="h-3 w-3 mr-1" /> Locked by Admin
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  Applied to all rate limits. Higher multiplier = more capacity.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Signal Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Success Rate', value: profile.success_rate, icon: TrendingUp, good: true },
                  { label: 'Chargeback Rate', value: profile.chargeback_rate, icon: TrendingDown, good: false },
                  { label: 'Fraud Score', value: profile.fraud_score, icon: Shield, good: false },
                  { label: 'Velocity Score', value: profile.velocity_score, icon: Activity, good: false },
                ].map(({ label, value, icon: Icon, good }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </span>
                    <span className={`text-sm font-mono ${
                      good ? (Number(value) > 95 ? 'text-green-500' : 'text-yellow-500')
                        : (Number(value) > 5 ? 'text-destructive' : 'text-green-500')
                    }`}>
                      {Number(value).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Signal History Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Signal History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line type="monotone" dataKey="success_rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="chargeback_rate" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="fraud_score" stroke="#eab308" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="velocity_score" stroke="#f97316" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </AppLayout>
  );
};

export default RiskProfile;
