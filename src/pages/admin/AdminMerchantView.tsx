import { AppLayout } from "@/components/AppLayout";
import { useStrategyMerchants } from "@/hooks/useProcessorStrategy";
import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import { motion } from "framer-motion";
import {
  Store, Search, Wallet, TrendingUp, Clock, Coins,
  ArrowDownRight, ArrowUpRight, ShieldCheck, Fuel, Banknote,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/ExportButton";

const FIAT_PROVIDERS = new Set([
  "shieldhub", "mondo", "matrix", "paygate10", "makapay",
  "payok", "stripe", "prometeo", "ofa", "lipad", "dcbank",
]);
const STABLECOINS = new Set(["USDT", "USDC", "DAI", "BUSD", "TUSD", "USDP", "PYUSD"]);

function fmt(n: number, ccy = "USD") {
  if (!isFinite(n)) n = 0;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 2 }).format(n);
}

function classifyMethod(row: any): "fiat" | "crypto" | "stablecoin" {
  const provider = String(row.provider || "").toLowerCase();
  const asset = String(row.asset || row.crypto_currency || row.currency || "").toUpperCase();
  if (row.__source === "crypto") return STABLECOINS.has(asset) ? "stablecoin" : "crypto";
  if (FIAT_PROVIDERS.has(provider)) return "fiat";
  if (STABLECOINS.has(asset)) return "stablecoin";
  return "fiat";
}

function StatusChip({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  const cls =
    s === "completed" || s === "settled" || s === "paid"
      ? "bg-primary/10 text-primary"
      : s === "failed" || s === "declined"
      ? "bg-destructive/10 text-destructive"
      : s === "pending" || s === "processing" || s === "in_transit"
      ? "bg-yellow-500/10 text-yellow-600"
      : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${cls}`}>
      {s || "unknown"}
    </span>
  );
}

function MethodChip({ kind, label }: { kind: "fiat" | "crypto" | "stablecoin"; label: string }) {
  const cls =
    kind === "fiat"
      ? "bg-accent text-accent-foreground"
      : kind === "stablecoin"
      ? "bg-primary/10 text-primary"
      : "bg-secondary text-secondary-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase ${cls}`}>
      {kind === "fiat" ? <Banknote className="h-3 w-3" /> : <Coins className="h-3 w-3" />}
      {label}
    </span>
  );
}

