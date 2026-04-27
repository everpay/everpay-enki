import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe } from "lucide-react";

export default function AdminCurrencyManagement() {
  const { isAdmin, isSuperAdmin, isLoading } = useAccessControl();
  const txns = useQuery({
    queryKey: ["admin-tx-currencies"],
    queryFn: () => extSelect("transactions", { select: "currency, amount, status", limit: 1000, order: { column: "created_at", ascending: false } }),
  });

  const breakdown = useMemo(() => {
    const map = new Map<string, { volume: number; count: number; success: number }>();
    for (const t of (txns.data || []) as any[]) {
      const cur = (t.currency || "UNK").toUpperCase();
      const e = map.get(cur) || { volume: 0, count: 0, success: 0 };
      e.count++;
      e.volume += Number(t.amount || 0);
      if (t.status === "succeeded" || t.status === "captured") e.success++;
      map.set(cur, e);
    }
    return Array.from(map.entries()).map(([currency, v]) => ({ currency, ...v })).sort((a, b) => b.volume - a.volume);
  }, [txns.data]);

  if (isLoading) return <AppLayout><div className="p-6">Loading...</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Globe className="h-5 w-5" /> Currency Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Currency mix derived from the most recent 1,000 transactions.</p>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Currency</TableHead>
            <TableHead className="text-right">Transactions</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right">Success rate</TableHead>
            <TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {txns.isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : breakdown.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No transactions</TableCell></TableRow>
            ) : breakdown.map((r) => (
              <TableRow key={r.currency}>
                <TableCell className="font-medium">{r.currency}</TableCell>
                <TableCell className="text-right">{r.count.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono">{r.volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right">{r.count ? ((r.success / r.count) * 100).toFixed(1) : "0"}%</TableCell>
                <TableCell><Badge variant="default">Active</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
