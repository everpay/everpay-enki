import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Shield,
  AlertTriangle, Download, BarChart3, Globe, Activity,
  CheckCircle2, XCircle, Clock, FileText
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

function useBoardData() {
  return useQuery({
    queryKey: ['board-overview'],
    queryFn: async () => {
      const [txRes, disputeRes, merchantRes, refundRes] = await Promise.all([
        supabase.from('transactions').select('id, amount, currency, status, provider, created_at').order('created_at', { ascending: false }).limit(1000),
        supabase.from('disputes').select('id, amount, currency, status, created_at').limit(500),
        supabase.from('merchants').select('id, name, created_at').limit(500),
        supabase.from('refunds').select('id, amount, currency, status, created_at').limit(500),
      ]);

      const transactions = txRes.data || [];
      const disputes = disputeRes.data || [];
      const merchants = merchantRes.data || [];
      const refunds = refundRes.data || [];

      const totalVolume = transactions.reduce((s, t) => s + (t.status === 'completed' ? t.amount : 0), 0);
      const totalTransactions = transactions.length;
      const completedTxns = transactions.filter(t => t.status === 'completed').length;
      const failedTxns = transactions.filter(t => t.status === 'failed').length;
      const authRate = totalTransactions > 0 ? ((completedTxns / totalTransactions) * 100).toFixed(1) : '0';
      const disputeAmount = disputes.reduce((s, d) => s + d.amount, 0);
      const refundAmount = refunds.reduce((s, r) => s + (r.status !== 'failed' ? r.amount : 0), 0);
      const chargebackRate = totalTransactions > 0 ? ((disputes.length / totalTransactions) * 100).toFixed(2) : '0';

      // Volume by day (last 30d)
      const dailyVolume = new Map<string, { date: string; volume: number; count: number }>();
      transactions.forEach(t => {
        const date = t.created_at.split('T')[0];
        const existing = dailyVolume.get(date) || { date, volume: 0, count: 0 };
        if (t.status === 'completed') existing.volume += t.amount;
        existing.count += 1;
        dailyVolume.set(date, existing);
      });

      // Volume by provider
      const providerVolume = new Map<string, number>();
      transactions.filter(t => t.status === 'completed').forEach(t => {
        providerVolume.set(t.provider, (providerVolume.get(t.provider) || 0) + t.amount);
      });

      return {
        totalVolume,
        totalTransactions,
        completedTxns,
        failedTxns,
        authRate,
        disputeAmount,
        refundAmount,
        chargebackRate,
        activeMerchants: merchants.length,
        openDisputes: disputes.filter(d => d.status === 'open').length,
        dailyVolume: Array.from(dailyVolume.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-30),
        providerBreakdown: Array.from(providerVolume.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        recentIncidents: disputes.filter(d => d.status === 'open').slice(0, 5),
        transactions,
        disputes,
        refunds,
      };
    },
    refetchInterval: 30000,
  });
}

function exportCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(v => typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')).join(',')).join('\n');
  const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BoardOverview() {
  const { data, isLoading, refetch } = useBoardData();

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('board-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disputes' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refunds' }, () => refetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const fmt = (n: number) => formatCurrency(n, 'USD');

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Board Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Executive summary — live metrics & incident monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-success/10 text-success border-success/20 animate-pulse">
            <Activity className="h-3 w-3 mr-1" />Live
          </Badge>
          <Button variant="outline" size="sm" onClick={() => exportCSV(data?.transactions || [], 'transactions')}>
            <Download className="h-4 w-4 mr-1" />Export Transactions
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10"><DollarSign className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Volume</p>
                <p className="text-xl font-bold text-foreground">{fmt(data?.totalVolume || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Auth Rate</p>
                <p className="text-xl font-bold text-foreground">{data?.authRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Chargeback Rate</p>
                <p className="text-xl font-bold text-foreground">{data?.chargebackRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-muted"><Users className="h-5 w-5 text-muted-foreground" /></div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Merchants</p>
                <p className="text-xl font-bold text-foreground">{data?.activeMerchants || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents ({data?.openDisputes || 0})</TabsTrigger>
          <TabsTrigger value="exports">Data Export</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            {/* Volume Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Transaction Volume</CardTitle>
                <CardDescription>Daily processing volume (last 30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.dailyVolume || []}>
                      <defs>
                        <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => [fmt(v), 'Volume']} labelFormatter={l => `Date: ${l}`} />
                      <Area type="monotone" dataKey="volume" stroke="hsl(var(--primary))" fill="url(#volumeGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Provider Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Provider Mix</CardTitle>
                <CardDescription>Volume by processor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data?.providerBreakdown || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} strokeWidth={2}>
                        {(data?.providerBreakdown || []).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {(data?.providerBreakdown || []).slice(0, 5).map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="capitalize text-foreground">{p.name}</span>
                      </span>
                      <span className="font-mono text-muted-foreground">{fmt(p.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Transactions</span>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{data?.totalTransactions?.toLocaleString()}</p>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-success">{data?.completedTxns} approved</span>
                  <span className="text-destructive">{data?.failedTxns} failed</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Dispute Exposure</span>
                  <Shield className="h-4 w-4 text-destructive" />
                </div>
                <p className="text-2xl font-bold text-foreground">{fmt(data?.disputeAmount || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{data?.openDisputes} open disputes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Refunds</span>
                  <TrendingDown className="h-4 w-4 text-warning" />
                </div>
                <p className="text-2xl font-bold text-foreground">{fmt(data?.refundAmount || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{data?.refunds?.length || 0} refund requests</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open Incidents & Alerts</CardTitle>
              <CardDescription>Active disputes and high-risk events requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.recentIncidents || []).map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-mono">{formatCurrency(d.amount, d.currency)}</TableCell>
                      <TableCell><Badge variant="destructive">{d.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.reason || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(d.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {!data?.recentIncidents?.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-success" />
                        No open incidents
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>Download CSV reports for board meetings and compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Transactions', icon: BarChart3, data: data?.transactions, filename: 'transactions' },
                  { label: 'Disputes', icon: Shield, data: data?.disputes, filename: 'disputes' },
                  { label: 'Refunds', icon: TrendingDown, data: data?.refunds, filename: 'refunds' },
                ].map(item => (
                  <Button
                    key={item.label}
                    variant="outline"
                    className="h-auto py-6 flex flex-col items-center gap-3"
                    onClick={() => exportCSV(item.data || [], item.filename)}
                  >
                    <item.icon className="h-6 w-6 text-primary" />
                    <div className="text-center">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{(item.data || []).length} records</p>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
