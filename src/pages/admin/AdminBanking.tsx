import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Landmark } from "lucide-react";

export default function AdminBanking() {
  const { isAdmin, isSuperAdmin, isLoading } = useAccessControl();
  const accounts = useQuery({
    queryKey: ["admin-bank-accounts"],
    queryFn: () => extSelect("bank_accounts_safe", { order: { column: "created_at", ascending: false } }),
  });
  const payouts = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: () => extSelect("payouts", { order: { column: "created_at", ascending: false }, limit: 100 }),
  });

  if (isLoading) return <AppLayout><div className="p-6">Loading...</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Landmark className="h-5 w-5" /> Banking</h1>
        <p className="mt-1 text-sm text-muted-foreground">All merchant bank accounts (PII-safe view) and recent payouts.</p>
      </div>

      <div className="rounded-xl border border-border bg-card mb-6">
        <div className="p-4 border-b border-border font-medium">Bank accounts</div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Merchant</TableHead><TableHead>Bank</TableHead><TableHead>Country</TableHead>
            <TableHead>Currency</TableHead><TableHead>Last 4</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {(accounts.data || []).length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No accounts</TableCell></TableRow>
            ) : (accounts.data || []).map((a: any) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs">{a.merchant_id?.slice(0,8)}</TableCell>
                <TableCell>{a.bank_name || "—"}</TableCell>
                <TableCell>{a.country || "—"}</TableCell>
                <TableCell>{a.currency || "—"}</TableCell>
                <TableCell className="font-mono">•••{a.last_4 || a.account_last_4 || "—"}</TableCell>
                <TableCell><Badge variant={a.verified ? "default" : "secondary"}>{a.verified ? "Verified" : "Unverified"}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border font-medium">Recent payouts</div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>When</TableHead><TableHead>Merchant</TableHead><TableHead className="text-right">Amount</TableHead>
            <TableHead>Currency</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {(payouts.data || []).length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payouts</TableCell></TableRow>
            ) : (payouts.data || []).map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="text-xs">{p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</TableCell>
                <TableCell className="font-mono text-xs">{p.merchant_id?.slice(0,8)}</TableCell>
                <TableCell className="text-right font-medium">{Number(p.amount || 0).toFixed(2)}</TableCell>
                <TableCell>{p.currency || "—"}</TableCell>
                <TableCell><Badge variant={p.status === "paid" ? "default" : p.status === "failed" ? "destructive" : "secondary"}>{p.status || "pending"}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
