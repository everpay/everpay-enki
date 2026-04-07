import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, DollarSign, ArrowUpDown, Settings2, RefreshCw, Percent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function AdminFxTreasury() {
  const queryClient = useQueryClient();
  const [spreadBps, setSpreadBps] = useState("100");
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);

  // FX Revenue Logs
  const { data: fxRevenue } = useQuery({
    queryKey: ["admin-fx-revenue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fx_revenue_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  // Treasury Accounts
  const { data: treasuryAccounts } = useQuery({
    queryKey: ["admin-treasury-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treasury_accounts")
        .select("*")
        .order("currency");
      if (error) throw error;
      return data || [];
    },
  });

  // Treasury Movements
  const { data: movements } = useQuery({
    queryKey: ["admin-treasury-movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treasury_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // FX Rates
  const { data: fxRates } = useQuery({
    queryKey: ["admin-fx-rates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fx_rates")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  // Merchants for spread config
  const { data: merchants } = useQuery({
    queryKey: ["admin-merchants-fx"],
    queryFn: async () => {
      const { data, error } = await supabase.from("merchants").select("id, name").limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  // Merchant FX Settings
  const { data: merchantFxSettings } = useQuery({
    queryKey: ["merchant-fx-settings", selectedMerchant],
    queryFn: async () => {
      if (!selectedMerchant) return null;
      const { data } = await supabase
        .from("merchant_fx_settings")
        .select("*")
        .eq("merchant_id", selectedMerchant)
        .single();
      return data;
    },
    enabled: !!selectedMerchant,
  });

  // Rebalance mutation
  const rebalanceMutation = useMutation({
    mutationFn: async (dryRun: boolean) => {
      const { data, error } = await supabase.functions.invoke("treasury-rebalance", {
        body: { dry_run: dryRun },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.dry_run) {
        toast.info(`Dry run: ${data.movements?.length || 0} movements would be executed`);
      } else {
        toast.success(`Rebalanced: ${data.movements?.length || 0} movements executed`);
        queryClient.invalidateQueries({ queryKey: ["admin-treasury"] });
      }
    },
  });

  // Update FX rates
  const updateRatesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("fx-rate-updater");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Updated ${data.pairs_updated} FX rate pairs`);
      queryClient.invalidateQueries({ queryKey: ["admin-fx-rates"] });
    },
  });

  // KPIs
  const totalRevenue = fxRevenue?.reduce((s, r) => s + (r.revenue_amount || 0), 0) || 0;
  const totalVolume = fxRevenue?.reduce((s, r) => s + (r.amount || 0), 0) || 0;
  const avgSpread = fxRevenue?.length
    ? fxRevenue.reduce((s, r) => s + (r.spread_bps || 0), 0) / fxRevenue.length
    : 0;
  const totalLiquidity = treasuryAccounts?.reduce((s, a) => s + (a.balance || 0), 0) || 0;

  // Revenue by currency chart
  const revByCurrency: Record<string, number> = {};
  fxRevenue?.forEach((r) => {
    const key = `${r.base_currency}→${r.quote_currency}`;
    revByCurrency[key] = (revByCurrency[key] || 0) + (r.revenue_amount || 0);
  });
  const revChartData = Object.entries(revByCurrency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([pair, revenue]) => ({ pair, revenue: Math.round(revenue * 100) / 100 }));

  // Daily revenue trend
  const dailyRev: Record<string, number> = {};
  fxRevenue?.forEach((r) => {
    const day = format(new Date(r.created_at), "MMM d");
    dailyRev[day] = (dailyRev[day] || 0) + (r.revenue_amount || 0);
  });
  const dailyRevData = Object.entries(dailyRev).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
  }));

  // Treasury by type
  const byType: Record<string, number> = {};
  treasuryAccounts?.forEach((a) => {
    const type = a.liquidity_type || "hot";
    byType[type] = (byType[type] || 0) + (a.balance || 0);
  });
  const typeChartData = Object.entries(byType).map(([name, value]) => ({ name, value }));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">FX & Treasury Management</h1>
            <p className="text-sm text-muted-foreground">
              Monitor FX spread revenue, manage treasury liquidity, and configure spreads
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => updateRatesMutation.mutate()}
              disabled={updateRatesMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 ${updateRatesMutation.isPending ? "animate-spin" : ""}`} />
              Update Rates
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => rebalanceMutation.mutate(true)}
              disabled={rebalanceMutation.isPending}
            >
              <ArrowUpDown className="h-4 w-4" /> Dry Run
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => rebalanceMutation.mutate(false)}
              disabled={rebalanceMutation.isPending}
            >
              <ArrowUpDown className="h-4 w-4" /> Rebalance Now
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">FX Revenue</p>
                  <p className="text-xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">FX Volume</p>
                  <p className="text-xl font-bold text-foreground">${totalVolume.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Percent className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Spread</p>
                  <p className="text-xl font-bold text-foreground">{avgSpread.toFixed(0)} bps</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ArrowUpDown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Liquidity</p>
                  <p className="text-xl font-bold text-foreground">${totalLiquidity.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="revenue">
          <TabsList>
            <TabsTrigger value="revenue">FX Revenue</TabsTrigger>
            <TabsTrigger value="treasury">Treasury</TabsTrigger>
            <TabsTrigger value="spreads">Spread Config</TabsTrigger>
            <TabsTrigger value="movements">Movements</TabsTrigger>
            <TabsTrigger value="rates">Live Rates</TabsTrigger>
          </TabsList>

          {/* FX Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Revenue by Currency Pair</CardTitle>
                </CardHeader>
                <CardContent>
                  {revChartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No FX revenue data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={revChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="pair" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Daily Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyRevData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={dailyRevData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                          }}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Revenue Log Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent FX Revenue Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Date</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Pair</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">Amount</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">Mid Rate</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">Applied</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">Spread</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(fxRevenue || []).slice(0, 20).map((r) => (
                        <tr key={r.id} className="border-t border-border">
                          <td className="px-3 py-2 text-muted-foreground text-xs">
                            {format(new Date(r.created_at), "MMM d, HH:mm")}
                          </td>
                          <td className="px-3 py-2 font-medium text-foreground">
                            {r.base_currency}→{r.quote_currency}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-foreground">
                            ${(r.amount || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-foreground">
                            {(r.mid_market_rate || 0).toFixed(4)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-foreground">
                            {(r.applied_rate || 0).toFixed(4)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Badge variant="secondary">{r.spread_bps} bps</Badge>
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-500">
                            ${(r.revenue_amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {(!fxRevenue || fxRevenue.length === 0) && (
                        <tr>
                          <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                            No FX revenue logged yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Treasury Tab */}
          <TabsContent value="treasury" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm">Liquidity by Currency</CardTitle>
                </CardHeader>
                <CardContent>
                  {!treasuryAccounts?.length ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No treasury accounts</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={treasuryAccounts.map((a) => ({
                          name: `${a.currency} (${a.liquidity_type || "hot"})`,
                          balance: a.balance || 0,
                          threshold: a.min_threshold || 0,
                          target: a.target_balance || 0,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                          }}
                        />
                        <Bar dataKey="balance" fill="hsl(var(--primary))" name="Balance" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="threshold" fill="hsl(var(--destructive))" name="Min Threshold" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="target" fill="hsl(var(--chart-3))" name="Target" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Liquidity Pool Types</CardTitle>
                </CardHeader>
                <CardContent>
                  {typeChartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={typeChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                        >
                          {typeChartData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Treasury Accounts Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Treasury Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Currency</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Region</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Type</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">Balance</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">Min Threshold</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">Target</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(treasuryAccounts || []).map((a) => {
                        const belowMin = (a.balance || 0) < (a.min_threshold || 0);
                        return (
                          <tr key={a.id} className="border-t border-border">
                            <td className="px-3 py-2 font-semibold text-foreground">{a.currency}</td>
                            <td className="px-3 py-2 text-muted-foreground">{a.region || "Global"}</td>
                            <td className="px-3 py-2">
                              <Badge
                                variant={
                                  a.liquidity_type === "hot"
                                    ? "default"
                                    : a.liquidity_type === "warm"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {a.liquidity_type || "hot"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-foreground">
                              ${(a.balance || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                              ${(a.min_threshold || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                              ${(a.target_balance || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant={belowMin ? "destructive" : "default"}>
                                {belowMin ? "Below Min" : "Healthy"}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spread Config Tab */}
          <TabsContent value="spreads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings2 className="h-4 w-4" /> Merchant Spread Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Select Merchant</Label>
                    <select
                      className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      value={selectedMerchant || ""}
                      onChange={(e) => setSelectedMerchant(e.target.value || null)}
                    >
                      <option value="">Choose merchant…</option>
                      {merchants?.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Default Spread (basis points)</Label>
                    <Input
                      type="number"
                      value={merchantFxSettings?.default_spread_bps ?? spreadBps}
                      onChange={(e) => setSpreadBps(e.target.value)}
                      placeholder="100"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      100 bps = 1.00% markup on mid-market rate
                    </p>
                  </div>
                </div>

                {selectedMerchant && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      const bps = parseInt(spreadBps) || 100;
                      const { error } = await supabase.from("merchant_fx_settings").upsert(
                        {
                          merchant_id: selectedMerchant,
                          default_spread_bps: bps,
                        },
                        { onConflict: "merchant_id" }
                      );
                      if (error) {
                        toast.error("Failed to save spread config");
                      } else {
                        toast.success(`Spread set to ${bps} bps for merchant`);
                        queryClient.invalidateQueries({ queryKey: ["merchant-fx-settings"] });
                      }
                    }}
                  >
                    Save Spread Config
                  </Button>
                )}

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Common Spread Presets</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Tight (25 bps)", value: 25, desc: "0.25% — competitive" },
                      { label: "Standard (100 bps)", value: 100, desc: "1.00% — default" },
                      { label: "Premium (200 bps)", value: 200, desc: "2.00% — high margin" },
                      { label: "High Risk (350 bps)", value: 350, desc: "3.50% — risk premium" },
                    ].map((preset) => (
                      <Card
                        key={preset.value}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => setSpreadBps(String(preset.value))}
                      >
                        <CardContent className="pt-4 pb-3">
                          <p className="text-sm font-medium text-foreground">{preset.label}</p>
                          <p className="text-xs text-muted-foreground">{preset.desc}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Movements Tab */}
          <TabsContent value="movements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Treasury Movements & Rebalancing Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Date</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">From</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">To</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">Amount</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">Converted</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">FX Rate</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Purpose</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(movements || []).map((m) => (
                        <tr key={m.id} className="border-t border-border">
                          <td className="px-3 py-2 text-muted-foreground text-xs">
                            {format(new Date(m.created_at), "MMM d, HH:mm")}
                          </td>
                          <td className="px-3 py-2 font-medium text-foreground">{m.from_currency}</td>
                          <td className="px-3 py-2 font-medium text-foreground">{m.to_currency}</td>
                          <td className="px-3 py-2 text-right font-mono text-foreground">
                            ${(m.amount || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-foreground">
                            ${(m.converted_amount || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                            {(m.fx_rate || 1).toFixed(4)}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="secondary">{m.purpose}</Badge>
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant={m.status === "completed" ? "default" : "outline"}>
                              {m.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {(!movements || movements.length === 0) && (
                        <tr>
                          <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                            No treasury movements yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Rates Tab */}
          <TabsContent value="rates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Live FX Rates</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => updateRatesMutation.mutate()}
                    disabled={updateRatesMutation.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 ${updateRatesMutation.isPending ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Base</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Quote</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">Mid Rate</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">Applied</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">Spread</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Source</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(fxRates || []).slice(0, 30).map((r) => (
                        <tr key={r.id} className="border-t border-border">
                          <td className="px-3 py-2 font-semibold text-foreground">{r.base_currency}</td>
                          <td className="px-3 py-2 text-foreground">{r.quote_currency}</td>
                          <td className="px-3 py-2 text-right font-mono text-foreground">
                            {(r.mid_market_rate || r.rate || 0).toFixed(4)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-foreground">
                            {(r.applied_rate || r.rate || 0).toFixed(4)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Badge variant="secondary">{r.spread_bps || 0} bps</Badge>
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-xs">
                              {r.source || "manual"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground text-xs">
                            {format(new Date(r.created_at), "MMM d, HH:mm")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
