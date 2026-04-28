import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { extSelect } from "@/hooks/useExternalData";
import { Download, RefreshCw, Search, TrendingUp, Users, WalletCards } from "lucide-react";
import { downloadCsv } from "@/lib/csv";

type ResellerRow = {
  id: string;
  email: string;
  name: string;
  status: string;
  merchantCount: number;
  volume: number;
  transactions: number;
  commissionOwed: number;
};

const COMMISSION_RATE = 0.00125;
const fmtUsd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function AdminResellers() {
  const [rows, setRows] = useState<ResellerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchResellers = async () => {
    setLoading(true);
    try {
      const roles: any[] = await extSelect("user_roles", { select: "user_id, role, invited_by" });
      const resellerIds = (roles || []).filter((r) => r.role === "reseller").map((r) => r.user_id);
      if (resellerIds.length === 0) { setRows([]); return; }

      const merchantLinks = (roles || []).filter((r) => r.role === "merchant" && r.invited_by);

      const [profiles, merchants, txs] = await Promise.all([
        extSelect("profiles", { select: "id, user_id, display_name, email" }),
        extSelect("merchants", { select: "id, user_id" }),
        extSelect("transactions", { select: "merchant_id, amount, status", limit: 5000 }),
      ]);

      const profileById = new Map((profiles as any[]).map((p) => [p.user_id, p]));
      const merchantIdByUser = new Map((merchants as any[]).map((m) => [m.user_id, m.id]));
      const txByMerchant = new Map<string, { volume: number; count: number }>();
      (txs as any[]).forEach((t) => {
        if (!["completed", "succeeded"].includes(t.status)) return;
        const cur = txByMerchant.get(t.merchant_id) || { volume: 0, count: 0 };
        cur.volume += Number(t.amount || 0);
        cur.count += 1;
        txByMerchant.set(t.merchant_id, cur);
      });

      const built = resellerIds.map((rid) => {
        const p = profileById.get(rid);
        const linkedUsers = merchantLinks.filter((l: any) => l.invited_by === rid).map((l: any) => l.user_id);
        const totals = linkedUsers.reduce((acc, uid) => {
          const mid = merchantIdByUser.get(uid);
          const stats = mid ? txByMerchant.get(mid as string) : undefined;
          acc.volume += stats?.volume || 0;
          acc.transactions += stats?.count || 0;
          return acc;
        }, { volume: 0, transactions: 0 });
        return {
          id: rid,
          email: p?.email || "",
          name: p?.display_name || p?.email || "Reseller",
          status: "active",
          merchantCount: linkedUsers.length,
          volume: totals.volume,
          transactions: totals.transactions,
          commissionOwed: totals.volume * COMMISSION_RATE,
        };
      });
      setRows(built);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResellers(); }, []);

  const filteredRows = rows.filter((row) =>
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => ({
    resellers: rows.length,
    merchants: rows.reduce((s, r) => s + r.merchantCount, 0),
    volume: rows.reduce((s, r) => s + r.volume, 0),
    commission: rows.reduce((s, r) => s + r.commissionOwed, 0),
  }), [rows]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Resellers</h1>
            <p className="text-sm text-muted-foreground mt-1">Track reseller merchants, volume, and outstanding commissions</p>
          </div>
          <Button variant="outline" onClick={fetchResellers}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <Button
            variant="outline"
            onClick={() => downloadCsv(
              `resellers-${new Date().toISOString().slice(0,10)}.csv`,
              ["Reseller ID", "Name", "Email", "Status", "Merchants", "Transactions", "Volume (USD)", "Commission Owed (USD)"],
              rows.map((r) => [r.id, r.name, r.email, r.status, r.merchantCount, r.transactions, r.volume.toFixed(2), r.commissionOwed.toFixed(2)])
            )}
          >
            <Download className="mr-2 h-4 w-4" />Export CSV
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6"><Users className="mb-3 h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">Resellers</p><p className="text-2xl font-bold">{stats.resellers}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><Users className="mb-3 h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">Referred Merchants</p><p className="text-2xl font-bold">{stats.merchants}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><TrendingUp className="mb-3 h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">Referred Volume</p><p className="text-2xl font-bold">{fmtUsd(stats.volume)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><WalletCards className="mb-3 h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">Commission Owed</p><p className="text-2xl font-bold">{fmtUsd(stats.commission)}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Commission Ledger</CardTitle><CardDescription>Calculated from completed merchant transaction volume at the platform reseller split</CardDescription></CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search resellers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader><TableRow><TableHead>Reseller</TableHead><TableHead>Status</TableHead><TableHead>Merchants</TableHead><TableHead>Transactions</TableHead><TableHead>Volume</TableHead><TableHead>Commission Owed</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading resellers...</TableCell></TableRow>
                    : filteredRows.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No resellers found</TableCell></TableRow>
                    : filteredRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell><div className="font-medium">{row.name}</div><div className="text-sm text-muted-foreground">{row.email}</div></TableCell>
                        <TableCell><Badge variant="default">{row.status}</Badge></TableCell>
                        <TableCell>{row.merchantCount}</TableCell>
                        <TableCell>{row.transactions}</TableCell>
                        <TableCell>{fmtUsd(row.volume)}</TableCell>
                        <TableCell className="font-medium">{fmtUsd(row.commissionOwed)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}