/** Donut showing Net Margin %. Uses semantic tokens only. */
function MarginDonut({ pct }: { pct: number }) {
  const safe = Math.max(0, Math.min(100, pct));
  const r = 56, c = 2 * Math.PI * r;
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="14" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke="hsl(var(--primary))" strokeWidth="14" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (safe / 100) * c}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Net margin</span>
        <span className="text-2xl font-bold font-mono text-foreground">{safe.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function useMerchantSettlementData(merchantId?: string | null) {
  return useQuery({
    enabled: !!merchantId,
    queryKey: ["merchant-settlements", merchantId],
    queryFn: async () => {
      const [txs, fees, cryptoPay, cryptoWd, commissions] = await Promise.all([
        extSelect("transactions", {
          filters: { merchant_id: merchantId },
          order: { column: "created_at", ascending: false },
          limit: 500,
        }).catch(() => []),
        extSelect("fee_breakdowns", {
          filters: { merchant_id: merchantId },
          order: { column: "created_at", ascending: false },
          limit: 500,
        }).catch(() => []),
        extSelect("elektropay_payments", {
          filters: { merchant_id: merchantId },
          order: { column: "created_at", ascending: false },
          limit: 200,
        }).catch(() => []),
        extSelect("elektropay_withdrawals", {
          filters: { merchant_id: merchantId },
          order: { column: "created_at", ascending: false },
          limit: 200,
        }).catch(() => []),
        extSelect("crypto_commissions", {
          filters: { merchant_id: merchantId },
          limit: 200,
        }).catch(() => []),
      ]);
      return { txs, fees, cryptoPay, cryptoWd, commissions };
    },
  });
}

export default function AdminMerchantView() {
  const { data: merchants = [] } = useStrategyMerchants();
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [strategy, setStrategy] = useState<"daily" | "weekly" | "custom">("daily");
  const [methodFilter, setMethodFilter] = useState<"all" | "fiat" | "crypto" | "stablecoin">("all");

  const filteredMerchants = useMemo(() => {
    if (!searchQuery) return merchants;
    const q = searchQuery.toLowerCase();
    return merchants.filter((m: any) =>
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.id?.toLowerCase().includes(q),
    );
  }, [merchants, searchQuery]);

  const merchant = merchants.find((m: any) => m.id === selectedMerchantId);
  const { data, isLoading } = useMerchantSettlementData(selectedMerchantId);

  const recon = useMemo(() => {
    const fees: any[] = data?.fees || [];
    const txs: any[] = data?.txs || [];
    const cryptoPay: any[] = data?.cryptoPay || [];
    const cryptoWd: any[] = data?.cryptoWd || [];

    const grossSettlement = fees.reduce((s, f) => s + Number(f.transaction_amount || 0), 0);
    const processingFees = fees.reduce((s, f) => s + Number(f.processor_fee || 0), 0);
    const everpayFees = fees.reduce((s, f) => s + Number(f.everpay_fee || 0), 0);
    const sponsorFees = fees.reduce((s, f) => s + Number(f.sponsor_fee || 0), 0);

    const fxSpreadEarned = txs.reduce((s, t) => {
      const amt = Number(t.amount || 0);
      const settle = Number(t.settlement_amount || 0);
      const fx = Number(t.fx_rate || 0);
      if (!fx || !settle || !amt) return s;
      return s + Math.max(0, settle - amt * fx);
    }, 0);

    const gasFees =
      cryptoWd.reduce((s, w) => s + Number(w.network_fee || w.fee || 0), 0) +
      cryptoPay.reduce((s, p) => s + Number(p.network_fee || 0), 0);

    const cryptoSpread =
      cryptoPay.reduce((s, p) => s + Number(p.everpay_fee || p.spread || 0), 0) +
      cryptoWd.reduce((s, w) => s + Number(w.everpay_fee || w.spread || 0), 0);

    const reserveHoldback = grossSettlement * 0.05;
    const commissionsEarned = everpayFees + cryptoSpread + fxSpreadEarned;
    const expectedNet =
      grossSettlement - processingFees - sponsorFees - gasFees - reserveHoldback;
    const netMarginPct = grossSettlement > 0 ? (commissionsEarned / grossSettlement) * 100 : 0;

    return {
      grossSettlement, processingFees, everpayFees, sponsorFees,
      fxSpreadEarned, gasFees, cryptoSpread, reserveHoldback,
      commissionsEarned, expectedNet, netMarginPct,
      txCount: fees.length, cryptoCount: cryptoPay.length + cryptoWd.length,
    };
  }, [data]);

  const settled24h = useMemo(() => {
    const since = Date.now() - 24 * 3600_000;
    return (data?.fees || [])
      .filter((f: any) => new Date(f.created_at).getTime() >= since)
      .reduce((s: number, f: any) => s + Number(f.transaction_amount || 0), 0);
  }, [data]);

  const pendingPayouts = useMemo(() => {
    const pending = (data?.txs || []).filter(
      (t: any) => ["pending", "processing"].includes(String(t.status).toLowerCase()),
    );
    return { amount: pending.reduce((s, t) => s + Number(t.amount || 0), 0), count: pending.length };
  }, [data]);

  /** Unified payout history rows (fiat + crypto). */
  const historyRows = useMemo(() => {
    const feeByTx = new Map<string, any>();
    for (const f of data?.fees || []) feeByTx.set(f.transaction_id, f);

    const fiatRows = (data?.txs || []).map((t: any) => {
      const f = feeByTx.get(t.id);
      return {
        __source: "fiat",
        id: t.id,
        created_at: t.created_at,
        provider: t.provider,
        amount: Number(t.amount || 0),
        currency: t.currency || "USD",
        fx_rate: Number(t.fx_rate || 0) || null,
        fees: f ? Number(f.processor_fee || 0) + Number(f.sponsor_fee || 0) : 0,
        spread: f ? Number(f.everpay_fee || 0) : 0,
        status: t.status,
        recipient: t.customer_email || t.description || "—",
      };
    });

    const cryptoRows = [
      ...(data?.cryptoPay || []).map((p: any) => ({
        __source: "crypto" as const,
        id: p.id,
        created_at: p.created_at,
        provider: "elektropay",
        asset: p.crypto_currency || p.asset_id,
        amount: Number(p.amount || 0),
        currency: p.fiat_currency || p.crypto_currency || "USD",
        fx_rate: Number(p.fx_rate || 0) || null,
        fees: Number(p.network_fee || 0),
        spread: Number(p.everpay_fee || p.spread || 0),
        status: p.status,
        recipient: p.customer_email || p.payer_email || "—",
      })),
      ...(data?.cryptoWd || []).map((w: any) => ({
        __source: "crypto" as const,
        id: w.id,
        created_at: w.created_at,
        provider: "elektropay",
        asset: w.asset_id,
        amount: Number(w.amount || 0),
        currency: w.asset_id || "USD",
        fx_rate: null,
        fees: Number(w.network_fee || w.fee || 0),
        spread: Number(w.everpay_fee || w.spread || 0),
        status: w.status,
        recipient: w.address || "—",
      })),
    ];

    const all = [...fiatRows, ...cryptoRows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    if (methodFilter === "all") return all;
    return all.filter((r) => classifyMethod(r) === methodFilter);
  }, [data, methodFilter]);

  const exportRows = historyRows.map((r) => ({
    id: r.id, date: r.created_at, method: classifyMethod(r), provider: r.provider,
    amount: r.amount, currency: r.currency, fx_rate: r.fx_rate ?? "",
    fees: r.fees, spread_earned: r.spread, status: r.status, recipient: r.recipient,
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Payouts &amp; Settlements</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Per-merchant drill-down: fiat &amp; crypto settlements, FX cost, spreads, gas, and commissions.
            </p>
          </div>
          {merchant && (
            <div className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-2">
              <Clock className="h-4 w-4 text-primary" />
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Next settlement</p>
                <p className="text-sm font-mono font-semibold text-foreground">
                  {strategy === "daily" ? "T+1 · 04:22:15" : strategy === "weekly" ? "Fri 00:00 UTC" : "Threshold"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Merchant picker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Select Merchant</label>
            <Select value={selectedMerchantId ?? ""} onValueChange={(v) => setSelectedMerchantId(v)}>
              <SelectTrigger className="w-full h-12 rounded-xl">
                <SelectValue placeholder="Choose a merchant…" />
              </SelectTrigger>
              <SelectContent>
                {merchants.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2">
                      <Store className="h-3.5 w-3.5 text-muted-foreground" />
                      {m.name}
                      <span className="text-muted-foreground text-[10px] ml-1">
                        {m.email || m.id.slice(0, 8)}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Search Merchants</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-12 rounded-xl"
              />
            </div>
          </div>
        </div>

        {!merchant ? (
          <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
            <Store className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Select a merchant above to drill into settlements &amp; payouts.
            </p>

            <div className="mt-8 text-left">
              <h3 className="text-sm font-semibold mb-3 text-foreground">
                Merchants ({filteredMerchants.length})
              </h3>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40">
                    <tr className="text-muted-foreground">
                      <th className="text-left py-2 px-3 font-medium">Merchant</th>
                      <th className="text-left py-2 px-3 font-medium">Region</th>
                      <th className="text-left py-2 px-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMerchants.map((m: any) => (
                      <tr
                        key={m.id}
                        className="border-t cursor-pointer hover:bg-muted/40"
                        onClick={() => setSelectedMerchantId(m.id)}
                      >
                        <td className="py-2.5 px-3 font-medium text-foreground">{m.name}</td>
                        <td className="py-2.5 px-3 text-foreground">{m.region || "GLOBAL"}</td>
                        <td className="py-2.5 px-3">
                          <StatusChip status={m.status || "active"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Merchant header */}
            <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{merchant.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {merchant.region || "GLOBAL"} · {merchant.currency || "USD"}
                  {merchant.email && <span className="ml-2">· {merchant.email}</span>}
                </p>
              </div>
              <div className="ml-auto">
                <StatusChip status={merchant.status || "active"} />
              </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border bg-card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Pending Payouts</p>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-3 text-2xl font-bold font-mono text-foreground">
                  {fmt(pendingPayouts.amount, merchant.currency || "USD")}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {pendingPayouts.count} transaction{pendingPayouts.count === 1 ? "" : "s"} awaiting
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Total Settled (24h)</p>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-3 text-2xl font-bold font-mono text-foreground">
                  {fmt(settled24h, merchant.currency || "USD")}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {recon.txCount} fiat · {recon.cryptoCount} crypto items
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Settlement Strategy</p>
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1">
                  {(["daily", "weekly", "custom"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setStrategy(opt)}
                      className={`rounded-lg px-2 py-2 text-xs font-medium capitalize transition ${
                        strategy === opt
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reconciliation + Reserve */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Financial Reconciliation</h3>
                    <p className="text-xs text-muted-foreground">
                      Net vs Gross — including FX spread, gas &amp; commissions
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
                  <MarginDonut pct={recon.netMarginPct} />
                  <div className="space-y-2">
                    {[
                      { label: "Gross Settlement", value: fmt(recon.grossSettlement), kind: "neutral" },
                      { label: "Processing Fees", value: `-${fmt(recon.processingFees)}`, kind: "neg" },
                      { label: "Sponsor / Acquirer Fees", value: `-${fmt(recon.sponsorFees)}`, kind: "neg" },
                      { label: "FX Spread Earned (Everpay)", value: `+${fmt(recon.fxSpreadEarned)}`, kind: "pos" },
                      { label: "Network / Gas Fees", value: `-${fmt(recon.gasFees)}`, kind: "neg", icon: Fuel },
                      { label: "Crypto Spread Earned", value: `+${fmt(recon.cryptoSpread)}`, kind: "pos" },
                      { label: "Reserve Hold-back (5%)", value: `-${fmt(recon.reserveHoldback)}`, kind: "neg" },
                      { label: "Commissions Earned (total)", value: fmt(recon.commissionsEarned), kind: "highlight" },
                    ].map((r: any) => (
                      <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                          {r.icon ? <r.icon className="h-3 w-3" /> : null}{r.label}
                        </span>
                        <span className={`text-sm font-mono font-medium ${
                          r.kind === "pos" ? "text-primary" :
                          r.kind === "neg" ? "text-destructive" :
                          r.kind === "highlight" ? "text-primary font-bold" : "text-foreground"
                        }`}>{r.value}</span>
                      </div>
                    ))}
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Expected Net
                      </span>
                      <span className="text-lg font-mono font-bold text-primary">{fmt(recon.expectedNet)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground">Liquidity &amp; Reserve</h3>
                <p className="text-xs text-muted-foreground">Merchant float &amp; risk exposure</p>

                <div className="mt-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="uppercase tracking-wider text-muted-foreground">Liquidity Reserve</span>
                      <span className="font-mono text-foreground">82%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: "82%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="uppercase tracking-wider text-muted-foreground">Risk Exposure</span>
                      <span className="font-mono text-foreground">Low</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary/60" style={{ width: "22%" }} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Reserve Balance</p>
                  <p className="mt-1 text-xl font-mono font-bold text-foreground">{fmt(recon.reserveHoldback)}</p>
                </div>
                <Button variant="outline" className="mt-3 w-full" disabled>
                  Withdraw to Vault
                </Button>
              </div>
            </div>

            {/* Payout history */}
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Payout History</h3>
                  <p className="text-xs text-muted-foreground">
                    Fiat &amp; crypto settlements with FX, fees and spreads earned
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-xl border p-0.5 bg-muted/30">
                    {(["all", "fiat", "crypto", "stablecoin"] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setMethodFilter(opt)}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-medium capitalize transition ${
                          methodFilter === opt
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <ExportButton
                    data={exportRows}
                    filename={`payouts-${merchant.name.replace(/\s+/g, "-").toLowerCase()}`}
                  />
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 px-2 font-medium">Transaction ID</th>
                      <th className="text-left py-2 px-2 font-medium">Date</th>
                      <th className="text-left py-2 px-2 font-medium">Method</th>
                      <th className="text-left py-2 px-2 font-medium">Recipient</th>
                      <th className="text-right py-2 px-2 font-medium">Amount</th>
                      <th className="text-right py-2 px-2 font-medium">FX</th>
                      <th className="text-right py-2 px-2 font-medium">Fees</th>
                      <th className="text-right py-2 px-2 font-medium">Spread</th>
                      <th className="text-left py-2 px-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && (
                      <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">Loading…</td></tr>
                    )}
                    {!isLoading && historyRows.length === 0 && (
                      <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">
                        No payouts found for this filter.
                      </td></tr>
                    )}
                    {historyRows.slice(0, 50).map((r: any) => {
                      const kind = classifyMethod(r);
                      const label = kind === "fiat" ? (r.provider || "fiat") : (r.asset || "crypto");
                      return (
                        <tr key={`${r.__source}-${r.id}`} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2.5 px-2 font-mono text-[11px] text-primary">
                            #{String(r.id).slice(0, 10)}
                          </td>
                          <td className="py-2.5 px-2 text-foreground">
                            {new Date(r.created_at).toLocaleString("en-US", {
                              month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
                            })}
                          </td>
                          <td className="py-2.5 px-2"><MethodChip kind={kind} label={String(label)} /></td>
                          <td className="py-2.5 px-2 text-foreground truncate max-w-[160px]">{r.recipient}</td>
                          <td className="py-2.5 px-2 text-right font-mono text-foreground">
                            {fmt(r.amount, r.currency)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">
                            {r.fx_rate ? r.fx_rate.toFixed(4) : "—"}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-destructive">
                            {r.fees ? `-${fmt(r.fees, r.currency)}` : "—"}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-primary">
                            {r.spread ? `+${fmt(r.spread, r.currency)}` : "—"}
                          </td>
                          <td className="py-2.5 px-2"><StatusChip status={r.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {historyRows.length > 50 && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Showing 50 of {historyRows.length} entries — use Export for the full set.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
