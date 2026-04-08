import { AppLayout } from '@/components/AppLayout';
import { RateLimitGauge } from '@/components/RateLimitGauge';
import { useRateLimits } from '@/hooks/useRateLimits';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { useAccounts } from '@/hooks/useAccounts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gauge, Shield } from 'lucide-react';

const RateLimits = () => {
  const { data: accounts = [] } = useAccounts();
  const merchantId = accounts[0]?.merchant_id;
  const { data: limits = [], isLoading } = useRateLimits(merchantId);
  const { data: riskProfile } = useRiskProfile(merchantId);

  const multiplier = riskProfile?.adaptive_multiplier ?? 1;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">API Rate Limits</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your current rate limits and usage across all API endpoints.
        </p>
      </div>

      {/* Adaptive Multiplier Banner */}
      {riskProfile && (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-4 py-4">
            <Shield className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Adaptive Rate Limiting</p>
              <p className="text-xs text-muted-foreground">
                Your limits are dynamically adjusted based on your risk profile.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Multiplier:</span>
              <Badge variant={multiplier >= 1 ? 'default' : 'destructive'}>
                ×{multiplier.toFixed(3)}
              </Badge>
              {riskProfile.locked && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">Locked</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : limits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gauge className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No rate limit data available yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Default limits of 120 rpm apply to all endpoints.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {limits.map((limit) => (
            <RateLimitGauge
              key={limit.endpoint_type}
              label={limit.endpoint_type}
              current={0}
              limit={limit.requests_per_minute}
              burstLimit={limit.burst_limit}
              multiplier={multiplier}
            />
          ))}
        </div>
      )}

      {/* Rate Limit Details Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Endpoint Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Endpoint</th>
                  <th className="pb-2 font-medium">Base Limit</th>
                  <th className="pb-2 font-medium">Burst</th>
                  <th className="pb-2 font-medium">Multiplier</th>
                  <th className="pb-2 font-medium">Effective Limit</th>
                </tr>
              </thead>
              <tbody>
                {limits.map((limit) => (
                  <tr key={limit.endpoint_type} className="border-b last:border-0">
                    <td className="py-3 capitalize font-medium">{limit.endpoint_type}</td>
                    <td className="py-3">{limit.requests_per_minute} rpm</td>
                    <td className="py-3">{limit.burst_limit}</td>
                    <td className="py-3">×{multiplier.toFixed(3)}</td>
                    <td className="py-3 font-mono">{Math.round(limit.requests_per_minute * multiplier)} rpm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default RateLimits;
