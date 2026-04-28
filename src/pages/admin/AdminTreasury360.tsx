import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Landmark, Wallet, ArrowUpRight, DollarSign, Bitcoin, Activity } from "lucide-react";

const fmt = (n: number, c = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 2 }).format(n || 0);
  } catch {
    return `${(n || 0).toFixed(2)} ${c}`;
  }
};

function sumByCurrency<T extends Record<string, any>>(rows: T[], amountKey = "balance", currencyKey = "currency") {
  const map = new Map<string, number>();
  for (const r of rows || []) {
    const cur = (r?.[currencyKey] || "USD").toString().toUpperCase();
    map.set(cur, (map.get(cur) || 0) + Number(r?.[amountKey] || 0));
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

export default function AdminTreasury360() {
  const { isAdmin, isSuperAdmin, isLoading } = useAccessControl();

  const accounts = useQuery({
    queryKey: ["t360-accounts"],
    queryFn: () => extSelect("accounts", { limit: 5000 }),
  });
  const wallets = useQuery({
    queryKey: ["t360-wallets"],
    queryFn: () => extSelect("wallets", { limit: 5000 }).catch(() => []),
  });
  const cryptoWallets = useQuery({
    queryKey: ["t360-crypto-wallets"],
    queryFn: () => extSelect("crypto_wallets", { limit: 5000 }).catch(() => []),
  });
  const liquidity = useQuery({
    queryKey: ["t360-liquidity"],
    queryFn: () => extSelect("liquidity_pools", { limit: 500 }).catch(() => []),
  });
  const settlements = useQuery({
    queryKey: ["t360-settlements"],
    queryFn: () =>
      extSelect("settlement_batches", { order: { column: "created_at", ascending: false }, limit: 50 }).catch(() => []),
  });
  const payouts = useQuery({
    queryKey: ["t360-payouts"],
    queryFn: () =>
      extSelect("payouts", { order: { column: "created_at", ascending: false }, limit: 50 }).catch(() => []),
  });
  const reserves = useQuery({
    queryKey: ["t360-reserves"],
    queryFn: () => extSelect("rolling_reserves", { limit: 500 }).catch(() => []),
  });

  if (isLoading) return <AppLayout><div className="p-6">Loading…</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  const fiatBalances = sumByCurrency((accounts.data || []) as any[], "balance", "currency");
  const fiatAvailable = sumByCurrency((accounts.data || []) as any[], "available_balance", "currency");
  const fiatPending = sumByCurrency((accounts.data || []) as any[], "pending_balance", "currency");
  const cryptoBalances = sumByCurrency((cryptoWallets.data || []) as any[], "balance", "asset");
  const liquidityByCurrency = sumByCurrency((liquidity.data || []) as any[], "balance", "currency");
  const reservesByCurrency = sumByCurrency((reserves.data || []) as any[], "amount", "currency");

  const totalFiat = fiatBalances.reduce((s, [, v]) => s + v, 0);
  const totalReserves = reservesByCurrency.reduce((s, [, v]) => s + v, 0);
  const totalLiquidity = liquidityByCurrency.reduce((s, [, v]) => s + v, 0);
  const totalCryptoAssets = cryptoBalances.length;

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="h-5 w-5" /> Treasury 360°
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Unified view of liquidity, fiat & crypto balances, settlements, payouts, reserves, and merchant wallets.
          </p>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Fiat balance (USD eq.)</CardDescription>
            <CardTitle className="text-2xl">{fmt(totalFiat)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{(accounts.data || []).length} accounts</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><Activity className="h-4 w-4" /> Liquidity pools</CardDescription>
            <CardTitle className="text-2xl">{fmt(totalLiquidity)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{(liquidity.data || []).length} pools</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Rolling reserves</CardDescription>
            <CardTitle className="text-2xl">{fmt(totalReserves)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{(reserves.data || []).length} entries</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><Bitcoin className="h-4 w-4" /> Crypto assets</CardDescription>
            <CardTitle className="text-2xl">{totalCryptoAssets}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{(cryptoWallets.data || []).length} wallets</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="balances">
        <TabsList>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity & FX</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="crypto">Crypto Wallets</TabsTrigger>
          <TabsTrigger value="reserves">Reserves</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Total by currency</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {fiatBalances.length === 0 ? <p className="text-muted-foreground">No accounts.</p> :
                  fiatBalances.map(([c, v]) => (
                    <div key={c} className="flex justify-between"><span className="font-mono">{c}</span><span className="font-medium">{fmt(v, c)}</span></div>
                  ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Available</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {fiatAvailable.map(([c, v]) => (
                  <div key={c} className="flex justify-between"><span className="font-mono">{c}</span><span className="font-medium text-emerald-600">{fmt(v, c)}</span></div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Pending / Reserved</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {fiatPending.map(([c, v]) => (
                  <div key={c} className="flex justify-between"><span className="font-mono">{c}</span><span className="font-medium text-amber-600">{fmt(v, c)}</span></div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Merchant accounts</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Merchant</TableHead><TableHead>Currency</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(accounts.data || []).slice(0, 100).map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.merchant_id?.slice(0, 8)}</TableCell>
                      <TableCell className="font-mono">{a.currency}</TableCell>
                      <TableCell className="text-right">{fmt(a.balance, a.currency)}</TableCell>
                      <TableCell className="text-right text-emerald-600">{fmt(a.available_balance, a.currency)}</TableCell>
                      <TableCell className="text-right text-amber-600">{fmt(a.pending_balance, a.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liquidity" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Liquidity pools</CardTitle></CardHeader>
            <CardContent>
              {(liquidity.data || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No liquidity pools configured.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Provider</TableHead><TableHead>Currency</TableHead>
                    <TableHead className="text-right">Balance</TableHead><TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(liquidity.data || []).map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.provider || p.name || "—"}</TableCell>
                        <TableCell className="font-mono">{p.currency}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(p.balance, p.currency)}</TableCell>
                        <TableCell><Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Active" : "Idle"}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Recent settlement batches</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>When</TableHead><TableHead>Merchant</TableHead>
                  <TableHead className="text-right">Amount</TableHead><TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(settlements.data || []).length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No settlements</TableCell></TableRow>
                  ) : (settlements.data || []).map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs">{s.created_at ? new Date(s.created_at).toLocaleString() : "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{s.merchant_id?.slice(0, 8)}</TableCell>
                      <TableCell className="text-right">{fmt(s.amount, s.currency)}</TableCell>
                      <TableCell className="font-mono">{s.currency}</TableCell>
                      <TableCell><Badge variant={s.status === "settled" || s.status === "paid" ? "default" : s.status === "failed" ? "destructive" : "secondary"}>{s.status || "pending"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><ArrowUpRight className="h-4 w-4" /> Recent payouts</CardTitle>
              <CardDescription>To merchants, resellers, and recipients.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>When</TableHead><TableHead>Destination</TableHead>
                  <TableHead className="text-right">Amount</TableHead><TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(payouts.data || []).length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payouts</TableCell></TableRow>
                  ) : (payouts.data || []).map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</TableCell>
                      <TableCell className="font-mono text-xs truncate max-w-[200px]">{p.destination || p.merchant_id?.slice(0, 8) || "—"}</TableCell>
                      <TableCell className="text-right">{fmt(p.amount, p.currency)}</TableCell>
                      <TableCell className="font-mono">{p.currency}</TableCell>
                      <TableCell><Badge variant={p.status === "paid" ? "default" : p.status === "failed" ? "destructive" : "secondary"}>{p.status || "pending"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crypto" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Holdings by asset</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {cryptoBalances.length === 0 ? <p className="text-muted-foreground">No crypto wallets.</p> :
                  cryptoBalances.map(([asset, bal]) => (
                    <div key={asset} className="flex justify-between">
                      <span className="font-mono">{asset}</span>
                      <span className="font-medium">{Number(bal).toFixed(8)}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Wallets</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {(cryptoWallets.data || []).length} wallets across {cryptoBalances.length} distinct assets.
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Merchant</TableHead><TableHead>Asset</TableHead>
                  <TableHead>Network</TableHead><TableHead>Address</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(cryptoWallets.data || []).slice(0, 100).map((w: any) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-mono text-xs">{w.merchant_id?.slice(0, 8)}</TableCell>
                      <TableCell className="font-mono">{w.asset || w.currency}</TableCell>
                      <TableCell>{w.network || "—"}</TableCell>
                      <TableCell className="font-mono text-xs truncate max-w-[200px]">{w.address || "—"}</TableCell>
                      <TableCell className="text-right">{Number(w.balance || 0).toFixed(8)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reserves" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Rolling reserves by currency</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {reservesByCurrency.length === 0 ? <p className="text-muted-foreground">No active reserves.</p> :
                reservesByCurrency.map(([c, v]) => (
                  <div key={c} className="flex justify-between"><span className="font-mono">{c}</span><span className="font-medium">{fmt(v, c)}</span></div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}