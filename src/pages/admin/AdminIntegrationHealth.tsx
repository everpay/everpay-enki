import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { supabase } from "@/integrations/supabase/client";

interface ProbeResult {
  id: string; label: string; status: "healthy" | "degraded" | "down";
  http_status: number | null; latency_ms: number; message: string;
}
interface SystemStatus { checked_at: string; overall: "healthy" | "degraded" | "down"; services: ProbeResult[]; }

function statusVisual(status: ProbeResult["status"]) {
  if (status === "healthy") return { icon: CheckCircle2, color: "text-emerald-500", variant: "default" as const, label: "Healthy" };
  if (status === "degraded") return { icon: AlertTriangle, color: "text-amber-500", variant: "secondary" as const, label: "Degraded" };
  return { icon: XCircle, color: "text-destructive", variant: "destructive" as const, label: "Down" };
}

export default function AdminIntegrationHealth() {
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useAccessControl();

  const { data, isLoading, isFetching, refetch } = useQuery<SystemStatus>({
    queryKey: ["admin-system-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("system-status");
      if (error) throw error;
      return data as SystemStatus;
    },
    refetchInterval: 30_000,
    retry: false,
  });

  if (roleLoading) return <AppLayout><div className="p-6">Loading…</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  const overall = data?.overall;
  const overallVisual = overall ? statusVisual(overall) : statusVisual("healthy");

  return (
    <AppLayout>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integration Health</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live probes for ShieldHub, Matrix, Mondo, Plaid, Unit, KYCAID, Circle, and routing.</p>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Checked {new Date(data.checked_at).toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6 flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-muted ${overallVisual.color}`}><Activity className="h-6 w-6" /></div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Overall status</p>
            <p className="text-xl font-semibold capitalize">{overall ?? (isLoading ? "Checking…" : "Unknown")}</p>
          </div>
          <Badge variant={overallVisual.variant} className="capitalize">{overallVisual.label}</Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(data?.services || []).map((svc) => {
          const v = statusVisual(svc.status);
          const Icon = v.icon;
          return (
            <Card key={svc.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2"><Icon className={`h-4 w-4 ${v.color}`} />{svc.label}</CardTitle>
                    <CardDescription className="mt-1">{svc.message}</CardDescription>
                  </div>
                  <Badge variant={v.variant}>{v.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">HTTP</span><span className="font-mono">{svc.http_status ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Latency</span><span className="font-mono">{svc.latency_ms}ms</span></div>
              </CardContent>
            </Card>
          );
        })}
        {isLoading && (<Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Probing endpoints…</CardContent></Card>)}
        {!isLoading && (data?.services || []).length === 0 && (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No probe results — system-status function may not be deployed.</CardContent></Card>
        )}
      </div>
    </AppLayout>
  );
}