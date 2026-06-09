import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { KycVerificationDetailDrawer } from "@/components/admin/KycVerificationDetailDrawer";

function statusVariant(status: string) {
  if (status === "approved" || status === "verified") return "default" as const;
  if (status === "in_progress" || status === "pending") return "secondary" as const;
  if (status === "rejected" || status === "failed") return "destructive" as const;
  return "outline" as const;
}

export default function AdminKycVerifications() {
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useAccessControl();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ["admin-kyc-verifications"],
    queryFn: () => extSelect("kyc_verifications", { order: { column: "created_at", ascending: false }, limit: 500 }).catch(() => []),
  });
  const { data: plaidItems = [] } = useQuery({
    queryKey: ["admin-plaid-items"],
    queryFn: () => extSelect("plaid_items", { order: { column: "created_at", ascending: false }, limit: 200 }).catch(() => []),
  });

  if (roleLoading) return <AppLayout><div className="p-6">Loading…</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  const filtered = (verifications as any[]).filter((v) =>
    !search ||
    (v.merchant_id || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.provider || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.country || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" /> KYC / KYB Verifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cross-provider identity & business verifications — KYCAID (international), Plaid + Unit (US/Canada), Gap600, Circle.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{(verifications as any[]).length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Approved</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-emerald-600">{(verifications as any[]).filter((v) => v.status === "approved" || v.status === "verified").length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-amber-600">{(verifications as any[]).filter((v) => v.status === "in_progress" || v.status === "pending").length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Plaid items</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{(plaidItems as any[]).length}</CardContent></Card>
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by merchant id, provider, or country…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{filtered.length} verifications</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>When</TableHead><TableHead>Merchant</TableHead><TableHead>Provider</TableHead>
              <TableHead>Country</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No verifications.</TableCell></TableRow>
              ) : filtered.map((v: any) => (
                <TableRow
                  key={v.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => { setSelected(v); setDrawerOpen(true); }}
                >
                  <TableCell className="text-xs">{v.created_at ? new Date(v.created_at).toLocaleString() : "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{v.merchant_id?.slice(0, 8)}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{v.provider || "—"}</Badge></TableCell>
                  <TableCell>{v.country || "—"}</TableCell>
                  <TableCell className="text-xs">{v.verification_type || v.type || "—"}</TableCell>
                  <TableCell><Badge variant={statusVariant(v.status)}>{v.status || "unknown"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <KycVerificationDetailDrawer verification={selected} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </AppLayout>
  );
}