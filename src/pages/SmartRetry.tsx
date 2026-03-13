import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Brain, TrendingUp, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/format';

function useSmartRetryData() {
  return useQuery({
    queryKey: ['smart-retry'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('No merchant');

      const [{ data: attempts }, { data: riskRules }, { data: transactions }] = await Promise.all([
        supabase.from('payment_attempts').select('*, transaction:transactions(id, amount, currency, merchant_id)')
          .order('created_at', { ascending: false }).limit(500),
        supabase.from('risk_rules').select('*').or(`merchant_id.eq.${merchant.id},merchant_id.is.null`).eq('active', true),
        supabase.from('transactions').select('id, amount, currency, status, provider, created_at')
          .eq('merchant_id', merchant.id).order('created_at', { ascending: false }).limit(500),
      ]);

      // Identify retried transactions (those with attempt_number > 1)
      const retryAttempts = (attempts || []).filter((a: any) => a.attempt_number > 1);
      const successRetries = retryAttempts.filter((a: any) => a.status === 'success' || a.status === 'completed');

      // Revenue recovered = sum of amounts from successful retries
      const recoveredAmount = successRetries.reduce((sum: number, a: any) => {
        return sum + (Number(a.transaction?.amount) || 0);
      }, 0);

      const retrySuccessRate = retryAttempts.length > 0
        ? ((successRetries.length / retryAttempts.length) * 100).toFixed(1)
        : '0';

      // Avg recovery time (latency of successful retries)
      const avgRecoveryTime = successRetries.length > 0
        ? (successRetries.reduce((s: number, a: any) => s + (a.latency_ms || 0), 0) / successRetries.length / 1000).toFixed(1)
        : '0';

      // Build daily auth rate data (last 7 days)
      const dayMap: Record<string, { total: number; firstAttemptSuccess: number; withRetrySuccess: number }> = {};
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      (attempts || []).forEach((a: any) => {
        const d = new Date(a.created_at);
        const dayLabel = days[d.getDay()];
        if (!dayMap[dayLabel]) dayMap[dayLabel] = { total: 0, firstAttemptSuccess: 0, withRetrySuccess: 0 };
        dayMap[dayLabel].total++;
        const isSuccess = a.status === 'success' || a.status === 'completed';
        if (isSuccess) {
          dayMap[dayLabel].withRetrySuccess++;
          if (a.attempt_number === 1) dayMap[dayLabel].firstAttemptSuccess++;
        }
      });

      const chartData = Object.entries(dayMap).map(([day, stats]) => ({
        day,
        withRetry: stats.total > 0 ? Number(((stats.withRetrySuccess / stats.total) * 100).toFixed(1)) : 0,
        withoutRetry: stats.total > 0 ? Number(((stats.firstAttemptSuccess / stats.total) * 100).toFixed(1)) : 0,
      }));

      // Group retry rules by response code patterns
      const retryRulesSummary = (riskRules || []).map((rule: any) => {
        const condition = rule.condition || {};
        return {
          id: rule.id,
          name: rule.name,
          trigger: condition.response_code || condition.trigger || rule.severity,
          action: rule.action,
          severity: rule.severity,
        };
      });

      return {
        recoveredAmount,
        retrySuccessRate,
        activeRulesCount: (riskRules || []).length,
        avgRecoveryTime,
        chartData,
        retryRules: retryRulesSummary,
        currency: 'USD',
      };
    },
  });
}

export default function SmartRetry() {
  const { data, isLoading } = useSmartRetryData();

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Smart Retry AI</h1>
        <p className="mt-1 text-sm text-muted-foreground">AI-powered payment retry optimization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Revenue Recovered" value={formatCurrency(data?.recoveredAmount || 0, 'USD')} change="This month" icon={TrendingUp} />
        <StatCard title="Retry Success Rate" value={`${data?.retrySuccessRate || 0}%`} icon={RefreshCw} />
        <StatCard title="Active Rules" value={String(data?.activeRulesCount || 0)} icon={Brain} />
        <StatCard title="Avg. Recovery Time" value={`${data?.avgRecoveryTime || 0}s`} icon={Zap} />
      </div>

      {(data?.chartData || []).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 mb-8">
          <h3 className="text-lg font-semibold mb-6">Auth Rate: With vs Without Smart Retry</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" className="text-muted-foreground" fontSize={12} />
              <YAxis domain={[0, 100]} className="text-muted-foreground" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value: number) => [`${value}%`]} />
              <Line type="monotone" dataKey="withRetry" stroke="hsl(var(--primary))" strokeWidth={2.5} name="With Smart Retry" dot={false} />
              <Line type="monotone" dataKey="withoutRetry" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" name="Without" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-6">Active Retry Rules</h3>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading rules...</p>
        ) : (data?.retryRules || []).length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No retry rules configured yet. Add risk rules in your settings to enable smart retry.</p>
        ) : (
          <div className="space-y-4">
            {(data?.retryRules || []).map((rule: any) => (
              <div key={rule.id} className="p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{rule.name}</h4>
                  <Badge variant={rule.severity === 'high' ? 'destructive' : rule.severity === 'medium' ? 'default' : 'secondary'}>
                    {rule.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground"><span className="font-medium">Trigger:</span> {rule.trigger}</p>
                <p className="text-sm text-muted-foreground"><span className="font-medium">Action:</span> {rule.action}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
