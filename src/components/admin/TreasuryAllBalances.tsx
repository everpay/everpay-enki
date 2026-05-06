import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Wallet, Coins, Landmark, ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";

type Balance = {
  provider: string;
  label: string;
  currency: string;
  amount: number;
  network?: string;
  type: "fiat" | "crypto" | "ledger";
  error?: string;
};

const PROVIDERS = [
  { id: "delos",       fn: "delos-banking",       type: "fiat"   as const, label: "Delos USD/EUR" },
  { id: "unit",        fn: "unit-rtp",            type: "fiat"   as const, label: "Unit USD" },
  { id: "circle",      fn: "circle-wallets",      type: "crypto" as const, label: "Circle USDC" },
  { id: "walletsuite", fn: "walletsuite-wallets", type: "crypto" as const, label: "Walletster" },
  { id: "elektropay",  fn: "elektropay-proxy",    type: "crypto" as const, label: "Elektropay" },
  { id: "paywatcher",  fn: "paywatcher-payments", type: "crypto" as const, label: "PayWatcher BASE/USDC" },
];

function parseBalance(provider: string, data: any): Balance[] {
  if (!data) return [];
  const out: Balance[] = [];
  // Heuristic: providers return {balances:[...]}, {wallets:[...]}, or {available:n,currency:'USD'}
  const lists = [data.balances, data.wallets, data.accounts].filter(Array.isArray);
  for (const list of lists) {
    for (const w of list) {
      out.push({
        provider,
        label: w.label || w.name || w.account_id || provider,
        currency: (w.currency || w.asset || "USD").toUpperCase(),
        amount: Number(w.balance ?? w.available ?? w.amount ?? 0),
        network: w.network || w.chain,
        type: ["USDC","USDT","BTC","ETH"].includes((w.currency||w.asset||"").toUpperCase()) ? "crypto" : "fiat",
      });
    }
  }
  if (out.length === 0 && (data.available != null || data.balance != null)) {
    out.push({
      provider, label: provider,
      currency: (data.currency || "USD").toUpperCase(),
      amount: Number(data.available ?? data.balance ?? 0),
      type: data.network ? "crypto" : "fiat",
      network: data.network,
    });
  }
  return out;
}

