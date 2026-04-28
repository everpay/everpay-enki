import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";

export default function AdminRequestTraces() {
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useAccessControl();
  const [search, setSearch] = useState("");
  const [endpointFilter, setEndpointFilter] = useState<string>("all");

  const { data: traces = [], isLoading } = useQuery({
    queryKey: ["admin-api-traces", endpointFilter],
    queryFn: () => {
      const filters: any = {};
      if (endpointFilter !== "all") filters.endpoint = endpointFilter;
      return extSelect("api_request_traces", {
        filters: Object.keys(filters).length ? filters : undefined,
        order: { column: "created_at", ascending: false },
        limit: 200,
      }).catch(() => []);
    },
  });

  if (roleLoading) return <AppLayout><div className="p-6">Loading…</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  const filtered = (traces as any[]).filter((t) =>
    !search ||
    (t.request_id || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.idempotency_key || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" /> Request Traces (All Merchants)
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">End-to-end traces for /api/payments and /api/payouts — request id, idempotency, provider, ledger entries.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by request id or idempotency key…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-[320px] pl-9" />
        </div>
        <Select value={endpointFilter} onValueChange={setEndpointFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All endpoints</SelectItem>
            <SelectItem value="/api/payments">/api/payments</SelectItem>
            <SelectItem value="/api/payouts">/api/payouts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{filtered.length} traces</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>When</TableHead><TableHead>Endpoint</TableHead><TableHead>Provider</TableHead>
              <TableHead>Status</TableHead><TableHead>Duration</TableHead>
              <TableHead>Idempotency</TableHead><TableHead>Request ID</TableHead><TableHead>Ledger</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No traces yet.</TableCell></TableRow>
              ) : filtered.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {t.created_at ? formatDistanceToNow(new Date(t.created_at), { addSuffix: true }) : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{t.endpoint}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize text-xs">{t.provider ?? "—"}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={t.status_code >= 400 ? "destructive" : "default"} className="text-xs">{t.status_code ?? "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{t.duration_ms ?? "—"}ms</TableCell>
                  <TableCell className="font-mono text-xs max-w-[180px] truncate">{t.idempotency_key ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[140px] truncate">{t.request_id}</TableCell>
                  <TableCell className="text-xs">{t.ledger_entry_ids?.length ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}