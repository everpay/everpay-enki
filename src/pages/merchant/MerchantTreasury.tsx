import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Globe, Percent, ArrowRightLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function MerchantTreasury() {
  // Get merchant
  const { data: merchant } = useQuery({
    queryKey: ["my-merchant"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data } = await supabase
        .from("merchants")
        .select("id, name")
        .eq("user_id", user.id)
        .single();
      return data;
    },
  });

  // Multi-currency balances
  const { data: accounts } = useQuery({
    queryKey: ["merchant-accounts", merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("merchant_id", merchant.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchant?.id,
  });

  // FX Revenue (merchant's own)
  const { data: fxRevenue } = useQuery({
    queryKey: ["merchant-fx-revenue", merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from("fx_revenue_logs")
        .select("*")
        .eq("merchant_id", merchant.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchant?.id,
  });

  // FX Settings
  const { data: fxSettings } = useQuery({
    queryKey: ["merchant-fx-settings", merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return null;
      const { data } = await supabase
        .from("merchant_fx_settings")
        .select("*")
        .eq("merchant_id", merchant.id)
        .single();
      return data;
    },
    enabled: !!merchant?.id,
  });

  // Transactions with FX
  const { data: fxTransactions } = useQuery({
    queryKey: ["merchant-fx-transactions", merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("merchant_id", merchant.id)
        .not("fx_rate", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchant?.id,
  });

  // KPIs
  const totalBalance = accounts?.reduce((s, a) => s + (a.available_balance || 0), 0) || 0;
  const totalFxVolume = fxRevenue?.reduce((s, r) => s + (r.amount || 0), 0) || 0;
  const uniqueCurrencies = [...new Set(accounts?.map((a) => a.currency) || [])];
  const currentSpread = fxSettings?.default_spread_bps || 100;

  // Balance by currency chart
  const balanceChart = accounts?.map((a) => ({
    currency: a.currency,
    available: a.available_balance || 0,
    pending: a.pending_balance || 0,
  })) || [];

  // FX breakdown pie
  const fxByCurrency: Record<string, number> = {};
  fxRevenue?.forEach((r) => {
    const key = `${r.base_currency}→${r.quote_currency}`;
    fxByCurrency[key] = (fxByCurrency[key] || 0) + (r.amount || 0);
  });
  const fxPieData = Object.entries(fxByCurrency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Treasury & FX</h1>
          <p className="text-sm text-muted-foreground">
            Multi-currency balances, FX conversion details, and exchange rate transparency
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Balance</p>
                  <p className="text-xl font-bold text-foreground">${totalBalance.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Globe className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Currencies</p>
                  <p className="text-xl font-bold text-foreground">{uniqueCurrencies.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">FX Volume</p>
                  <p className="text-xl font-bold text-foreground">${totalFxVolume.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/50">
                  <Percent className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Your FX Rate</p>
                  <p className="text-xl font-bold text-foreground">{(currentSpread / 100).toFixed(2)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="balances">
          <TabsList>
            <TabsTrigger value="balances">Multi-Currency Balances</TabsTrigger>
            <TabsTrigger value="fx-detail">FX Breakdown</TabsTrigger>
            <TabsTrigger value="fx-transactions">FX Transactions</TabsTrigger>
          </TabsList>

          {/* Balances Tab */}
          <TabsContent value="balances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Balance by Currency</CardTitle>
              </CardHeader>
              <CardContent>
                {balanceChart.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No accounts found</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={balanceChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="currency" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                        }}
                      />
                      <Bar dataKey="available" fill="hsl(var(--primary))" name="Available" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending" fill="hsl(var(--chart-3))" name="Pending" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts?.map((a) => (
                <Card key={a.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-lg font-bold text-foreground">{a.currency}</p>
                        <p className="text-xs text-muted-foreground mt-1">Available</p>
                        <p className="text-lg font-semibold text-foreground">
                          ${(a.available_balance || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          Pending: ${(a.pending_balance || 0).toLocaleString()}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">
                          Total: ${(a.balance || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* FX Breakdown Tab */}
          <TabsContent value="fx-detail" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">FX Volume by Pair</CardTitle>
                </CardHeader>
                <CardContent>
                  {fxPieData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No FX conversions yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={fxPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                        >
                          {fxPieData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">FX Rate Applied</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your current FX spread is <strong>{currentSpread} bps</strong> ({(currentSpread / 100).toFixed(2)}%). This is applied on top of the mid-market rate for all currency conversions.
                  </p>
                  <div className="space-y-3">
                    {(fxRevenue || []).slice(0, 5).map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {r.base_currency}→{r.quote_currency}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono text-foreground">
                            Mid: {(r.mid_market_rate || 0).toFixed(4)} → Applied: {(r.applied_rate || 0).toFixed(4)}
                          </p>
                          <p className="text-xs text-muted-foreground">{r.spread_bps} bps spread</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FX Transactions Tab */}
          <TabsContent value="fx-transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Transactions with FX Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Date</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">Amount</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Currency</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">FX Rate</th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">Settlement</th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(fxTransactions || []).map((t: any) => (
                        <tr key={t.id} className="border-t border-border">
                          <td className="px-3 py-2 text-muted-foreground text-xs">
                            {format(new Date(t.created_at), "MMM d, HH:mm")}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-foreground">
                            ${(t.amount || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-foreground">{t.currency}</td>
                          <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                            {(t.fx_rate || 1).toFixed(4)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-foreground">
                            {t.settlement_amount
                              ? `${t.settlement_currency} ${t.settlement_amount.toLocaleString()}`
                              : "—"}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant={t.status === "completed" ? "default" : "secondary"}>
                              {t.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {(!fxTransactions || fxTransactions.length === 0) && (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                            No FX transactions found
                          </td>
                        </tr>
                      )}
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
