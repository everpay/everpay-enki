import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/routing-maestro/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoutingMetrics, useRoutingRules } from "@/hooks/useRoutingMaestro";
import {
  RoutingFiltersBar,
  DEFAULT_FILTERS,
  periodToRange,
  type RoutingFilters,
} from "@/components/routing-maestro/RoutingFiltersBar";
import { GitBranch, Shield, Activity, TrendingUp, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const SERIES_COLORS = [
  "hsl(230, 80%, 56%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 70%, 55%)",
];

export default function RoutingMaestroDashboard() {
  const [filters, setFilters] = useState<RoutingFilters>(DEFAULT_FILTERS);
  const range = useMemo(() => periodToRange(filters.period), [filters.period]);
  const { data, isLoading, isFetching } = useRoutingMetrics({
    from: range.from,
    to: range.to,
    processors: filters.processors.length ? filters.processors : undefined,
    merchantIds: filters.merchantIds.length ? filters.merchantIds : undefined,
    decisionLimit: 8,
  });
  const { data: rules = [] } = useRoutingRules();
  const qc = useQueryClient();

  const processors = data?.processors ?? [];
  const history = data?.trend ?? [];
  const decisions = data?.decisions ?? [];
  const merchants = data?.merchants ?? [];

  const activeProcessors = processors.filter((p) => p.enabled).length;
  const activeRules = rules.filter((r) => r.enabled).length;
  const avgSuccess = processors.length
    ? (processors.reduce((a, p) => a + p.successRate, 0) / processors.length).toFixed(1)
    : "0.0";

  const seriesKeys: string[] = processors.map((p) => p.id);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Routing Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Live routing orchestration · {filters.period} window</p>
          </div>
          <RoutingFiltersBar
            filters={filters}
            onChange={setFilters}
            onRefresh={() => qc.invalidateQueries({ queryKey: ["rm:metrics"] })}
            loading={isFetching}
            processorOptions={processors.map((p) => ({ id: p.id, label: p.name }))}
            merchantOptions={merchants.map((m) => ({ id: m.id, label: m.name }))}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Processors" value={`${activeProcessors}`} change={`${processors.length} configured`} icon={Activity} />
          <StatCard title="Avg Success Rate" value={`${avgSuccess}%`} change={`${data?.totals.transactions ?? 0} txns`} changeType="positive" icon={TrendingUp} />
          <StatCard title="Active Rules" value={`${activeRules}`} change={`${rules.length} total rules`} icon={Shield} />
          <StatCard title="Merchants" value={`${merchants.length}`} change={`${merchants.filter(m => m.status === 'active').length} active`} icon={GitBranch} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Processor Success Rate Trend</h3>
            <div className="h-64">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-lg" />
              ) : history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  No transactions in selected window
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
                      <Line key={k} type="monotone" dataKey={k} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} name={String(processors[i]?.name ?? k)} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Processor Status</h3>
            <div className="space-y-3">
              {isLoading
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
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
            ) : decisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent transactions in this window.</p>
            ) : (
              decisions.map((r) => {
                const Icon = r.status === "success" ? CheckCircle2 : r.status === "failed" ? XCircle : Clock;
                const color = r.status === "success" ? "text-success" : r.status === "failed" ? "text-destructive" : "text-warning";
                return (
                  <div key={r.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.merchant}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                    <Badge variant="outline" className="text-xs uppercase">{r.provider}</Badge>
                    <span className="text-sm font-mono text-foreground tabular-nums">{r.amount}</span>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
