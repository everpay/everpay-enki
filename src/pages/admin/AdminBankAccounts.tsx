import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, Check, Clock, AlertCircle, Link2, ArrowUpDown, Eye } from "lucide-react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { extSelectPaged } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { TablePagination } from "@/components/TablePagination";
import { TableSkeleton, TableEmpty, TableError } from "@/components/TableStates";
import { JsonDrawer } from "@/components/admin/JsonDrawer";

function statusBadge(status: string | null) {
  switch (status) {
    case "verified": return <Badge variant="default" className="gap-1"><Check className="h-3 w-3" />Verified</Badge>;
    case "pending_verification": return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    case "failed": return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Failed</Badge>;
    default: return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{status || "New"}</Badge>;
  }
}

const SORT_COLUMNS = ["created_at", "bank_name", "country", "currency", "status"] as const;
type SortCol = typeof SORT_COLUMNS[number];

export default function AdminBankAccounts() {
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useAccessControl();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortCol, setSortCol] = useState<SortCol>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [drawer, setDrawer] = useState<any | null>(null);
  const [search, setSearch] = useState("");

  const filters = search.trim()
    ? {
        or: `bank_name.ilike.%${search}%,country.ilike.%${search}%,currency.ilike.%${search}%,merchant_id.ilike.%${search}%,status.ilike.%${search}%`,
      }
    : undefined;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-bank-accounts-all", page, pageSize, sortCol, sortAsc, search],
    queryFn: () => extSelectPaged("bank_accounts", {
      page, pageSize,
      filters,
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
            <Building className="h-6 w-6 text-primary" /> Bank Accounts (All Merchants)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Connected bank accounts used for payouts and settlements.</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bank, country, currency, merchant…"
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {isLoading ? (
          <TableSkeleton rows={pageSize} cols={6} />
        ) : isError ? (
          <TableError onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <TableEmpty title="No bank accounts" description="No merchants have linked a bank account yet." icon={<Building className="h-5 w-5" />} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHead col="bank_name" label="Bank" />
                    <TableHead>Merchant</TableHead>
                    <SortHead col="country" label="Country" />
                    <SortHead col="currency" label="Currency" />
                    <SortHead col="status" label="Status" />
                    <SortHead col="created_at" label="Created" />
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium">{a.bank_name || "Bank Account"}</div>
                        {a.provider === "plaid" && (
                          <Badge variant="outline" className="text-[10px] gap-1 mt-1"><Link2 className="h-3 w-3" />Plaid</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{a.merchant_id?.slice(0, 8) || "—"}</TableCell>
                      <TableCell>{a.country || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{a.currency || "—"}</TableCell>
                      <TableCell>{statusBadge(a.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDrawer(a)} aria-label="View JSON">
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
        title="Bank account"
        description={drawer?.id}
        data={drawer}
      />
    </AppLayout>
  );
}