export function TreasuryAllBalances() {
  const [rows, setRows] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [openCurrency, setOpenCurrency] = useState<string | null>(null);
  const [, force] = useState(0);
  const [drillProvider, setDrillProvider] = useState<{ provider: string; currency: string } | null>(null);
  const [drillData, setDrillData] = useState<{ raw: any; txs: any[]; entries: any[] } | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const rawProviderResp = useRef<Record<string, any>>({});

  const refresh = async () => {
    setLoading(true);
    const all: Balance[] = [];
    await Promise.all(PROVIDERS.map(async (p) => {
      try {
        const { data, error } = await supabase.functions.invoke(p.fn, { body: { action: "balances" } });
        rawProviderResp.current[p.id] = error ? { error: error.message } : data;
        if (error || data?.error) {
          all.push({ provider: p.id, label: p.label, currency: "—", amount: 0, type: p.type, error: error?.message || data?.error });
          return;
        }
        const parsed = parseBalance(p.id, data);
        if (parsed.length === 0) all.push({ provider: p.id, label: p.label, currency: "—", amount: 0, type: p.type, error: "no balance returned" });
        else all.push(...parsed);
      } catch (e: any) {
        all.push({ provider: p.id, label: p.label, currency: "—", amount: 0, type: p.type, error: e.message });
      }
    }));

    // Add internal ledger balance — schema uses entry_type (debit/credit) and signed amount.
    const { data: ledgerRows } = await supabase
      .from("ledger_entries" as any).select("currency, amount, entry_type").limit(10000);
    if (ledgerRows) {
      const sums = new Map<string, number>();
      for (const r of ledgerRows as any[]) {
        const cur = (r.currency || "USD").toUpperCase();
        // amount is already signed in our writer; fall back to entry_type sign for legacy rows.
        const v = Number(r.amount || 0);
        const signed = v !== 0 ? v : (r.entry_type === "credit" ? 1 : -1);
        sums.set(cur, (sums.get(cur) || 0) + signed);
      }
      for (const [cur, amt] of sums) {
        all.push({ provider: "ledger", label: "Internal ledger", currency: cur, amount: amt, type: "ledger" });
      }
    }
    setRows(all);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000); // auto-refresh 30s
    const tick = setInterval(() => force((n) => n + 1), 15_000); // re-render "x ago"
    const channel = supabase
      .channel("treasury-ledger-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ledger_entries" }, () => refresh())
      .subscribe();
    return () => { clearInterval(interval); clearInterval(tick); supabase.removeChannel(channel); };
  }, []);

  const grouped = rows.reduce((acc, r) => {
    acc[r.currency] = (acc[r.currency] || 0) + r.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> All balances</h2>
          <p className="text-xs text-muted-foreground">
            Live aggregated across Delos, Unit, Circle, Walletster, Elektropay, PayWatcher + internal ledger.
            {lastUpdated && <> · Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</>}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="ml-1.5">Refresh</span>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loading && rows.length === 0 && Array.from({ length: 4 }).map((_, i) => (
          <Card key={`sk-${i}`} className="p-4 rounded-2xl"><Skeleton className="h-3 w-12" /><Skeleton className="h-7 w-24 mt-2" /><Skeleton className="h-3 w-20 mt-2" /></Card>
        ))}
        {Object.entries(grouped).map(([cur, amt]) => {
          const breakdown = rows.filter(r => r.currency === cur);
          const open = openCurrency === cur;
          return (
            <Collapsible key={cur} open={open} onOpenChange={(o) => setOpenCurrency(o ? cur : null)} asChild>
              <Card className="p-4 rounded-2xl cursor-pointer hover:border-primary/40 transition">
                <CollapsibleTrigger className="w-full text-left">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase text-muted-foreground">{cur}</div>
                    {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </div>
                  <div className="mt-1 text-2xl font-semibold font-mono">{amt.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{breakdown.length} provider{breakdown.length === 1 ? "" : "s"}</div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-1.5 border-t border-border pt-3">
                  {breakdown.map((b, i) => (
                    <div key={`${b.provider}-${i}`} className="flex items-center justify-between text-xs">
                      <span className="capitalize text-muted-foreground">{b.provider}{b.network ? ` · ${b.network}` : ""}</span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setDrillProvider({ provider: b.provider, currency: b.currency });
                          setDrillLoading(true);
                          const raw = rawProviderResp.current[b.provider];
                          const [txRes, leRes] = await Promise.all([
                            supabase.from("transactions").select("id, provider, provider_ref, amount, currency, status, created_at").eq("provider", b.provider).eq("currency", b.currency).order("created_at", { ascending: false }).limit(50),
                            supabase.from("ledger_entries" as any).select("id, transaction_id, entry_type, amount, currency, created_at").eq("currency", b.currency).order("created_at", { ascending: false }).limit(50),
                          ]);
                          setDrillData({ raw, txs: txRes.data || [], entries: (leRes.data as any[]) || [] });
                          setDrillLoading(false);
                        }}
                        className="font-mono hover:underline inline-flex items-center gap-1"
                        title="Open raw provider response + matched transactions/ledger entries">
                        {b.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </button>
                    </div>
                  ))}
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
        {Object.keys(grouped).length === 0 && !loading && (
          <Card className="p-4 rounded-2xl col-span-full text-center text-sm text-muted-foreground">No balances available — connect provider API keys.</Card>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {rows.map((r, i) => (
          <div key={`${r.provider}-${r.currency}-${i}`} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {r.type === "crypto" ? <Coins className="h-4 w-4 text-primary" /> : <Landmark className="h-4 w-4 text-primary" />}
              <div>
                <div className="text-sm font-medium">{r.label}</div>
                <div className="text-[11px] text-muted-foreground capitalize">
                  {r.provider} {r.network ? `· ${r.network}` : ""}
                </div>
              </div>
            </div>
            <div className="text-right">
              {r.error ? (
                <Badge variant="destructive" className="text-[10px]">{r.error.slice(0, 32)}</Badge>
              ) : (
                <div className="font-mono text-sm">
                  {r.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-muted-foreground">{r.currency}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!drillProvider} onOpenChange={(o) => { if (!o) { setDrillProvider(null); setDrillData(null); } }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">{drillProvider?.provider} · {drillProvider?.currency} drill-down</DialogTitle>
          </DialogHeader>
          {drillLoading ? <Skeleton className="h-40 w-full" /> : (
            <div className="space-y-4 text-xs">
              <div>
                <div className="font-medium mb-1">Raw provider balance response</div>
                <pre className="bg-muted/40 rounded-lg p-3 overflow-auto max-h-60">{JSON.stringify(drillData?.raw, null, 2)}</pre>
              </div>
              <div>
                <div className="font-medium mb-1">Recent transactions ({drillData?.txs.length || 0})</div>
                <div className="rounded-lg border border-border divide-y divide-border max-h-60 overflow-auto">
                  {(drillData?.txs || []).map((t) => (
                    <div key={t.id} className="px-3 py-2 flex items-center justify-between">
                      <span className="font-mono">{t.provider_ref || t.id.slice(0,8)}</span>
                      <span><Badge variant="outline" className="mr-2">{t.status}</Badge>{Number(t.amount).toLocaleString()} {t.currency}</span>
                    </div>
                  ))}
                  {(drillData?.txs || []).length === 0 && <div className="px-3 py-4 text-muted-foreground text-center">No transactions</div>}
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">Ledger entries ({drillData?.entries.length || 0})</div>
                <div className="rounded-lg border border-border divide-y divide-border max-h-60 overflow-auto">
                  {(drillData?.entries || []).map((e: any) => (
                    <div key={e.id} className="px-3 py-2 flex items-center justify-between">
                      <span className="font-mono">{e.entry_type}</span>
                      <span>{Number(e.amount).toLocaleString()} {e.currency}</span>
                    </div>
                  ))}
                  {(drillData?.entries || []).length === 0 && <div className="px-3 py-4 text-muted-foreground text-center">No ledger entries</div>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}