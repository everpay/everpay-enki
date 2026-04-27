import { AppLayout } from "@/components/AppLayout";
import { useElektropayWebhookEvents } from "@/hooks/useElektropayWebhookEvents";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminCryptoWebhookEvents() {
  const { isAdmin, isSuperAdmin, isLoading } = useAccessControl();
  const q = useElektropayWebhookEvents();

  if (isLoading) return <AppLayout><div className="p-6">Loading...</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  const rows = q.data?.pages.flatMap((p) => p.rows) || [];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Elektropay Webhook Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">Inbound webhook deliveries and processing status.</p>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>When</TableHead><TableHead>Type</TableHead><TableHead>Event ID</TableHead>
            <TableHead>Attempts</TableHead><TableHead>Status</TableHead><TableHead>Error</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {q.isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No webhook events</TableCell></TableRow>
            ) : rows.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs">{new Date(e.created_at).toLocaleString()}</TableCell>
                <TableCell><Badge variant="outline">{e.event_type}</Badge></TableCell>
                <TableCell className="font-mono text-xs max-w-[180px] truncate">{e.event_id}</TableCell>
                <TableCell>{e.attempt_count ?? 0}</TableCell>
                <TableCell><Badge variant={e.processed ? "default" : "secondary"}>{e.processed ? "Processed" : "Pending"}</Badge></TableCell>
                <TableCell className="text-xs text-destructive max-w-[240px] truncate">{e.error_message || "—"}</TableCell>
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
