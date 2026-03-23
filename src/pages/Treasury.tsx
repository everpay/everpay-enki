import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpDown, RefreshCw, TrendingUp, DollarSign, Globe, Landmark } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { format } from "date-fns";

export default function Treasury() {
  const { data: pools, isLoading: poolsLoading } = useQuery({
    queryKey: ["liquidity-pools"],
    queryFn: async () => {
      const { data, error } = await supabase.from("liquidity_pools").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: fxRates, isLoading: fxLoading } = useQuery({
    queryKey: ["fx-rates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fx_rates").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: settlements } = useQuery({
    queryKey: ["settlement-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settlement_batches").select("*").order("created_at", { ascending: false }).limit(20);
      if (error) return [];
      return data || [];
    },
  });

  const totalLiquidity = pools?.reduce((sum, p) => sum + (p.balance || 0), 0) || 0;
  const uniqueCurrencies = [...new Set(pools?.map(p => p.currency) || [])];
  const uniqueRegions = [...new Set(pools?.map(p => p.region).filter(Boolean) || [])];

  const poolChartData = pools?.map(p => ({
    name: `${p.currency} (${p.region || 'Global'})`,
    balance: p.balance || 0,
  })) || [];

  const fxChartData = fxRates?.slice(0, 10).reverse().map(r => ({
    pair: `${r.base_currency}/${r.quote_currency}`,
    rate: r.rate,
    date: format(new Date(r.created_at), "HH:mm"),
  })) || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Treasury & Liquidity</h1>
            <p className="text-sm text-muted-foreground">Manage liquidity pools, FX rates, and settlement flows</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Rebalance
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><DollarSign className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Liquidity</p>
                  <p className="text-xl font-bold text-foreground">${totalLiquidity.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10"><Globe className="h-5 w-5 text-accent-foreground" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Active Currencies</p>
                  <p className="text-xl font-bold text-foreground">{uniqueCurrencies.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/50"><Landmark className="h-5 w-5 text-secondary-foreground" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Regions</p>
                  <p className="text-xl font-bold text-foreground">{uniqueRegions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><ArrowUpDown className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">FX Pairs Tracked</p>
                  <p className="text-xl font-bold text-foreground">{fxRates?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pools">
          <TabsList>
            <TabsTrigger value="pools">Liquidity Pools</TabsTrigger>
            <TabsTrigger value="fx">FX Rates</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
          </TabsList>

          <TabsContent value="pools" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Pool Balances by Currency / Region</CardTitle></CardHeader>
              <CardContent>
                {poolsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading pools…</p>
                ) : poolChartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No liquidity pools configured yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={poolChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Bar dataKey="balance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pools?.map(pool => (
                <Card key={pool.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-foreground">{pool.currency || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{pool.region || 'Global'}</p>
                      </div>
                      <Badge variant="outline">${(pool.balance || 0).toLocaleString()}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="fx" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Recent FX Rates</CardTitle></CardHeader>
              <CardContent>
                {fxLoading ? (
                  <p className="text-sm text-muted-foreground">Loading FX data…</p>
                ) : fxChartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No FX rate data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={fxChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="pair" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-muted-foreground font-medium">Base</th>
                    <th className="px-4 py-2 text-left text-muted-foreground font-medium">Quote</th>
                    <th className="px-4 py-2 text-right text-muted-foreground font-medium">Rate</th>
                    <th className="px-4 py-2 text-left text-muted-foreground font-medium">Source</th>
                    <th className="px-4 py-2 text-right text-muted-foreground font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {fxRates?.map(r => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-2 font-medium text-foreground">{r.base_currency}</td>
                      <td className="px-4 py-2 text-foreground">{r.quote_currency}</td>
                      <td className="px-4 py-2 text-right font-mono text-foreground">{r.rate.toFixed(4)}</td>
                      <td className="px-4 py-2"><Badge variant="secondary" className="text-xs">{r.source || 'manual'}</Badge></td>
                      <td className="px-4 py-2 text-right text-muted-foreground text-xs">{format(new Date(r.created_at), "MMM d, HH:mm")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="settlements" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Recent Settlement Batches</CardTitle></CardHeader>
              <CardContent>
                {!settlements?.length ? (
                  <p className="text-sm text-muted-foreground">No settlement batches found.</p>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-muted-foreground font-medium">Batch ID</th>
                          <th className="px-4 py-2 text-left text-muted-foreground font-medium">Provider</th>
                          <th className="px-4 py-2 text-right text-muted-foreground font-medium">Amount</th>
                          <th className="px-4 py-2 text-left text-muted-foreground font-medium">Status</th>
                          <th className="px-4 py-2 text-right text-muted-foreground font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settlements.map((s: any) => (
                          <tr key={s.id} className="border-t border-border">
                            <td className="px-4 py-2 font-mono text-xs text-foreground">{s.id?.slice(0, 8)}</td>
                            <td className="px-4 py-2 text-foreground">{s.provider || s.processor || 'N/A'}</td>
                            <td className="px-4 py-2 text-right font-mono text-foreground">${(s.total_amount || s.amount || 0).toLocaleString()}</td>
                            <td className="px-4 py-2"><Badge variant={s.status === 'completed' ? 'default' : 'secondary'}>{s.status}</Badge></td>
                            <td className="px-4 py-2 text-right text-muted-foreground text-xs">{format(new Date(s.created_at), "MMM d, yyyy")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
