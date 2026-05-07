import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, RefreshCw, CheckCircle2, AlertTriangle, AlertOctagon, Info } from "lucide-react";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { externalProxy } from "@/hooks/useExternalData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Severity = "info" | "warn" | "critical" | "all";
type Category =
  | "all"
  | "payment_failure"
  | "vgs_validation"
  | "webhook_signature"
  | "auth"
  | "rate_limit"
  | "other";

interface AlertRow {
  id: string;
  severity: "info" | "warn" | "critical";
  category: string;
  source: string;
  message: string;
  details: any;
  merchant_id: string | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

function sevVisual(s: AlertRow["severity"]) {
  if (s === "critical") return { Icon: AlertOctagon, color: "text-destructive", variant: "destructive" as const };
  if (s === "warn") return { Icon: AlertTriangle, color: "text-amber-500", variant: "secondary" as const };
  return { Icon: Info, color: "text-muted-foreground", variant: "outline" as const };
}

export default function AdminSecurityAlerts() {
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useAccessControl();
  const qc = useQueryClient();
  const [severity, setSeverity] = useState<Severity>("all");
  const [category, setCategory] = useState<Category>("all");
  const [view, setView] = useState<"open" | "resolved" | "all">("open");

  const { data, isLoading, isFetching, refetch } = useQuery<{ rows: AlertRow[]; counts: Record<string, number> }>({
    queryKey: ["security-alerts", severity, category, view],
    queryFn: async () => {
      const filters: Record<string, any> = {};
      if (severity !== "all") filters.severity = severity;
      if (category !== "all") filters.category = category;
      if (view === "open") filters.resolved = false;
      if (view === "resolved") filters.resolved = true;
      const res = await externalProxy({
        action: "select",
        table: "security_alerts",
        filters,
        order: { column: "created_at", ascending: false },
        limit: 200,
      });
      const rows: AlertRow[] = res.data || [];
      const counts = rows.reduce(
        (acc, r) => {
          acc[r.severity] = (acc[r.severity] || 0) + 1;
          return acc;
        },
        { critical: 0, warn: 0, info: 0 } as Record<string, number>,
      );
      return { rows, counts };
    },
    refetchInterval: 30_000,
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id ?? null;
      await externalProxy({
        action: "update",
        table: "security_alerts",
        id,
        data: { resolved: true, resolved_at: new Date().toISOString(), resolved_by: uid },
      });
    },
    onSuccess: () => {
      toast({ title: "Alert resolved" });
      qc.invalidateQueries({ queryKey: ["security-alerts"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  if (roleLoading) return <AppLayout><div className="p-6">Loading…</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  const rows = data?.rows ?? [];

  return (
    <AppLayout>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-destructive" /> Security Alerts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Runtime monitoring for VGS validation rejections, webhook signature failures, and payment errors. Critical alerts also email super_admins.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="pt-6"><div className="text-xs uppercase text-muted-foreground">Critical</div><div className="text-3xl font-bold text-destructive">{data?.counts.critical ?? 0}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs uppercase text-muted-foreground">Warning</div><div className="text-3xl font-bold text-amber-500">{data?.counts.warn ?? 0}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs uppercase text-muted-foreground">Info</div><div className="text-3xl font-bold">{data?.counts.info ?? 0}</div></CardContent></Card>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6 flex flex-wrap gap-3 items-center">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={severity} onValueChange={(v) => setSeverity(v as Severity)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="payment_failure">Payment failure</SelectItem>
              <SelectItem value="vgs_validation">VGS validation</SelectItem>
              <SelectItem value="webhook_signature">Webhook signature</SelectItem>
              <SelectItem value="auth">Auth</SelectItem>
              <SelectItem value="rate_limit">Rate limit</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
          <CardDescription>{rows.length} matching events (latest 200).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <div className="text-sm text-muted-foreground py-6 text-center">Loading…</div>}
          {!isLoading && rows.length === 0 && (
            <div className="text-sm text-muted-foreground py-10 text-center">No alerts for the current filters. 🎉</div>
          )}
          {rows.map((a) => {
            const v = sevVisual(a.severity);
            const Icon = v.Icon;
            return (
              <div key={a.id} className="flex items-start gap-3 border rounded-2xl p-4">
                <Icon className={`h-5 w-5 mt-0.5 ${v.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={v.variant} className="capitalize">{a.severity}</Badge>
                    <Badge variant="outline" className="capitalize">{a.category.replace(/_/g, " ")}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{a.source}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                  <div className="mt-1 font-medium">{a.message}</div>
                  {a.details && Object.keys(a.details).length > 0 && (
                    <pre className="mt-2 text-xs bg-muted/40 rounded p-2 overflow-x-auto">{JSON.stringify(a.details, null, 2)}</pre>
                  )}
                  {a.merchant_id && <div className="mt-1 text-xs text-muted-foreground">Merchant: <code>{a.merchant_id}</code></div>}
                </div>
                {!a.resolved ? (
                  <Button size="sm" variant="outline" onClick={() => resolveMutation.mutate(a.id)} disabled={resolveMutation.isPending}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Resolve
                  </Button>
                ) : (
                  <Badge variant="secondary">Resolved</Badge>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </AppLayout>
  );
}