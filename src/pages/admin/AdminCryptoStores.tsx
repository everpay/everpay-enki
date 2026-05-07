import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useCryptoStores, useCryptoWallets, useSyncElektropay } from "@/hooks/useCryptoWallets";
import { extSelect } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminCryptoStores() {
  const { isAdmin, isSuperAdmin, isLoading } = useAccessControl();
  const { data: stores = [], isLoading: loading } = useCryptoStores();
  const { data: wallets = [] } = useCryptoWallets();
  const { data: merchants = [] } = useQuery({
    queryKey: ["merchants-lite"],
    queryFn: async () => {
      const rows = await extSelect("merchants", { select: "id,name,email" });
      return rows as Array<{ id: string; name: string; email: string | null }>;
    },
  });
  const sync = useSyncElektropay();

  const merchantById = useMemo(() => {
    const m = new Map<string, { name: string; email: string | null }>();
    for (const row of merchants) m.set(row.id, { name: row.name, email: row.email });
    return m;
  }, [merchants]);

  const walletsByMerchant = useMemo(() => {
    const m = new Map<string, typeof wallets>();
    for (const w of wallets) {
      if (!m.has(w.merchant_id)) m.set(w.merchant_id, [] as any);
      (m.get(w.merchant_id) as any).push(w);
    }
    return m;
  }, [wallets]);

  if (isLoading) return <AppLayout><div className="p-6">Loading...</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  return (
    <AppLayout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Crypto Stores</h1>
          <p className="mt-1 text-sm text-muted-foreground">Per-merchant crypto store configuration synced with Elektropay.</p>
        </div>
        <Button variant="outline" onClick={() => sync.mutate({})} disabled={sync.isPending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${sync.isPending ? "animate-spin" : ""}`} />
          {sync.isPending ? "Syncing..." : "Sync from Elektropay"}
        </Button>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Merchant</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Wallet addresses</TableHead>
              <TableHead>Base Currency</TableHead>
              <TableHead>Elektropay ID</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : stores.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No crypto stores</TableCell></TableRow>
            ) : stores.map((s) => {
              const m = merchantById.get(s.merchant_id);
              const merchantWallets = (walletsByMerchant.get(s.merchant_id) || []) as any[];
              return (
                <TableRow key={s.id} className="align-top">
                  <TableCell className="font-medium">
                    {m?.name || <span className="text-muted-foreground">Unknown</span>}
                    <div className="text-[10px] text-muted-foreground font-mono">{s.merchant_id?.slice(0, 8)}</div>
                  </TableCell>
                  <TableCell className="text-xs">{m?.email || "—"}</TableCell>
                  <TableCell>
                    {merchantWallets.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No wallets</span>
                    ) : (
                      <div className="space-y-1">
                        {merchantWallets.map((w) => (
                          <div key={w.id} className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{w.asset_id}</Badge>
                            <span className="font-mono text-xs truncate max-w-[220px]" title={w.address || ""}>
                              {w.address || "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{s.base_currency}</TableCell>
                  <TableCell className="font-mono text-xs">{s.elektropay_store_id || "—"}</TableCell>
                  <TableCell><Badge variant={s.is_test ? "secondary" : "default"}>{s.is_test ? "Test" : "Live"}</Badge></TableCell>
                  <TableCell><Badge variant={s.is_active ? "default" : "destructive"}>{s.is_active ? "Active" : "Disabled"}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
