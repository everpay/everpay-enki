import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Wallet, Coins, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const refresh = async () => {
    setLoading(true);
    const all: Balance[] = [];
    await Promise.all(PROVIDERS.map(async (p) => {
      try {
        const { data, error } = await supabase.functions.invoke(p.fn, { body: { action: "balances" } });
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

    // Add internal ledger balance
    const { data: ledgerRows } = await supabase
      .from("ledger_entries" as any).select("currency, amount, direction").limit(10000);
    if (ledgerRows) {
      const sums = new Map<string, number>();
      for (const r of ledgerRows as any[]) {
        const cur = (r.currency || "USD").toUpperCase();
        const sign = r.direction === "credit" ? 1 : -1;
        sums.set(cur, (sums.get(cur) || 0) + sign * Number(r.amount || 0));
      }
      for (const [cur, amt] of sums) {
        all.push({ provider: "ledger", label: "Internal ledger", currency: cur, amount: amt, type: "ledger" });
      }
    }
    setRows(all);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const grouped = rows.reduce((acc, r) => {
    acc[r.currency] = (acc[r.currency] || 0) + r.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> All balances</h2>
          <p className="text-xs text-muted-foreground">Live aggregated across Delos, Unit, Circle, Walletster, Elektropay, PayWatcher + internal ledger.</p>
        </div>
        <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="ml-1.5">Refresh</span>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(grouped).map(([cur, amt]) => (
          <Card key={cur} className="p-4 rounded-2xl">
            <div className="text-xs uppercase text-muted-foreground">{cur}</div>
            <div className="mt-1 text-2xl font-semibold font-mono">{amt.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Sum across all rails</div>
          </Card>
        ))}
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
    </div>
  );
}