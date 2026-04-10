import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRevenueAnalytics } from "@/hooks/useRevenueAnalytics";
import { useResellerSplits } from "@/hooks/useResellerSplits";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, DollarSign, ArrowDownRight, Users } from "lucide-react";
import { formatCurrency } from "@/lib/format";

function StatCard({ title, value, icon: Icon, className }: { title: string; value: string; icon: any; className?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${className || "bg-primary/10"}`}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminRevenue() {
  const { data: analytics, isLoading } = useRevenueAnalytics();
  const { data: splits } = useResellerSplits();

  // Monthly revenue chart data
  const monthlyData = new Map<string, { month: string; everpay: number; processor: number; sponsor: number }>();
  for (const f of analytics?.raw || []) {
    const month = new Date(f.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" });
    const existing = monthlyData.get(month) || { month, everpay: 0, processor: 0, sponsor: 0 };
    existing.everpay += Number(f.everpay_fee);
    existing.processor += Number(f.processor_fee);
    existing.sponsor += Number(f.sponsor_fee);
    monthlyData.set(month, existing);
  }
  const chartData = Array.from(monthlyData.values()).reverse();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary" /> Revenue Dashboard</h1>
          <p className="text-muted-foreground text-sm">Platform revenue, processor costs, and reseller payouts</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Platform Revenue" value={formatCurrency(analytics?.totalRevenue || 0)} icon={DollarSign} />
          <StatCard title="Processor Costs" value={formatCurrency(analytics?.totalProcessorCosts || 0)} icon={ArrowDownRight} />
          <StatCard title="Net Margin" value={formatCurrency(analytics?.netMargin || 0)} icon={TrendingUp} />
          <StatCard title="Transactions" value={String(analytics?.transactionCount || 0)} icon={Users} />
        </div>

        {chartData.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Monthly Revenue Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                    <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                    <Bar dataKey="everpay" name="Platform Revenue" fill="hsl(var(--primary))" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="processor" name="Processor Costs" fill="hsl(var(--chart-2))" stackId="a" />
                    <Bar dataKey="sponsor" name="Sponsor Fees" fill="hsl(var(--chart-3))" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Per-Merchant Revenue</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Total Fees</TableHead>
                    <TableHead>Platform Rev</TableHead>
                    <TableHead>Txns</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(analytics?.merchantBreakdown || []).map(m => (
                    <TableRow key={m.merchant_id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{formatCurrency(m.volume)}</TableCell>
                      <TableCell>{formatCurrency(m.fees)}</TableCell>
                      <TableCell className="text-primary font-semibold">{formatCurrency(m.everpay)}</TableCell>
                      <TableCell>{m.count}</TableCell>
                    </TableRow>
                  ))}
                  {(!analytics?.merchantBreakdown || analytics.merchantBreakdown.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No revenue data yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Reseller Revenue Sharing</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Revenue Share %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(splits || []).map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{(s.merchants as any)?.name || s.merchant_id?.slice(0, 8)}</TableCell>
                      <TableCell>{s.revenue_share_pct}%</TableCell>
                      <TableCell className={s.active ? "text-emerald-600" : "text-muted-foreground"}>{s.active ? "Active" : "Inactive"}</TableCell>
                    </TableRow>
                  ))}
                  {(!splits || splits.length === 0) && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No reseller splits configured</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
