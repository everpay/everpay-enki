import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Check, Clock, AlertCircle, Link2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";

function statusBadge(status: string | null) {
  switch (status) {
    case "verified": return <Badge variant="default" className="gap-1"><Check className="h-3 w-3" />Verified</Badge>;
    case "pending_verification": return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    case "failed": return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Failed</Badge>;
    default: return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{status || "New"}</Badge>;
  }
}

export default function AdminBankAccounts() {
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useAccessControl();
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["admin-bank-accounts-all"],
    queryFn: () => extSelect("bank_accounts", { order: { column: "created_at", ascending: false }, limit: 500 }),
  });

  if (roleLoading) return <AppLayout><div className="p-6">Loading…</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bank Accounts (All Merchants)</h1>
          <p className="text-muted-foreground text-sm">Connected bank accounts used for payouts and settlements across the platform.</p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No bank accounts</h3>
              <p className="text-muted-foreground text-sm">No merchants have linked a bank account yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {accounts.map((a: any) => (
              <Card key={a.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {a.bank_name || "Bank Account"}
                        {a.provider === "plaid" && (
                          <Badge variant="outline" className="text-xs gap-1"><Link2 className="h-3 w-3" />Plaid</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        Merchant {a.merchant_id?.slice(0, 8)}
                        {a.country && <span className="ml-2">{a.country}</span>}
                        {a.currency && <span className="ml-1">· {a.currency}</span>}
                      </CardDescription>
                    </div>
                    {statusBadge(a.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {a.account_number && <div><p className="text-muted-foreground">Account</p><p className="font-mono">{a.account_number}</p></div>}
                    {a.iban && <div><p className="text-muted-foreground">IBAN</p><p className="font-mono">{a.iban}</p></div>}
                    {a.sort_code && <div><p className="text-muted-foreground">Sort/BSB</p><p className="font-mono">{a.sort_code}</p></div>}
                    {a.external_account_id && <div><p className="text-muted-foreground">External ID</p><p className="font-mono truncate">{a.external_account_id}</p></div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}