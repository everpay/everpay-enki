import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/routing-maestro/StatCard";
import { RoutingChain } from "@/components/routing-maestro/RoutingChain";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProcessors,
  useRoutingMerchants,
  useRoutingRules,
  usePerformanceHistory,
  useRecentRoutingDecisions,
} from "@/hooks/useRoutingMaestro";
import { GitBranch, Shield, Activity, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const SERIES_COLORS = [
  "hsl(230, 80%, 56%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 70%, 55%)",
];

export default function RoutingMaestroDashboard() {
  const { data: processors = [], isLoading: pLoading } = useProcessors();
  const { data: merchants = [] } = useRoutingMerchants();
  const { data: rules = [] } = useRoutingRules();
  const { data: history = [] } = usePerformanceHistory();
  const { data: recent = [] } = useRecentRoutingDecisions(6);

  const activeProcessors = processors.filter((p) => p.enabled).length;
  const activeRules = rules.filter((r) => r.enabled).length;
  const avgSuccess = processors.length
    ? (processors.reduce((a, p) => a + p.successRate, 0) / processors.length).toFixed(1)
    : "0.0";

  const seriesKeys = processors.map((p) => p.id);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Routing Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time overview of payment routing orchestration</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Processors" value={`${activeProcessors}`} change={`${processors.length} total configured`} icon={Activity} />
          <StatCard title="Avg Success Rate" value={`${avgSuccess}%`} change="Last 30 days" changeType="positive" icon={TrendingUp} />
          <StatCard title="Active Rules" value={`${activeRules}`} change={`${rules.length} total rules`} icon={Shield} />
          <StatCard title="Merchants" value={`${merchants.length}`} change={`${merchants.filter(m=>m.status==='active').length} active`} icon={GitBranch} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Processor Success Rate Trend</h3>
            <div className="h-64">
              {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  No transaction history yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    {seriesKeys.map((k, i) => (
                      <Line key={k} type="monotone" dataKey={k} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} name={processors[i]?.name || k} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Processor Status</h3>
            <div className="space-y-3">
              {pLoading
                ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 rounded-lg" />)
                : processors.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <span className={`h-2 w-2 rounded-full ${p.enabled ? "bg-success" : "bg-muted-foreground"}`} />
                        <span className="text-sm font-medium text-foreground">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{p.successRate}%</span>
                        <Badge variant={p.enabled ? "default" : "secondary"} className="text-xs">
                          {p.enabled ? "Active" : "Off"}
                        </Badge>
                      </div>
                    </div>
                  ))}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Routing Decisions</h3>
          <div className="space-y-4">
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent transactions.</p>
            ) : (
              recent.map((r) => (
                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-4">
                  <div className="min-w-[180px]">
                    <p className="text-sm font-medium text-foreground">{r.merchant}</p>
                    <p className="text-xs font-mono text-muted-foreground">{r.amount}</p>
                  </div>
                  <RoutingChain steps={r.steps} />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
