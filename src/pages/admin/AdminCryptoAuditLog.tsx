import { AppLayout } from "@/components/AppLayout";
import { useCryptoAuditLogs } from "@/hooks/useCryptoAuditLogs";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminCryptoAuditLog() {
  const { isAdmin, isSuperAdmin, isLoading } = useAccessControl();
  const q = useCryptoAuditLogs();

  if (isLoading) return <AppLayout><div className="p-6">Loading...</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  const rows = q.data?.pages.flatMap((p) => p.rows) || [];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Crypto Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Append-only trail of every change against crypto wallets, stores and commissions.</p>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>When</TableHead><TableHead>Resource</TableHead><TableHead>Change</TableHead>
            <TableHead>By</TableHead><TableHead>Snapshot</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {q.isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No audit entries</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell><Badge variant="outline">{r.resource_type}</Badge> <span className="font-mono text-xs">{r.resource_id?.slice(0,8)}</span></TableCell>
                <TableCell><Badge>{r.change_type}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{r.changed_by?.slice(0, 8) || "system"}</TableCell>
                <TableCell className="font-mono text-[10px] max-w-[280px] truncate">{r.new_value ? JSON.stringify(r.new_value) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {q.hasNextPage && (
          <div className="p-3 border-t border-border text-center">
            <Button variant="outline" size="sm" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>
              {q.isFetchingNextPage ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
