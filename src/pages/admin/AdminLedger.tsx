import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { format } from "date-fns";

export default function AdminLedger() {
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useAccessControl();
  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-ledger"],
    queryFn: () => extSelect("ledger_entries", { order: { column: "created_at", ascending: false }, limit: 200 }).catch(() => []),
  });

  if (roleLoading) return <AppLayout><div className="p-6">Loading…</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ledger</h1>
            <p className="text-muted-foreground text-sm">Double-entry journal entries across all merchants.</p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Recent entries</CardTitle>
            <CardDescription>Most recent 200 ledger entries</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-sm text-muted-foreground">Loading…</p>
            ) : (entries as any[]).length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No ledger entries.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Currency</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(entries as any[]).map((e) => (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 px-3">{e.created_at ? format(new Date(e.created_at), "MMM dd, HH:mm") : "—"}</td>
                        <td className="py-2 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            e.entry_type === "credit" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                          }`}>{e.entry_type}</span>
                        </td>
                        <td className="py-2 px-3">{e.currency}</td>
                        <td className={`py-2 px-3 text-right font-mono ${e.entry_type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                          {e.entry_type === "credit" ? "+" : "-"}{Math.abs(Number(e.amount || 0)).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{e.transaction_id?.slice(0, 8)}…</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}