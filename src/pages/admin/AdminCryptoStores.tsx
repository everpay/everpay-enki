import { AppLayout } from "@/components/AppLayout";
import { useCryptoStores } from "@/hooks/useCryptoWallets";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminCryptoStores() {
  const { isAdmin, isSuperAdmin, isLoading } = useAccessControl();
  const { data: stores = [], isLoading: loading } = useCryptoStores();

  if (isLoading) return <AppLayout><div className="p-6">Loading...</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Crypto Stores</h1>
        <p className="mt-1 text-sm text-muted-foreground">Per-merchant crypto store configuration synced with Elektropay.</p>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Base Currency</TableHead>
              <TableHead>Elektropay ID</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : stores.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No crypto stores</TableCell></TableRow>
            ) : stores.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="font-mono text-xs">{s.merchant_id?.slice(0, 8)}</TableCell>
                <TableCell>{s.base_currency}</TableCell>
                <TableCell className="font-mono text-xs">{s.elektropay_store_id || "—"}</TableCell>
                <TableCell><Badge variant={s.is_test ? "secondary" : "default"}>{s.is_test ? "Test" : "Live"}</Badge></TableCell>
                <TableCell><Badge variant={s.is_active ? "default" : "destructive"}>{s.is_active ? "Active" : "Disabled"}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
