import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import { AlertTriangle, CheckCircle2, Download, RefreshCw, Scale, XCircle } from "lucide-react";
import { downloadCsv } from "@/lib/csv";

const fmt = (n: number, c = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n);

export default function AdminReconciliation() {
  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-reconciliation"],
    queryFn: async () => {
      const txs: any[] = await extSelect("transactions", {
        select: "id, amount, currency, provider, status, settlement_amount, created_at, merchant_id",
        order: { column: "created_at", ascending: false },
        limit: 1000,
      });
      const groups = new Map<string, any>();
      txs.filter((t) => ["completed", "refunded", "succeeded"].includes(t.status)).forEach((t) => {
        const date = String(t.created_at || "").split("T")[0];
        const provider = t.provider || "unknown";
        const key = `${t.merchant_id}-${provider}-${date}`;
        const g = groups.get(key) || { id: key, merchant: t.merchant_id || "—", provider, date, gross: 0, settled: 0, count: 0, currency: t.currency || "USD" };
        g.gross += Number(t.amount || 0);
        g.settled += Number(t.settlement_amount ?? t.amount ?? 0);
        g.count += 1;
        groups.set(key, g);
      });
      return Array.from(groups.values()).map((g) => {
        const variance = g.settled - g.gross;
        const pct = g.gross > 0 ? (variance / g.gross) * 100 : 0;
        return { ...g, variance, status: Math.abs(variance) < 0.01 ? "matched" : Math.abs(pct) > 5 ? "mismatch" : "pending" };
      });
    },
  });

  const stats = useMemo(() => ({
    matched: (rows as any[]).filter((r) => r.status === "matched").length,
    mismatched: (rows as any[]).filter((r) => r.status === "mismatch").length,
    pending: (rows as any[]).filter((r) => r.status === "pending").length,
    totalVariance: (rows as any[]).reduce((s, r) => s + Math.abs(r.variance), 0),
  }), [rows]);

  const badge = (s: string) => s === "matched" ? <Badge variant="default"><CheckCircle2 className="mr-1 h-3 w-3" />Matched</Badge>
    : s === "mismatch" ? <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Mismatch</Badge>
    : <Badge variant="secondary"><AlertTriangle className="mr-1 h-3 w-3" />Pending</Badge>;

  const exportCsv = () => {
    downloadCsv(
      `reconciliation-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Date", "Merchant ID", "Provider", "Currency", "Gross", "Settled", "Variance", "Status", "Transactions"],
      (rows as any[]).map((r) => [
        r.date, r.merchant, r.provider, r.currency,
        Number(r.gross).toFixed(2), Number(r.settled).toFixed(2),
        Number(r.variance).toFixed(2), r.status, r.count,
      ])
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Scale className="h-6 w-6 text-primary" />Reconciliation</h1>
            <p className="text-sm text-muted-foreground mt-1">Daily settlement versus ledger comparison for all merchants</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            <Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Matched</p><p className="text-2xl font-bold">{stats.matched}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Mismatched</p><p className="text-2xl font-bold">{stats.mismatched}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold">{stats.pending}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Variance</p><p className="text-2xl font-bold">{fmt(stats.totalVariance)}</p></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Settlement Reconciliation</CardTitle><CardDescription>Grouped by merchant, provider, and date</CardDescription></CardHeader><CardContent><Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Merchant</TableHead><TableHead>Provider</TableHead><TableHead className="text-right">Gross</TableHead><TableHead className="text-right">Settled</TableHead><TableHead className="text-right">Variance</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Txns</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
              : (rows as any[]).length === 0 ? <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No reconciliation data</TableCell></TableRow>
              : (rows as any[]).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{r.date}</TableCell>
                  <TableCell className="font-medium font-mono text-xs">{String(r.merchant).slice(0,8)}…</TableCell>
                  <TableCell className="capitalize">{r.provider}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(r.gross, r.currency)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(r.settled, r.currency)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(Math.abs(r.variance), r.currency)}</TableCell>
                  <TableCell>{badge(r.status)}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{r.count}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table></CardContent></Card>
      </div>
    </AppLayout>
  );
}