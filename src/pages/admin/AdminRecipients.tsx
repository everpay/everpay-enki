import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Mail, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";

export default function AdminRecipients() {
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useAccessControl();
  const [search, setSearch] = useState("");

  const { data: recipients = [] } = useQuery({
    queryKey: ["admin-recipients"],
    queryFn: () => extSelect("recipients", { order: { column: "created_at", ascending: false }, limit: 1000 }).catch(() => []),
  });

  if (roleLoading) return <AppLayout><div className="p-6">Loading…</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  const filtered = (recipients as any[]).filter((r) =>
    !search ||
    (r.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Payout Recipients</h1>
          <p className="text-muted-foreground text-sm">All recipients/beneficiaries registered for payouts across merchants.</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search recipients…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="grid gap-3">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No recipients</p>
          ) : filtered.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{r.name || "—"}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {r.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>}
                      {r.country && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.country}</span>}
                      {r.account_type && <Badge variant="outline">{r.account_type}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground font-mono">{r.merchant_id?.slice(0, 8)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}