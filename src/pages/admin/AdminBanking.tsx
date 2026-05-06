import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Landmark, Plug, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CryptoUpsellRates } from "@/components/admin/CryptoUpsellRates";
import { ProviderPricingBreakdown } from "@/components/admin/ProviderPricingBreakdown";
import { PayoutTimeline } from "@/components/admin/PayoutTimeline";

const PROVIDERS: Array<{ id: string; name: string; fn: string; currencies: string; rails: string }> = [
  { id: "delos",       name: "Delos Financial", fn: "delos-banking",       currencies: "USD, EUR", rails: "Wire / SEPA" },
  { id: "brighty",     name: "Brighty App",      fn: "brighty-banking",     currencies: "EUR, multi", rails: "SEPA Instant / IBAN" },
  { id: "unit",        name: "Unit",             fn: "unit-rtp",            currencies: "USD",      rails: "RTP / FedNow / ACH" },
  { id: "circle",      name: "Circle",           fn: "circle-transfer",     currencies: "USDC, USD",rails: "Blockchain / Wire" },
  { id: "walletsuite", name: "Walletster",       fn: "walletsuite-wallets", currencies: "Multi",    rails: "Wallet ledger" },
  { id: "elektropay",  name: "Elektropay",       fn: "elektropay-proxy",    currencies: "Crypto + fiat", rails: "USDT / USDC / multi-chain" },
  { id: "paywatcher",  name: "PayWatcher (BASE)", fn: "paywatcher-payments", currencies: "USDC on BASE", rails: "BASE L2 / USDC — $0.05 cost → $0.50 charge" },
];

function ProviderRow({ p }: { p: (typeof PROVIDERS)[number] }) {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string>("");
  const test = async () => {
    setState("loading"); setMsg("");
    try {
      const { data, error } = await supabase.functions.invoke(p.fn, { body: { action: "ping" } });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setState("ok"); setMsg(`HTTP ${data?.status ?? 200}`);
      toast.success(`${p.name} reachable`);
    } catch (e: any) {
      setState("err"); setMsg(e.message || "Failed");
      toast.error(`${p.name}: ${e.message}`);
    }
  };
  return (
    <TableRow>
      <TableCell className="font-medium">{p.name}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{p.currencies}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{p.rails}</TableCell>
      <TableCell className="font-mono text-xs">{p.fn}</TableCell>
      <TableCell>
        {state === "ok" ? <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />Connected</Badge>
          : state === "err" ? <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />{msg.slice(0, 40)}</Badge>
          : <Badge variant="secondary">Not tested</Badge>}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="outline" size="sm" onClick={test} disabled={state === "loading"}>
          {state === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />}
          <span className="ml-1.5">Test</span>
        </Button>
      </TableCell>
    </TableRow>
  );
}

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
        <p className="mt-1 text-sm text-muted-foreground">Bank accounts, payouts, and connected USD/EUR/crypto provider rails.</p>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="rates">Buy rates</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
      <div className="rounded-xl border border-border bg-card">
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
        </TabsContent>

        <TabsContent value="payouts">
      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border font-medium">Recent payouts</div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>When</TableHead><TableHead>Merchant</TableHead><TableHead className="text-right">Amount</TableHead>
            <TableHead>Currency</TableHead><TableHead>Status</TableHead><TableHead>Timeline</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {(payouts.data || []).length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payouts</TableCell></TableRow>
            ) : (payouts.data || []).map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="text-xs">{p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</TableCell>
                <TableCell className="font-mono text-xs">{p.merchant_id?.slice(0,8)}</TableCell>
                <TableCell className="text-right font-medium">{Number(p.amount || 0).toFixed(2)}</TableCell>
                <TableCell>{p.currency || "—"}</TableCell>
                <TableCell><Badge variant={p.status === "paid" ? "default" : p.status === "failed" ? "destructive" : "secondary"}>{p.status || "pending"}</Badge></TableCell>
                <TableCell><PayoutTimeline payoutId={p.id} transactionId={p.transaction_id} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
        </TabsContent>

        <TabsContent value="providers">
          <div className="rounded-xl border border-border bg-card">
            <div className="p-4 border-b border-border font-medium flex items-center gap-2">
              <Plug className="h-4 w-4" /> Connected provider rails
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Provider</TableHead><TableHead>Currencies</TableHead><TableHead>Rails</TableHead>
                <TableHead>Edge function</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {PROVIDERS.map((p) => <ProviderRow key={p.id} p={p} />)}
              </TableBody>
            </Table>
            <div className="p-4 text-xs text-muted-foreground border-t">
              Add the provider's API key in Lovable Cloud secrets, then click <strong>Test</strong> to verify the connection.
              Required secrets: <code>DELOS_API_KEY</code>, <code>BRIGHTY_API_KEY</code>, <code>UNIT_API_KEY</code>, <code>CIRCLE_API_KEY</code>, <code>WALLETSUITE_API_KEY</code>. Elektropay already configured.
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rates">
          <div className="space-y-4">
            <CryptoUpsellRates />
            <div>
              <h3 className="text-sm font-semibold mb-2">Per-provider pricing breakdown</h3>
              <ProviderPricingBreakdown amount={100} markupPct={2.5} providers={["paywatcher","elektropay","delos","brighty","unit","circle"]} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
