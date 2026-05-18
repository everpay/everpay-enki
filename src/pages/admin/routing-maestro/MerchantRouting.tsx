import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProcessorPriorityList } from "@/components/routing-maestro/ProcessorPriorityList";
import { useRoutingMerchants, useMerchantProcessors } from "@/hooks/useRoutingMaestro";
import type { MerchantProcessor } from "@/lib/routing-maestro/types";
import { supabase } from "@/integrations/supabase/client";
import { Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function MerchantRouting() {
  const { data: merchants = [], isLoading: mLoading } = useRoutingMerchants();
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("");
  const [overrideEnabled, setOverrideEnabled] = useState<Record<string, boolean>>({});
  const { data: fetchedProcs = [], isLoading: pLoading } = useMerchantProcessors(selectedMerchantId);
  const [processors, setProcessors] = useState<MerchantProcessor[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedMerchantId && merchants.length) setSelectedMerchantId(merchants[0].id);
  }, [merchants, selectedMerchantId]);
  useEffect(() => setProcessors(fetchedProcs), [fetchedProcs]);

  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId);

  const handleSave = async () => {
    if (!selectedMerchantId) return;
    setSaving(true);
    try {
      await supabase.from("psp_routes").delete().eq("merchant_id", selectedMerchantId);
      if (processors.length) {
        const rows = processors.map((p) => ({
          merchant_id: selectedMerchantId,
          processor: p.processorId,
          priority: p.priority,
          active: p.enabled,
        }));
        const { error } = await supabase.from("psp_routes").insert(rows);
        if (error) throw error;
      }
      toast.success(`Routing saved for ${selectedMerchant?.name}`);
    } catch (e: any) {
      toast.error(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Merchant Routing</h1>
            <p className="text-sm text-muted-foreground mt-1">Override and manage per-merchant routing configurations</p>
          </div>
          <Button onClick={handleSave} disabled={saving || !selectedMerchantId}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>

        <Card className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Select Merchant</label>
              {mLoading ? (
                <Skeleton className="h-10 mt-1.5" />
              ) : (
                <Select value={selectedMerchantId} onValueChange={setSelectedMerchantId}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select merchant" /></SelectTrigger>
                  <SelectContent>
                    {merchants.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          {m.name}
                          <Badge variant={m.status === "active" ? "default" : "secondary"} className="text-xs">{m.status}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Shield className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Admin Override Mode</p>
                <p className="text-xs text-muted-foreground">Takes precedence over merchant settings</p>
              </div>
              <Switch
                checked={!!overrideEnabled[selectedMerchantId]}
                onCheckedChange={(checked) => setOverrideEnabled((prev) => ({ ...prev, [selectedMerchantId]: checked }))}
              />
            </div>
          </div>
        </Card>

        {overrideEnabled[selectedMerchantId] && selectedMerchant && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <p className="text-sm text-foreground">
              <span className="font-medium">Admin Override Active</span> — These settings take precedence over merchant-defined routing for <span className="font-medium">{selectedMerchant.name}</span>.
            </p>
          </div>
        )}

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Processor Priority & Weights</h3>
          <p className="text-xs text-muted-foreground mb-4">Drag to reorder priority. Toggle to enable/disable per processor.</p>
          {pLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : processors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No processor routes configured for this merchant.</p>
          ) : (
            <ProcessorPriorityList processors={processors} onUpdate={setProcessors} />
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Routing Summary</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Active Processors</p>
              <p className="text-xl font-semibold text-foreground mt-1">{processors.filter((p) => p.enabled).length}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Total Weight Allocated</p>
              <p className="text-xl font-semibold text-foreground mt-1">{processors.filter((p) => p.enabled).reduce((a, p) => a + p.weight, 0)}%</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Override Status</p>
              <Badge variant={overrideEnabled[selectedMerchantId] ? "default" : "secondary"} className="mt-1">
                {overrideEnabled[selectedMerchantId] ? "Override Active" : "Merchant Control"}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
