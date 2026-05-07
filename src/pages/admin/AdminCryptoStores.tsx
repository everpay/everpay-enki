import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useCryptoStores, useCryptoWallets, useSyncElektropay } from "@/hooks/useCryptoWallets";
import { extSelect } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MerchantDetailDrawer, CopyAddress } from "@/components/crypto/MerchantDetailDrawer";

const PAGE_SIZE = 10;

export default function AdminCryptoStores() {
  const { isAdmin, isSuperAdmin, isLoading } = useAccessControl();
  const { data: wallets = [] } = useCryptoWallets();
  // Source of truth for "stores" is the merchants list — every merchant gets a
  // row, with their Elektropay settings + wallets joined in.
  const { data: merchants = [] } = useQuery({
    queryKey: ["merchants-full-stores"],
    queryFn: async () => {
      const rows = await extSelect("merchants", {
        select: "id,name,email,created_at",
        order: { column: "created_at", ascending: false },
      });
      return rows as Array<{ id: string; name: string; email: string | null; created_at: string }>;
    },
  });
  const { data: settings = [], isLoading: loading } = useQuery({
    queryKey: ["elektropay-settings-all"],
    queryFn: async () => await extSelect("elektropay_settings", {}),
  });
  const sync = useSyncElektropay();
  const [page, setPage] = useState(1);
  const [openMerchant, setOpenMerchant] = useState<{ id: string; name: string; email: string | null } | null>(null);

  const settingsByMerchant = useMemo(() => {
    const m = new Map<string, any>();
    for (const s of settings as any[]) m.set(s.merchant_id, s);
    return m;
  }, [settings]);

  const walletsByMerchant = useMemo(() => {
    const m = new Map<string, typeof wallets>();
    for (const w of wallets) {
      if (!m.has(w.merchant_id)) m.set(w.merchant_id, [] as any);
      (m.get(w.merchant_id) as any).push(w);
    }
    return m;
  }, [wallets]);

  const totalPages = Math.max(1, Math.ceil(merchants.length / PAGE_SIZE));
  const pageMerchants = merchants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : pageMerchants.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No merchants</TableCell></TableRow>
            ) : pageMerchants.map((m) => {
              const s = settingsByMerchant.get(m.id);
              const merchantWallets = (walletsByMerchant.get(m.id) || []) as any[];
              return (
                <TableRow
                  key={m.id}
                  className="align-top cursor-pointer hover:bg-muted/40"
                  onClick={() => setOpenMerchant({ id: m.id, name: m.name, email: m.email })}
                >
                  <TableCell className="font-medium">
                    {m.name || <span className="text-muted-foreground">Unknown</span>}
                    <div className="text-[10px] text-muted-foreground font-mono">{m.id?.slice(0, 8)}</div>
                  </TableCell>
                  <TableCell className="text-xs">{m.email || "—"}</TableCell>
                  <TableCell>
                    {merchantWallets.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No wallets</span>
                    ) : (
                      <div className="space-y-1">
                        {merchantWallets.map((w) => (
                          <div key={w.id} className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{w.asset_id}</Badge>
                            <span className="font-mono text-xs truncate max-w-[200px]" title={w.address || ""}>
                              {w.address || "—"}
                            </span>
                            {w.address && <CopyAddress value={w.address} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>USD</TableCell>
                  <TableCell className="font-mono text-xs">{s?.elektropay_store_id || "—"}</TableCell>
                  <TableCell><Badge variant="default">Live</Badge></TableCell>
                  <TableCell>
                    <Badge variant={s?.enabled ? "default" : "destructive"}>{s?.enabled ? "Active" : "Disabled"}</Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOpenMerchant({ id: m.id, name: m.name, email: m.email })}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {merchants.length > PAGE_SIZE && (
          <div className="flex items-center justify-between p-3 border-t border-border text-sm">
            <span className="text-muted-foreground">
              Page {page} of {totalPages} · {merchants.length} merchants
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <MerchantDetailDrawer
        merchantId={openMerchant?.id || null}
        merchantName={openMerchant?.name}
        merchantEmail={openMerchant?.email}
        onClose={() => setOpenMerchant(null)}
      />
    </AppLayout>
  );
}
