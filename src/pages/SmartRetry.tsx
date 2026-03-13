import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Brain, TrendingUp, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const retryData = [
  { day: 'Mon', withRetry: 96.8, withoutRetry: 92.1 },
  { day: 'Tue', withRetry: 97.1, withoutRetry: 91.8 },
  { day: 'Wed', withRetry: 96.5, withoutRetry: 91.5 },
  { day: 'Thu', withRetry: 97.4, withoutRetry: 92.3 },
  { day: 'Fri', withRetry: 96.9, withoutRetry: 91.9 },
  { day: 'Sat', withRetry: 97.2, withoutRetry: 92.0 },
  { day: 'Sun', withRetry: 96.6, withoutRetry: 91.6 },
];

const retryRules = [
  { name: 'Soft Decline → Alternate Processor', trigger: 'Response code: 05, 51', action: 'Route to next-best acquirer', recovered: '$124K', rate: '68%' },
  { name: 'Timeout → Delayed Retry', trigger: 'No response after 30s', action: 'Retry after 60s with same processor', recovered: '$42K', rate: '45%' },
  { name: 'Insufficient Funds → Scheduled', trigger: 'Response code: 51', action: 'Retry next business day', recovered: '$89K', rate: '34%' },
  { name: 'Card Network Error → Fallback', trigger: 'Network timeout', action: 'Switch to alternate card network', recovered: '$67K', rate: '52%' },
];

export default function SmartRetry() {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Smart Retry AI</h1>
        <p className="mt-1 text-sm text-muted-foreground">AI-powered payment retry optimization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Revenue Recovered" value="$322K" change="This month" icon={TrendingUp} />
        <StatCard title="Retry Success Rate" value="52.3%" change="+4.1%" icon={RefreshCw} />
        <StatCard title="AI Rules Active" value="12" icon={Brain} />
        <StatCard title="Avg. Recovery Time" value="4.2s" icon={Zap} />
      </div>

      {/* Success Rate Comparison */}
      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <h3 className="text-lg font-semibold mb-6">Auth Rate: With vs Without Smart Retry</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={retryData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="day" className="text-muted-foreground" fontSize={12} />
            <YAxis domain={[90, 100]} className="text-muted-foreground" fontSize={12} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(value: number) => [`${value}%`]} />
            <Line type="monotone" dataKey="withRetry" stroke="hsl(var(--primary))" strokeWidth={2.5} name="With Smart Retry" dot={false} />
            <Line type="monotone" dataKey="withoutRetry" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" name="Without" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Active Rules */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-6">Active Retry Rules</h3>
        <div className="space-y-4">
          {retryRules.map((rule) => (
            <div key={rule.name} className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium">{rule.name}</h4>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-500">{rule.recovered} recovered</p>
                  <p className="text-xs text-muted-foreground">{rule.rate} success</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground"><span className="font-medium">Trigger:</span> {rule.trigger}</p>
              <p className="text-sm text-muted-foreground"><span className="font-medium">Action:</span> {rule.action}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
