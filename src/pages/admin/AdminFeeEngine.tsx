import { AppLayout } from "@/components/AppLayout";
import { useStrategyProcessors, useStrategyFeeProfiles, useMarkups, useDeleteMarkup, useStrategyMerchants } from "@/hooks/useProcessorStrategy";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

export default function AdminFeeEngine() {
  const { data: processors = [] } = useStrategyProcessors();
  const { data: feeProfiles = [] } = useStrategyFeeProfiles();
  const { data: markups = [] } = useMarkups();
  const { data: merchants = [] } = useStrategyMerchants();
  const deleteMarkup = useDeleteMarkup();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fee Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage processor fees and platform markups</p>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="p-5 border-b"><h3 className="text-sm font-semibold text-foreground">Processor Fee Profiles</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left p-3 font-medium">Provider</th>
                  <th className="text-right p-3 font-medium">% Fee</th>
                  <th className="text-right p-3 font-medium">Fixed Fee</th>
                  <th className="text-right p-3 font-medium">Chargeback Fee</th>
                  <th className="text-right p-3 font-medium">Refund Fee</th>
                  <th className="text-right p-3 font-medium">Settlement Days</th>
                </tr>
              </thead>
              <tbody>
                {feeProfiles.map((fee: any, i: number) => {
                  const proc = processors.find((p: any) => p.id === fee.provider);
                  return (
                    <motion.tr key={fee.id} className="border-b border-border/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                      <td className="p-3 font-medium text-foreground">
                        <span className="flex items-center gap-2">
                          {proc && <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${proc.tier === "1" ? "bg-primary/10 text-primary" : proc.tier === "2" ? "bg-yellow-500/10 text-yellow-600" : "bg-destructive/10 text-destructive"}`}>{proc.tier}</span>}
                          {proc?.name ?? fee.provider}
                        </span>
                      </td>
                      <td className="text-right p-3 font-mono text-foreground">{Number(fee.percentage_fee)}%</td>
                      <td className="text-right p-3 font-mono text-foreground">${Number(fee.fixed_fee)}</td>
                      <td className="text-right p-3 font-mono text-foreground">${Number(fee.chargeback_fee)}</td>
                      <td className="text-right p-3 font-mono text-foreground">${Number(fee.refund_fee)}</td>
                      <td className="text-right p-3 font-mono text-foreground">{fee.settlement_days}d</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="p-5 border-b">
            <h3 className="text-sm font-semibold text-foreground">Platform Fee Markups</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Everpay margin applied above processor cost</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left p-3 font-medium">Processor</th>
                  <th className="text-left p-3 font-medium">Merchant</th>
                  <th className="text-right p-3 font-medium">Markup %</th>
                  <th className="text-right p-3 font-medium">Flat Fee</th>
                  <th className="text-right p-3 font-medium">Effective</th>
                  <th className="text-center p-3 font-medium">Active</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {markups.map((m: any, i: number) => {
                  const proc = processors.find((p: any) => p.id === m.processor_id);
                  const fee = feeProfiles.find((f: any) => f.provider === m.processor_id);
                  const merchant = m.merchant_id ? merchants.find((me: any) => me.id === m.merchant_id) : null;
                  const effective = Number(fee?.percentage_fee ?? 0) + Number(m.markup_percentage);
                  return (
                    <motion.tr key={m.id} className="border-b border-border/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                      <td className="p-3 font-medium text-foreground">{proc?.name ?? m.processor_id}</td>
                      <td className="p-3">{merchant ? <span className="rounded-md bg-accent px-2 py-0.5 text-accent-foreground text-[11px]">{merchant.name}</span> : <span className="text-muted-foreground">All merchants</span>}</td>
                      <td className="text-right p-3 font-mono text-primary">+{Number(m.markup_percentage)}%</td>
                      <td className="text-right p-3 font-mono text-foreground">${Number(m.markup_flat_fee).toFixed(2)}</td>
                      <td className="text-right p-3 font-mono font-semibold text-foreground">{effective.toFixed(1)}%</td>
                      <td className="text-center p-3"><Switch checked={m.active} disabled /></td>
                      <td className="p-3"><Button variant="ghost" size="icon" onClick={() => deleteMarkup.mutate(m.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></td>
                    </motion.tr>
                  );
                })}
                {markups.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No markups configured. Seed data from the Overview page.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
