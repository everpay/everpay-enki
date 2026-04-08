import { AppLayout } from "@/components/AppLayout";
import { useStrategyProcessors, useStrategies } from "@/hooks/useProcessorStrategy";
import { motion } from "framer-motion";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function buildChain(startId: string, strategies: any[], visited = new Set<string>()): string[] {
  const chain: string[] = [startId];
  let current = startId;
  while (current && !visited.has(current)) {
    visited.add(current);
    const strat = strategies.find((s: any) => s.processor_id === current);
    if (strat?.fallback_processor_id) {
      chain.push(strat.fallback_processor_id);
      current = strat.fallback_processor_id;
    } else break;
  }
  return chain;
}

function RuleRow({ condition, action }: { condition: string; action: string }) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <span className="shrink-0 rounded-md bg-secondary px-2.5 py-1 text-xs font-mono font-medium text-secondary-foreground">{condition}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-foreground">{action}</span>
    </div>
  );
}

export default function AdminRoutingChains() {
  const { data: processors = [] } = useStrategyProcessors();
  const { data: strategies = [] } = useStrategies();

  const primaryStrats = strategies.filter((s: any) => s.routing_priority === 1);
  const chains = primaryStrats.map((s: any) => ({
    startId: s.processor_id,
    chain: buildChain(s.processor_id, strategies),
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Routing Strategy</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure processor fallback chains and routing priority</p>
          </div>
          <Button size="sm"><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Recompute Routes</Button>
        </div>

        {chains.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-12 text-center">
            <p className="text-muted-foreground text-sm">No routing strategies configured yet.</p>
          </div>
        ) : chains.map(({ startId, chain }) => {
          const startProc = processors.find((p: any) => p.id === startId);
          return (
            <div key={startId} className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-semibold mb-1 text-foreground">{startProc?.name} Routing Chain</h3>
              <p className="text-xs text-muted-foreground mb-6">Fallback sequence</p>
              <div className="flex items-center gap-1 flex-wrap">
                {chain.map((id, i) => {
                  const proc = processors.find((p: any) => p.id === id);
                  return (
                    <motion.div key={id} className="flex items-center gap-1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                      {i > 0 && (
                        <div className="flex flex-col items-center mx-2">
                          <span className="text-[9px] text-destructive font-mono mb-0.5">DECLINED</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className={`rounded-lg border p-3 ${i === 0 ? "border-primary bg-primary/5" : "bg-card"}`}>
                        <div className="flex items-center gap-2">
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${proc?.tier === "1" ? "bg-primary/10 text-primary" : proc?.tier === "2" ? "bg-yellow-500/10 text-yellow-600" : "bg-destructive/10 text-destructive"}`}>
                            {proc?.tier}
                          </span>
                          <span className="text-sm font-medium text-foreground">{proc?.name ?? id}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                          Priority #{i + 1} · {proc ? Number(proc.approval_rate) : 0}% approval
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Routing Decision Matrix</h3>
          <div className="grid gap-3">
            <RuleRow condition="Risk Score > 70" action="Route to Tier 3 (ShieldHubPay → Mondo → PacoPay)" />
            <RuleRow condition="Risk Score < 50" action="Prefer Tier 1 (Adyen → Global Payments)" />
            <RuleRow condition="Region = AF" action="Prefer Paygate10, Lipad, Marasoft" />
            <RuleRow condition="Region = LATAM" action="Prefer FacilitaPay → PacoPay" />
            <RuleRow condition="Processor = ShieldHubPay" action="Apply 10% rolling reserve automatically" />
            <RuleRow condition="All attempts declined" action="Emit processor.route.completed (failed)" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Routing Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { event: "processor.route.started", desc: "Emitted when routing engine begins processing" },
              { event: "processor.route.fallback", desc: "Emitted when primary processor declines and fallback is attempted" },
              { event: "processor.route.completed", desc: "Emitted when routing chain completes (success or exhausted)" },
            ].map((e) => (
              <div key={e.event} className="rounded-lg border border-dashed p-4">
                <p className="text-xs font-mono font-semibold text-primary">{e.event}</p>
                <p className="text-xs text-muted-foreground mt-1">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
