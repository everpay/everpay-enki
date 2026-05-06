import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { externalProxy } from "@/hooks/useExternalData";
import { Search, Send, Link2, RefreshCw, Database, Loader2, UserSearch } from "lucide-react";

interface ReconcileRow {
  source: "local" | "platform" | "auth_user";
  id?: string;
  user_id?: string;
  email?: string;
  name?: string;
  phone?: string;
  created_at?: string;
}

export default function AdminUserReconciliation() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReconcileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [linkMerchantId, setLinkMerchantId] = useState<Record<string, string>>({});
  const [backfillCcy, setBackfillCcy] = useState<Record<string, string>>({});

  const search = async () => {
    if (query.trim().length < 2) {
      toast({ title: "Enter at least 2 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const r = await externalProxy({ action: "search_user_reconciliation", q: query.trim() });
      setResults((r.data || []) as ReconcileRow[]);
      if ((r.data || []).length === 0) toast({ title: "No matches found" });
    } catch (e: any) {
      toast({ title: "Search failed", description: e?.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const invite = async (email?: string, merchant_id?: string) => {
    if (!email) return;
    setBusy(`invite:${email}`);
    try {
      await externalProxy({ action: "resend_invite", email, merchant_id });
      toast({ title: "Invite sent", description: email });
    } catch (e: any) {
      toast({ title: "Invite failed", description: e?.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const link = async (merchant_id: string, user_id: string) => {
    if (!merchant_id || !user_id) return;
    setBusy(`link:${merchant_id}:${user_id}`);
    try {
      await externalProxy({ action: "link_merchant_user", merchant_id, user_id });
      toast({ title: "Linked", description: "User linked to merchant" });
      await search();
    } catch (e: any) {
      toast({ title: "Link failed", description: e?.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const sync = async (merchant_id: string) => {
    setBusy(`sync:${merchant_id}`);
    try {
      const r = await externalProxy({ action: "sync_merchant_records", merchant_id });
      const s = r.summary || {};
      toast({ title: "Sync complete", description: `Tx: ${s.transactions || 0} • Events: ${s.provider_events || 0}` });
    } catch (e: any) {
      toast({ title: "Sync failed", description: e?.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const backfill = async (merchant_id: string) => {
    const currency = backfillCcy[merchant_id]?.trim() || undefined;
    setBusy(`backfill:${merchant_id}`);
    try {
      const r = await externalProxy({ action: "backfill_provider_events", merchant_id, currency });
      toast({
        title: "Backfill complete",
        description: `Fetched ${r.fetched} • Inserted ${r.inserted} • Skipped ${r.skipped_duplicates}`,
      });
    } catch (e: any) {
      toast({ title: "Backfill failed", description: e?.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const sourceBadge = (s: string) =>
    s === "auth_user" ? <Badge variant="secondary">Auth user</Badge>
    : s === "platform" ? <Badge>Platform OS</Badge>
    : <Badge variant="outline">Local merchant</Badge>;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <UserSearch className="h-6 w-6 text-primary" />
            Merchant User Reconciliation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find missing merchant users by email or name across environments, then invite, link, sync, or backfill provider events.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search</CardTitle>
            <CardDescription>Searches local merchants, platform OS, and auth users.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="email or name (e.g. globeandgo18@gmail.com)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") search(); }}
              className="h-12"
            />
            <Button onClick={search} disabled={loading} className="h-12">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results ({results.length})</CardTitle>
            <CardDescription>Use the actions to invite, link, sync records, or backfill provider events.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Email / Name</TableHead>
                  <TableHead>Merchant / User ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No results yet.</TableCell></TableRow>
                ) : results.map((r, i) => {
                  const merchantId = r.id || "";
                  const isAuth = r.source === "auth_user";
                  return (
                    <TableRow key={`${r.source}-${r.id || r.user_id}-${i}`}>
                      <TableCell>{sourceBadge(r.source)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{r.email || "—"}</div>
                        <div className="text-xs text-muted-foreground">{r.name || ""}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {merchantId && <div>m: {merchantId.slice(0, 8)}…</div>}
                        {r.user_id && <div>u: {r.user_id.slice(0, 8)}…</div>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {r.email && (
                            <Button size="sm" variant="outline" disabled={busy === `invite:${r.email}`}
                              onClick={() => invite(r.email, merchantId || undefined)}>
                              <Send className="mr-1 h-3 w-3" /> Invite
                            </Button>
                          )}
                          {isAuth ? (
                            <div className="flex items-center gap-1">
                              <Input
                                placeholder="merchant id"
                                value={linkMerchantId[r.user_id || ""] || ""}
                                onChange={(e) => setLinkMerchantId({ ...linkMerchantId, [r.user_id || ""]: e.target.value })}
                                className="h-8 w-40 text-xs"
                              />
                              <Button size="sm" variant="outline"
                                disabled={busy === `link:${linkMerchantId[r.user_id || ""]}:${r.user_id}`}
                                onClick={() => link(linkMerchantId[r.user_id || ""], r.user_id || "")}>
                                <Link2 className="mr-1 h-3 w-3" /> Link
                              </Button>
                            </div>
                          ) : merchantId && (
                            <>
                              <Button size="sm" variant="outline" disabled={busy === `sync:${merchantId}`}
                                onClick={() => sync(merchantId)}>
                                <RefreshCw className="mr-1 h-3 w-3" /> Sync
                              </Button>
                              <div className="flex items-center gap-1">
                                <Input
                                  placeholder="USD"
                                  value={backfillCcy[merchantId] || ""}
                                  onChange={(e) => setBackfillCcy({ ...backfillCcy, [merchantId]: e.target.value.toUpperCase() })}
                                  className="h-8 w-20 text-xs uppercase"
                                />
                                <Button size="sm" variant="outline" disabled={busy === `backfill:${merchantId}`}
                                  onClick={() => backfill(merchantId)}>
                                  <Database className="mr-1 h-3 w-3" /> Backfill events
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}