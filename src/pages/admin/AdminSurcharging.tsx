import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Percent } from "lucide-react";

export default function AdminSurcharging() {
  const { isAdmin, isSuperAdmin, isLoading } = useAccessControl();
  const settings = useQuery({
    queryKey: ["admin-surcharge-settings"],
    queryFn: () => extSelect("surcharge_settings", { order: { column: "updated_at", ascending: false } }),
  });

  if (isLoading) return <AppLayout><div className="p-6">Loading...</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  const rows = (settings.data || []) as any[];
  const enabled = rows.filter((r) => r.enabled).length;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Percent className="h-5 w-5" /> Surcharging</h1>
        <p className="mt-1 text-sm text-muted-foreground">Per-merchant customer-paid fee configuration.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Stat label="Merchants configured" value={rows.length} />
        <Stat label="Enabled" value={enabled} />
        <Stat label="Disabled" value={rows.length - enabled} />
      </div>
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Merchant</TableHead><TableHead>Enabled</TableHead>
            <TableHead className="text-right">Percent fee</TableHead><TableHead className="text-right">Fixed fee</TableHead>
            <TableHead className="text-right">Cap</TableHead><TableHead>Applies to</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {settings.isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No surcharge settings</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.merchant_id?.slice(0,8)}</TableCell>
                <TableCell><Badge variant={r.enabled ? "default" : "secondary"}>{r.enabled ? "On" : "Off"}</Badge></TableCell>
                <TableCell className="text-right">{(Number(r.percentage_fee || 0) * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-right">{Number(r.fixed_fee || 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">{r.max_fee_cap != null ? Number(r.max_fee_cap).toFixed(2) : "—"}</TableCell>
                <TableCell className="text-xs">{[r.apply_to_credit && "credit", r.apply_to_debit && "debit"].filter(Boolean).join(", ") || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
