import { AppLayout } from "@/components/AppLayout";
import { useStrategyProcessors, useStrategyFeeProfiles, useMarkups, useDeleteMarkup, useStrategyMerchants, useUpsertFeeProfile, useDeleteFeeProfile } from "@/hooks/useProcessorStrategy";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Plus } from "lucide-react";

function FeeProfileDialog({ merchants }: { merchants: any[] }) {
  const [open, setOpen] = useState(false);
  const upsert = useUpsertFeeProfile();
  const [form, setForm] = useState<any>({
    merchant_id: "",
    provider: "",
    currency: "USD",
    percentage_fee: 2.9,
    fixed_fee: 0.30,
    chargeback_fee: 15,
    refund_fee: 0,
    settlement_days: 2,
  });

  const submit = async () => {
    if (!form.merchant_id || !form.provider) return;
    await upsert.mutateAsync({
      ...form,
      percentage_fee: Number(form.percentage_fee),
      fixed_fee: Number(form.fixed_fee),
      chargeback_fee: Number(form.chargeback_fee),
      refund_fee: Number(form.refund_fee),
      settlement_days: Number(form.settlement_days),
    });
    setOpen(false);
  };

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" />New Fee Profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Processor Fee Profile</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">Merchant</Label>
            <select className="w-full h-12 rounded-xl border border-border/60 bg-muted/30 px-4 text-sm" value={form.merchant_id} onChange={set("merchant_id")}>
              <option value="">Select merchant…</option>
              {merchants.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Provider</Label><Input value={form.provider} onChange={set("provider")} placeholder="Stripe" /></div>
          <div><Label className="text-xs">Currency</Label><Input value={form.currency} onChange={set("currency")} /></div>
          <div><Label className="text-xs">% Fee</Label><Input type="number" step="0.01" value={form.percentage_fee} onChange={set("percentage_fee")} /></div>
          <div><Label className="text-xs">Fixed Fee</Label><Input type="number" step="0.01" value={form.fixed_fee} onChange={set("fixed_fee")} /></div>
          <div><Label className="text-xs">Chargeback Fee</Label><Input type="number" step="0.01" value={form.chargeback_fee} onChange={set("chargeback_fee")} /></div>
          <div><Label className="text-xs">Refund Fee</Label><Input type="number" step="0.01" value={form.refund_fee} onChange={set("refund_fee")} /></div>
          <div><Label className="text-xs">Settlement Days</Label><Input type="number" value={form.settlement_days} onChange={set("settlement_days")} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={upsert.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminFeeEngine() {
  const { data: processors = [] } = useStrategyProcessors();
  const { data: feeProfiles = [] } = useStrategyFeeProfiles();
  const { data: markups = [] } = useMarkups();
  const { data: merchants = [] } = useStrategyMerchants();
  const deleteMarkup = useDeleteMarkup();
  const deleteFee = useDeleteFeeProfile();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fee Engine</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage processor fees and platform markups</p>
          </div>
          <FeeProfileDialog merchants={merchants} />
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
                  <th className="p-3"></th>
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
                          <span className="text-muted-foreground">· {fee.currency}</span>
                        </span>
                      </td>
                      <td className="text-right p-3 font-mono text-foreground">{Number(fee.percentage_fee)}%</td>
                      <td className="text-right p-3 font-mono text-foreground">${Number(fee.fixed_fee)}</td>
                      <td className="text-right p-3 font-mono text-foreground">${Number(fee.chargeback_fee)}</td>
                      <td className="text-right p-3 font-mono text-foreground">${Number(fee.refund_fee)}</td>
                      <td className="text-right p-3 font-mono text-foreground">{fee.settlement_days}d</td>
                      <td className="p-3"><Button variant="ghost" size="icon" onClick={() => deleteFee.mutate(fee.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></td>
                    </motion.tr>
                  );
                })}
                {feeProfiles.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No fee profiles yet. Click "New Fee Profile" to create one.</td></tr>
                )}
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
