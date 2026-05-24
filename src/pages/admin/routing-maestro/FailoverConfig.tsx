import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useProcessors,
  useFailoverConfigs,
  useSaveFailoverConfig,
  useActivateFailoverConfig,
  useRollbackFailoverConfig,
  useRoutingAuditLog,
} from "@/hooks/useRoutingMaestro";
import { Save, RotateCcw, Power, History } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Draft = {
  processor: string;
  processorName: string;
  id?: string;
  max_retries: number;
  retry_delay_ms: number;
  backoff: string;
  active: boolean;
  version?: number;
  dirty: boolean;
};

export default function FailoverConfig() {
  const { data: processors = [], isLoading: procLoading } = useProcessors();
  const { data: configs = [], isLoading: cfgLoading } = useFailoverConfigs(null);
  const { data: audit = [] } = useRoutingAuditLog({ limit: 30 });

  const save = useSaveFailoverConfig();
  const activate = useActivateFailoverConfig();
  const rollback = useRollbackFailoverConfig();

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  useEffect(() => {
    if (!processors.length) return;
    const next: Record<string, Draft> = {};
    processors.forEach((p) => {
      const existing = configs.find((c) => c.processor === p.id);
      next[p.id] = {
        processor: p.id,
        processorName: p.name,
        id: existing?.id,
        max_retries: existing?.max_retries ?? 3,
        retry_delay_ms: existing?.retry_delay_ms ?? 1000,
        backoff: existing?.backoff ?? "exponential",
        active: existing?.active ?? true,
        version: existing?.version,
        dirty: false,
      };
    });
    setDrafts(next);
  }, [processors, configs]);

  const update = (id: string, patch: Partial<Draft>) =>
    setDrafts((p) => ({ ...p, [id]: { ...p[id], ...patch, dirty: true } }));

  const dirtyCount = useMemo(() => Object.values(drafts).filter((d) => d.dirty).length, [drafts]);

  const saveOne = async (d: Draft) => {
    await save.mutateAsync({
      processor: d.processor,
      max_retries: d.max_retries,
      retry_delay_ms: d.retry_delay_ms,
      backoff: d.backoff,
      active: d.active,
    } as any);
    toast.success(`Saved ${d.processorName}`);
  };

  const saveAll = async () => {
    const dirty = Object.values(drafts).filter((d) => d.dirty);
    if (!dirty.length) return toast.info("No changes to save");
    try {
      await Promise.all(dirty.map(saveOne));
      toast.success(`Saved ${dirty.length} configurations`);
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    }
  };

  const onActivate = async (d: Draft) => {
    if (!d.id) {
      await saveOne(d);
      return;
    }
    try {
      await activate.mutateAsync({ id: d.id, active: !d.active });
      toast.success(`${d.active ? "Deactivated" : "Activated"} ${d.processorName}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Activation failed");
    }
  };

  const onRollback = async (d: Draft) => {
    if (!d.id) return toast.error("No previous version to roll back to");
    try {
      await rollback.mutateAsync({ id: d.id });
      toast.success(`Rolled back ${d.processorName}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Rollback failed");
    }
  };

  const isLoading = procLoading || cfgLoading;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Failover & Retry</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Persistent per-processor retry policy with audit trail and one-click rollback.
            </p>
          </div>
          <div className="flex gap-2">
            {dirtyCount > 0 && <Badge variant="secondary">{dirtyCount} unsaved</Badge>}
            <Button onClick={saveAll} disabled={save.isPending || !dirtyCount}>
              <Save className="h-4 w-4 mr-2" />Save All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground mb-4">Per-Processor Retry Configuration</h3>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
            ) : (
              <div className="space-y-3">
                {Object.values(drafts).map((d) => (
                  <div key={d.processor} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{d.processorName}</span>
                        {d.version && <Badge variant="outline" className="text-[10px]">v{d.version}</Badge>}
                        {d.dirty && <Badge variant="secondary" className="text-[10px]">unsaved</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => onRollback(d)} disabled={!d.id || rollback.isPending}>
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />Rollback
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onActivate(d)} disabled={activate.isPending}>
                          <Power className="h-3.5 w-3.5 mr-1" />{d.active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button size="sm" onClick={() => saveOne(d)} disabled={save.isPending || !d.dirty}>
                          <Save className="h-3.5 w-3.5 mr-1" />Save
                        </Button>
                        <Switch checked={d.active} onCheckedChange={(v) => update(d.processor, { active: v })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap w-16">Retries:</span>
                        <Slider value={[d.max_retries]} onValueChange={([v]) => update(d.processor, { max_retries: v })} max={5} min={0} step={1} className="flex-1" disabled={!d.active} />
                        <span className="text-xs font-mono text-foreground w-4">{d.max_retries}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap w-16">Delay:</span>
                        <Slider value={[d.retry_delay_ms]} onValueChange={([v]) => update(d.processor, { retry_delay_ms: v })} max={5000} min={100} step={100} className="flex-1" disabled={!d.active} />
                        <span className="text-xs font-mono text-foreground w-16">{d.retry_delay_ms}ms</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Activity Log</h3>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {audit.length === 0 ? (
                <p className="text-xs text-muted-foreground">No changes recorded yet.</p>
              ) : (
                audit.map((a) => (
                  <div key={a.id} className="border-l-2 border-primary/40 pl-3 py-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase">{a.action}</Badge>
                      <span className="text-xs text-muted-foreground">{a.entity_type}</span>
                    </div>
                    <p className="text-xs text-foreground mt-1">
                      {a.after?.processor ?? a.before?.processor ?? a.entity_id ?? "—"}
                      {a.metadata?.rolled_back_to_version && ` → v${a.metadata.rolled_back_to_version}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
