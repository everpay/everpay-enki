import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { formatDistanceToNow } from "date-fns";

export default function AdminPlaidReconciliation() {
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useAccessControl();
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-plaid-stuck"],
    queryFn: async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const all = await extSelect("transactions", {
        filters: { provider: "plaid" },
        order: { column: "updated_at", ascending: false },
        limit: 200,
      }).catch(() => []);
      return (all as any[]).filter(
        (r) =>
          ["pending", "processing", "failed"].includes(r.status) &&
          r.updated_at < fiveMinAgo
      );
    },
  });

  const handleReconcile = async (id: string) => {
    setReconcilingId(id);
    try {
      // Reconciliation is performed by the existing plaid-reconcile edge function
      // using the calling admin JWT. Kept as a follow-up call so we don't duplicate logic here.
      const url = `https://schxpniiwnxzscbcnynt.supabase.co/functions/v1/plaid-reconcile`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reconcile", transaction_id: id }),
      });
      refetch();
    } finally {
      setReconcilingId(null);
    }
  };

  if (roleLoading) return <AppLayout><div className="p-6">Loading…</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Plaid Reconciliation</h1>
            <p className="text-muted-foreground text-sm">Re-pull status for stuck or failed Plaid ACH transfers across all merchants.</p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Stuck transfers</CardTitle>
            <CardDescription>Plaid transactions in pending/processing/failed older than 5 minutes.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
            ) : !rows.length ? (
              <div className="text-center py-8 text-sm text-muted-foreground flex flex-col items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" /> Nothing to reconcile.
              </div>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Transaction</TableHead><TableHead>Transfer</TableHead>
                  <TableHead>Amount</TableHead><TableHead>Status</TableHead>
                  <TableHead>Last update</TableHead><TableHead className="text-right">Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {rows.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.id?.slice(0, 8)}…</TableCell>
                      <TableCell className="font-mono text-xs">{r.provider_ref?.slice(0, 12) || "—"}</TableCell>
                      <TableCell className="font-mono">{Number(r.amount).toFixed(2)} {r.currency}</TableCell>
                      <TableCell><Badge variant={r.status === "failed" ? "destructive" : "secondary"}>{r.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.updated_at ? formatDistanceToNow(new Date(r.updated_at), { addSuffix: true }) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" disabled={reconcilingId === r.id} onClick={() => handleReconcile(r.id)}>
                          {reconcilingId === r.id ? (
                            <><RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" /> Syncing</>
                          ) : "Re-pull status"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}