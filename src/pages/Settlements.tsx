import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '@/lib/format';
import { Landmark, Clock, CheckCircle2, ArrowUpRight, Banknote, TrendingUp, Download } from 'lucide-react';

function useSettlementData() {
  return useQuery({
    queryKey: ['settlements-page'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('No merchant');

      const [{ data: settlements }, { data: instructions }] = await Promise.all([
        supabase.from('settlements').select('*').eq('merchant_id', merchant.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('settlement_instructions').select('*').eq('merchant_id', merchant.id).order('created_at', { ascending: false }).limit(100),
      ]);

      return { settlements: settlements || [], instructions: instructions || [], merchantId: merchant.id };
    },
  });
}

export default function Settlements() {
  const [statusFilter, setStatusFilter] = useState('all');
  const { data, isLoading } = useSettlementData();

  const filteredSettlements = useMemo(() => {
    if (!data?.settlements) return [];
    if (statusFilter === 'all') return data.settlements;
    return data.settlements.filter(s => s.status === statusFilter);
  }, [data?.settlements, statusFilter]);

  const stats = useMemo(() => {
    const s = data?.settlements || [];
    return {
      total: s.length,
      pending: s.filter(x => x.status === 'pending').length,
      settled: s.filter(x => x.status === 'settled' || x.status === 'completed').length,
      totalNet: s.reduce((sum, x) => sum + (x.net_amount || 0), 0),
      totalFees: s.reduce((sum, x) => sum + (x.fee || 0), 0),
    };
  }, [data?.settlements]);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'settled': case 'completed':
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle2 className="h-3 w-3 mr-1" />Settled</Badge>;
      case 'in_transit':
        return <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20"><ArrowUpRight className="h-3 w-3 mr-1" />In Transit</Badge>;
      default:
        return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Settlements</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track settlement batches, payout rails, and net amounts</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="settled">Settled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Landmark className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Settlements</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Settled</p>
                <p className="text-2xl font-bold text-foreground">{stats.settled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10"><TrendingUp className="h-5 w-5 text-chart-2" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Net Settled</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalNet, 'USD')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10"><Banknote className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalFees, 'USD')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settlement Batches */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Settlement Batches</CardTitle>
          <CardDescription>Processor-level settlement records with fee breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Processor</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSettlements.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.batch_id || s.id.slice(0, 8)}</TableCell>
                    <TableCell className="capitalize text-sm">{s.processor || '—'}</TableCell>
                    <TableCell className="text-sm">{s.currency || s.settlement_currency || 'USD'}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(s.gross_amount || 0, (s.currency || 'USD') as any)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-destructive">{formatCurrency(s.fee || 0, (s.currency || 'USD') as any)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">{formatCurrency(s.net_amount || 0, (s.currency || 'USD') as any)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.scheduled_at ? formatDate(s.scheduled_at) : '—'}</TableCell>
                    <TableCell>{getStatusBadge(s.status)}</TableCell>
                  </TableRow>
                ))}
                {!filteredSettlements.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No settlement records found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Settlement Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Instructions</CardTitle>
          <CardDescription>Outbound settlement instructions by rail type</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Rail</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.instructions || []).map(inst => (
                <TableRow key={inst.id}>
                  <TableCell className="font-mono text-xs">{inst.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm capitalize">{inst.rail || 'wire'}</TableCell>
                  <TableCell className="text-sm">{inst.currency || 'USD'}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(inst.amount || 0, (inst.currency || 'USD') as any)}</TableCell>
                  <TableCell>{getStatusBadge(inst.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{inst.created_at ? formatDate(inst.created_at) : '—'}</TableCell>
                </TableRow>
              ))}
              {!(data?.instructions || []).length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No payout instructions</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
