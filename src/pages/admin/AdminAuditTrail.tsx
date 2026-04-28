import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import { Download, FileText, Search, Shield, Clock } from "lucide-react";
import { format } from "date-fns";
import { downloadCsv } from "@/lib/csv";

const getActionVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
  const n = action.toLowerCase();
  if (n.includes("delete") || n.includes("deactivate")) return "destructive";
  if (n.includes("create") || n.includes("approve")) return "default";
  if (n.includes("update") || n.includes("edit")) return "secondary";
  return "outline";
};

export default function AdminAuditTrail() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => extSelect("audit_logs", { order: { column: "created_at", ascending: false }, limit: 500 }),
  });

  const actions = useMemo(() => [...new Set((logs as any[]).map((l) => l.action).filter(Boolean))], [logs]);
  const filtered = useMemo(() => {
    return (logs as any[]).filter((log) => {
      const matchesAction = filter === "all" || log.action === filter;
      const text = `${log.action || ""} ${log.entity_type || ""} ${log.user_id || ""} ${log.merchant_id || ""}`.toLowerCase();
      return matchesAction && text.includes(query.toLowerCase());
    });
  }, [logs, filter, query]);

  const exportCsv = () => {
    downloadCsv(
      `audit-trail-${format(new Date(), "yyyy-MM-dd")}.csv`,
      ["Timestamp", "Action", "Entity Type", "Entity ID", "User ID", "Merchant ID", "Metadata"],
      filtered.map((log: any) => [
        log.created_at, log.action, log.entity_type || "", log.entity_id || "",
        log.user_id || "", log.merchant_id || "",
        log.metadata || log.audit_metadata || {},
      ])
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Shield className="h-6 w-6 text-primary" />Audit Trail</h1>
            <p className="text-sm text-muted-foreground mt-1">Platform-wide compliance and admin activity logs</p>
          </div>
          <Button onClick={exportCsv} variant="outline"><Download className="mr-2 h-4 w-4" />Export CSV</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><FileText className="h-5 w-5 text-primary" /><div><p className="text-sm text-muted-foreground">Total Events</p><p className="text-2xl font-bold">{(logs as any[]).length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Shield className="h-5 w-5 text-primary" /><div><p className="text-sm text-muted-foreground">Unique Actions</p><p className="text-2xl font-bold">{actions.length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-5 w-5 text-primary" /><div><p className="text-sm text-muted-foreground">Last Activity</p><p className="text-lg font-semibold">{(logs as any[])[0]?.created_at ? format(new Date((logs as any[])[0].created_at), "MMM dd, HH:mm") : "—"}</p></div></div></CardContent></Card>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search audit events..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="md:w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {actions.map((a: string) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card><CardContent className="p-0"><Table>
          <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>User</TableHead><TableHead>Merchant</TableHead><TableHead>Metadata</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No audit events</TableCell></TableRow>
              : filtered.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm">{log.created_at ? format(new Date(log.created_at), "MMM dd, HH:mm:ss") : "—"}</TableCell>
                  <TableCell><Badge variant={getActionVariant(log.action || "")}>{log.action || "event"}</Badge></TableCell>
                  <TableCell className="text-sm">{log.entity_type || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{log.user_id ? `${log.user_id.slice(0, 8)}...` : "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{log.merchant_id ? `${log.merchant_id.slice(0, 8)}...` : "—"}</TableCell>
                  <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground">{JSON.stringify(log.metadata || log.audit_metadata || {}).slice(0, 90)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table></CardContent></Card>
      </div>
    </AppLayout>
  );
}