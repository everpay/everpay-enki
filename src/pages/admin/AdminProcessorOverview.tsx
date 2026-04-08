import { AppLayout } from "@/components/AppLayout";
import { useStrategyProcessors, useRoutingAttemptLogs, useMarkups, useStrategyFeeProfiles } from "@/hooks/useProcessorStrategy";
import { TrendingUp, TrendingDown, Activity, Shield, DollarSign, Route } from "lucide-react";
import { motion } from "framer-motion";
import { SeedStrategyButton } from "@/components/admin/SeedStrategyButton";

export default function AdminProcessorOverview() {
  const { data: processors = [] } = useStrategyProcessors();
  const { data: routingLogs = [] } = useRoutingAttemptLogs();
  const { data: markups = [] } = useMarkups();
  const { data: feeProfiles = [] } = useStrategyFeeProfiles();

  const activeMarkups = markups.filter((m: any) => m.active && !m.merchant_id);
  const avgMarkup = activeMarkups.length > 0
    ? (activeMarkups.reduce((a: number, m: any) => a + Number(m.markup_percentage), 0) / activeMarkups.length).toFixed(1)
    : "0";

  const stats = [
    { label: "Active Processors", value: processors.filter((p: any) => p.active).length, icon: Shield, change: "+2 this month", up: true },
    { label: "Avg Approval Rate", value: processors.length > 0 ? `${(processors.reduce((a: number, p: any) => a + Number(p.approval_rate), 0) / processors.length).toFixed(1)}%` : "—", icon: TrendingUp, change: "vs last week", up: true },
    { label: "Routing Attempts", value: routingLogs.length, icon: Route, change: "Last 24h", up: true },
    { label: "Fallback Rate", value: routingLogs.length > 0 ? `${((routingLogs.filter((l: any) => l.attempt_order > 1).length / routingLogs.length) * 100).toFixed(0)}%` : "0%", icon: Activity, change: "Needs attention", up: false },
    { label: "Avg Platform Markup", value: `${avgMarkup}%`, icon: DollarSign, change: "Default markups", up: true },
  ];

  const recentLogs = routingLogs.slice(-5).reverse();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Processor Strategy Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor routing performance and processor health</p>
          </div>
          <SeedStrategyButton />
        </div>

        {processors.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-12 text-center">
            <p className="text-muted-foreground">No data yet. Click "Sync from DB" to populate the strategy layer.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {stats.map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                    {stat.up ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                  </div>
                  <p className="text-2xl font-bold font-mono text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{stat.change}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-lg border bg-card p-5">
                <h3 className="text-sm font-semibold mb-4 text-foreground">Processor Tiers</h3>
                <div className="space-y-3">
                  {["1", "2", "3"].map((tier) => {
                    const tierProcessors = processors.filter((p: any) => p.tier === tier);
                    return (
                      <div key={tier} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${tier === "1" ? "bg-primary/10 text-primary" : tier === "2" ? "bg-yellow-500/10 text-yellow-600" : "bg-destructive/10 text-destructive"}`}>
                            Tier {tier}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {tier === "1" ? "Primary Global" : tier === "2" ? "Regional / Local" : "High-Risk / Backup"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-4">
                          {tierProcessors.map((p: any) => (
                            <span key={p.id} className="rounded-md border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">
                              {p.name}<span className="ml-1.5 text-muted-foreground">{Number(p.approval_rate)}%</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border bg-card p-5">
                <h3 className="text-sm font-semibold mb-4 text-foreground">Recent Routing Attempts</h3>
                <div className="space-y-2">
                  {recentLogs.length === 0 && <p className="text-xs text-muted-foreground">No routing logs yet.</p>}
                  {recentLogs.map((log: any) => {
                    const proc = processors.find((p: any) => p.id === log.processor_id);
                    return (
                      <div key={log.id} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${log.status === "success" ? "bg-green-500" : log.status === "declined" ? "bg-destructive" : "bg-yellow-500"}`} />
                          <div>
                            <p className="text-xs font-medium text-foreground">{proc?.name ?? log.processor_id}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{log.transaction_id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono text-foreground">{log.response_time}ms</p>
                          <p className="text-[10px] text-muted-foreground">Attempt #{log.attempt_order}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4 text-foreground">Fee Structure Overview</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 font-medium">Processor</th>
                      <th className="text-right py-2 font-medium">% Fee</th>
                      <th className="text-right py-2 font-medium">Fixed Fee</th>
                      <th className="text-right py-2 font-medium">CB Fee</th>
                      <th className="text-right py-2 font-medium">Markup</th>
                      <th className="text-right py-2 font-medium">Effective</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeProfiles.map((fee: any) => {
                      const proc = processors.find((p: any) => p.id === fee.provider);
                      const markup = markups.find((m: any) => m.processor_id === fee.provider && !m.merchant_id);
                      const effective = Number(fee.percentage_fee ?? 0) + Number(markup?.markup_percentage || 0);
                      return (
                        <tr key={fee.id} className="border-b border-border/50">
                          <td className="py-2.5 font-medium text-foreground">{proc?.name ?? fee.provider}</td>
                          <td className="text-right py-2.5 font-mono text-foreground">{Number(fee.percentage_fee)}%</td>
                          <td className="text-right py-2.5 font-mono text-foreground">${Number(fee.fixed_fee)}</td>
                          <td className="text-right py-2.5 font-mono text-foreground">${Number(fee.chargeback_fee)}</td>
                          <td className="text-right py-2.5 font-mono text-primary">+{Number(markup?.markup_percentage || 0)}%</td>
                          <td className="text-right py-2.5 font-mono font-semibold text-foreground">{effective.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
