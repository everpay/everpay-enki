import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { routingRules, RoutingRule } from "@/lib/routing-maestro/mock-data";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

export default function RoutingMaestroRulesEngine() {
  const [rules, setRules] = useState<RoutingRule[]>(routingRules);
  const [dialogOpen, setDialogOpen] = useState(false);
  const toggleRule = (id: string) => { setRules(p => p.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)); toast.success("Rule updated"); };
  const deleteRule = (id: string) => { setRules(p => p.filter(r => r.id !== id)); toast.success("Rule deleted"); };
  const conditionLabel = (c: { field: string; operator: string; value: string }) => `${c.field} ${c.operator} ${c.value}`;
  const actionLabel = (r: RoutingRule) => r.action === 'block' ? 'Block Transaction' : r.action === 'route_to' ? `Route to ${r.actionTarget}` : r.action === 'fallback' ? `Fallback: ${r.actionTarget}` : r.action;
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Global Rule Engine</h1>
            <p className="text-sm text-muted-foreground mt-1">Create rules that apply across all merchants</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Rule</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Create Routing Rule</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Rule Name</label>
                  <Input placeholder="e.g., High-value to Stripe" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Condition Field</label>
                    <Select>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">Amount</SelectItem>
                        <SelectItem value="currency">Currency</SelectItem>
                        <SelectItem value="country">Country</SelectItem>
                        <SelectItem value="bin_range">BIN Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Operator</label>
                    <Select>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value=">">&gt;</SelectItem>
                        <SelectItem value="<">&lt;</SelectItem>
                        <SelectItem value="=">=</SelectItem>
                        <SelectItem value="in">In</SelectItem>
                        <SelectItem value="range">Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Value</label>
                  <Input placeholder="e.g., 10000 or USD" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Action</label>
                  <Select>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select action" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="route_to">Route to Processor</SelectItem>
                      <SelectItem value="block">Block Transaction</SelectItem>
                      <SelectItem value="fallback">Force Fallback Chain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => { setDialogOpen(false); toast.success("Rule created"); }} className="w-full">Create Rule</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Card className="p-0 overflow-hidden">
          <div className="border-b px-5 py-3">
            <p className="text-xs font-medium text-muted-foreground">Rules execute in priority order (top to bottom). First match wins.</p>
          </div>
          <div className="divide-y">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary font-mono">{rule.priority}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{rule.name}</span>
                    <Badge variant="outline" className="text-xs">{rule.scope}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {rule.conditions.map((c, i) => (
                      <span key={i} className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{conditionLabel(c)}</span>
                    ))}
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className={`text-xs font-medium ${rule.action === 'block' ? 'text-destructive' : 'text-primary'}`}>{actionLabel(rule)}</span>
                  </div>
                </div>
                <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteRule(rule.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
