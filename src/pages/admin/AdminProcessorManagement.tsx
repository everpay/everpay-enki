import { AppLayout } from "@/components/AppLayout";
import { useStrategyProcessors, useStrategyFeeProfiles, useMarkups, useStrategies, useUpsertProcessor, useDeleteProcessor } from "@/hooks/useProcessorStrategy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { Globe, Zap, AlertTriangle, Trash2 } from "lucide-react";

export default function AdminProcessorManagement() {
  const { data: processors = [] } = useStrategyProcessors();
  const { data: feeProfiles = [] } = useStrategyFeeProfiles();
  const { data: markups = [] } = useMarkups();
  const { data: strategies = [] } = useStrategies();
  const upsertProcessor = useUpsertProcessor();
  const deleteProcessor = useDeleteProcessor();

  const toggleActive = (proc: any) => {
    upsertProcessor.mutate({ ...proc, active: !proc.active });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Processors</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage processor configurations and tiers</p>
        </div>

        <div className="grid gap-4">
          {processors.map((proc: any, i: number) => {
            const fee = feeProfiles.find((f: any) => f.provider === proc.id);
            const markup = markups.find((m: any) => m.processor_id === proc.id && !m.merchant_id);
            const strategy = strategies.find((s: any) => s.processor_id === proc.id);
            const fallbackName = strategy?.fallback_processor_id
              ? processors.find((p: any) => p.id === strategy.fallback_processor_id)?.name
              : null;

            return (
              <motion.div key={proc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-lg border bg-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${proc.tier === "1" ? "bg-primary/10" : proc.tier === "2" ? "bg-yellow-500/10" : "bg-destructive/10"}`}>
                      {proc.tier === "1" ? <Globe className="h-5 w-5 text-primary" /> : proc.tier === "2" ? <Zap className="h-5 w-5 text-yellow-500" /> : <AlertTriangle className="h-5 w-5 text-destructive" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{proc.name}</h3>
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${proc.tier === "1" ? "bg-primary/10 text-primary" : proc.tier === "2" ? "bg-yellow-500/10 text-yellow-600" : "bg-destructive/10 text-destructive"}`}>
                          Tier {proc.tier}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(proc.region || []).join(", ")} · {(proc.currencies || []).join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={proc.active} onCheckedChange={() => toggleActive(proc)} />
                    <Button variant="ghost" size="icon" onClick={() => deleteProcessor.mutate(proc.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Approval Rate</p>
                    <p className="text-lg font-bold font-mono text-foreground">{Number(proc.approval_rate)}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">% Fee</p>
                    <p className="text-lg font-bold font-mono text-foreground">{fee ? Number(fee.percentage_fee) : "—"}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Platform Markup</p>
                    <p className="text-lg font-bold font-mono text-primary">+{markup ? Number(markup.markup_percentage) : 0}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Settlement Days</p>
                    <p className="text-lg font-bold font-mono text-foreground">{fee ? fee.settlement_days : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Fallback</p>
                    <p className="text-sm font-medium text-foreground">{fallbackName ?? "None"}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {processors.length === 0 && (
            <div className="rounded-lg border border-dashed bg-card p-12 text-center">
              <p className="text-muted-foreground text-sm">No processors configured. Seed data from the Overview page.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
