import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  useRoutingRules,
  useToggleRule,
  useDeleteRule,
  useCreateRule,
  useProcessors,
  useRoutingMerchants,
} from "@/hooks/useRoutingMaestro";
import type { RoutingRuleRow } from "@/lib/routing-maestro/types";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

export default function RulesEngine() {
  const { data: rules = [], isLoading } = useRoutingRules();
  const { data: processors = [] } = useProcessors();
  const { data: merchants = [] } = useRoutingMerchants();
  const toggle = useToggleRule();
  const del = useDeleteRule();
  const create = useCreateRule();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    priority: 10,
    target_provider: "",
    fallback_provider: "",
    currency: "",
    amount_min: "",
    amount_max: "",
    merchant_id: "",
  });

  const conditionLabel = (c: RoutingRuleRow["conditions"][number]) => `${c.field} ${c.operator} ${c.value}`;

  const handleCreate = async () => {
    if (!form.name || !form.target_provider || !form.merchant_id) {
      toast.error("Name, target processor, and merchant are required");
      return;
    }
    try {
      await create.mutateAsync({
        name: form.name,
        priority: Number(form.priority) || 10,
        target_provider: form.target_provider,
        fallback_provider: form.fallback_provider || undefined,
        currency_match: form.currency ? form.currency.split(",").map((s) => s.trim().toUpperCase()) : [],
        amount_min: form.amount_min ? Number(form.amount_min) : null,
        amount_max: form.amount_max ? Number(form.amount_max) : null,
        merchant_id: form.merchant_id,
      });
      toast.success("Rule created");
      setDialogOpen(false);
      setForm({ name: "", priority: 10, target_provider: "", fallback_provider: "", currency: "", amount_min: "", amount_max: "", merchant_id: "" });
    } catch (e: any) {
      toast.error(`Create failed: ${e.message}`);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Global Rule Engine</h1>
            <p className="text-sm text-muted-foreground mt-1">Create routing rules that match currency, amount, and target processor</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Rule</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Create Routing Rule</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Rule Name</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., EUR via Mondo" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Merchant</label>
                  <Select value={form.merchant_id} onValueChange={(v) => setForm({ ...form, merchant_id: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select merchant" /></SelectTrigger>
                    <SelectContent>
                      {merchants.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Target Processor</label>
                    <Select value={form.target_provider} onValueChange={(v) => setForm({ ...form, target_provider: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {processors.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Fallback (optional)</label>
                    <Select value={form.fallback_provider} onValueChange={(v) => setForm({ ...form, fallback_provider: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        {processors.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Currency</label>
                    <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="USD,EUR" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Min Amount</label>
                    <Input type="number" value={form.amount_min} onChange={(e) => setForm({ ...form, amount_min: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Max Amount</label>
                    <Input type="number" value={form.amount_max} onChange={(e) => setForm({ ...form, amount_max: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Priority</label>
                  <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="mt-1" />
                </div>
                <Button onClick={handleCreate} disabled={create.isPending} className="w-full">
                  {create.isPending ? "Creating…" : "Create Rule"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="border-b px-5 py-3">
            <p className="text-xs font-medium text-muted-foreground">Rules execute in priority order (lower number first). First match wins.</p>
          </div>
          <div className="divide-y">
            {isLoading ? (
              <div className="p-5 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
            ) : rules.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">No routing rules yet. Add your first rule above.</p>
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary font-mono">
                    {rule.priority}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{rule.name}</span>
                      <Badge variant="outline" className="text-xs">{rule.scope}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {rule.conditions.length === 0 ? (
                        <span className="text-xs text-muted-foreground">any transaction</span>
                      ) : (
                        rule.conditions.map((c, i) => (
                          <span key={i} className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {conditionLabel(c)}
                          </span>
                        ))
                      )}
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-xs font-medium text-primary">Route to {rule.actionTarget}</span>
                    </div>
                  </div>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(v) => toggle.mutate({ id: rule.id, enabled: v }, { onSuccess: () => toast.success("Rule updated") })}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => del.mutate(rule.id, { onSuccess: () => toast.success("Rule deleted") })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
