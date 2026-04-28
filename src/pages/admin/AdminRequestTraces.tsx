import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Activity, ArrowUpDown, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { extSelectPaged } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { TablePagination } from "@/components/TablePagination";
import { TableSkeleton, TableEmpty, TableError } from "@/components/TableStates";
import { JsonDrawer } from "@/components/admin/JsonDrawer";

const SORT_COLUMNS = ["created_at", "endpoint", "provider", "status_code", "duration_ms"] as const;
type SortCol = typeof SORT_COLUMNS[number];

export default function AdminRequestTraces() {
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useAccessControl();
  const [search, setSearch] = useState("");
  const [endpointFilter, setEndpointFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortCol, setSortCol] = useState<SortCol>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [drawer, setDrawer] = useState<any | null>(null);

  const filters: Record<string, any> = {};
  if (endpointFilter !== "all") filters.endpoint = endpointFilter;
  if (search) filters.request_id = { ilike: `%${search}%` };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-api-traces", endpointFilter, search, page, pageSize, sortCol, sortAsc],
    queryFn: () => extSelectPaged("api_request_traces", {
      page, pageSize,
      filters: Object.keys(filters).length ? filters : undefined,
      order: { column: sortCol, ascending: sortAsc },
    }),
  });

  if (roleLoading) return <AppLayout><div className="p-6">Loading…</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  const rows = (data?.data || []) as any[];
  const total = data?.count || 0;

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortAsc((v) => !v);
    else { setSortCol(col); setSortAsc(false); }
    setPage(1);
  };

  const SortHead = ({ col, label }: { col: SortCol; label: string }) => (
    <TableHead>
      <button onClick={() => toggleSort(col)} className="inline-flex items-center gap-1 hover:text-foreground">
        {label} <ArrowUpDown className={`h-3 w-3 ${sortCol === col ? "text-primary" : "text-muted-foreground/60"}`} />
      </button>
    </TableHead>
  );

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> Request Traces (All Merchants)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">End-to-end traces for /api/payments and /api/payouts.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search request id…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-[260px] pl-9"
            />
          </div>
          <Select value={endpointFilter} onValueChange={(v) => { setEndpointFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All endpoints</SelectItem>
              <SelectItem value="/api/payments">/api/payments</SelectItem>
              <SelectItem value="/api/payouts">/api/payouts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <TableSkeleton rows={pageSize} cols={7} />
        ) : isError ? (
          <TableError onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <TableEmpty title="No traces yet" icon={<Activity className="h-5 w-5" />} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHead col="created_at" label="When" />
                    <SortHead col="endpoint" label="Endpoint" />
                    <SortHead col="provider" label="Provider" />
                    <SortHead col="status_code" label="Status" />
                    <SortHead col="duration_ms" label="Duration" />
                    <TableHead>Idempotency</TableHead>
                    <TableHead>Request ID</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((t) => (
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
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDrawer(t)} aria-label="View JSON">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          isLoading={isLoading}
        />
      </div>

      <JsonDrawer
        open={!!drawer}
        onOpenChange={(o) => !o && setDrawer(null)}
        title="Request trace"
        description={drawer?.request_id}
        data={drawer}
      />
    </AppLayout>
  );
}
