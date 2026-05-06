import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, User, ArrowUpDown, Eye } from "lucide-react";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { extSelectPaged } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { TablePagination } from "@/components/TablePagination";
import { TableSkeleton, TableEmpty, TableError } from "@/components/TableStates";
import { JsonDrawer } from "@/components/admin/JsonDrawer";
import { RecipientWizard } from "@/components/admin/RecipientWizard";

const SORT_COLUMNS = ["created_at", "name", "email", "country", "account_type"] as const;
type SortCol = typeof SORT_COLUMNS[number];

export default function AdminRecipients() {
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useAccessControl();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortCol, setSortCol] = useState<SortCol>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [drawer, setDrawer] = useState<any | null>(null);
  const [wizard, setWizard] = useState(false);

  const filters = search.trim()
    ? {
        or: `name.ilike.%${search}%,email.ilike.%${search}%,country.ilike.%${search}%,account_type.ilike.%${search}%,merchant_id.ilike.%${search}%`,
      }
    : undefined;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-recipients", page, pageSize, sortCol, sortAsc, search],
    queryFn: () => extSelectPaged("recipients_intl", {
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Payout Recipients</h1>
            <p className="text-muted-foreground text-sm">Multi-rail beneficiaries (ACH, Wire, SEPA, SWIFT, FasterPayments, BSB, IFSC, CLABE, USDT).</p>
          </div>
          <Button onClick={() => setWizard(true)}><Plus className="h-4 w-4 mr-1.5" /> New recipient</Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, country, type, merchant…"
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {isLoading ? (
          <TableSkeleton rows={pageSize} cols={5} />
        ) : isError ? (
          <TableError onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <TableEmpty title="No recipients" icon={<User className="h-5 w-5" />} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHead col="name" label="Name" />
                    <SortHead col="email" label="Email" />
                    <SortHead col="country" label="Country" />
                    <SortHead col="account_type" label="Type" />
                    <TableHead>Merchant</TableHead>
                    <SortHead col="created_at" label="Created" />
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.email || "—"}</TableCell>
                      <TableCell>{r.country || "—"}</TableCell>
                      <TableCell>{r.account_type ? <Badge variant="outline">{r.account_type}</Badge> : "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{r.merchant_id?.slice(0, 8) || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDrawer(r)} aria-label="View JSON">
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
        title="Recipient"
        description={drawer?.id}
        data={drawer}
      />
      <RecipientWizard open={wizard} onOpenChange={setWizard} onSaved={() => refetch()} />
    </AppLayout>
  );
}
