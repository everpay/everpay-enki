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
import { CheckCircle2, AlertTriangle, XCircle, Download, RefreshCw, Scale, TrendingUp, TrendingDown } from 'lucide-react';

interface ReconciliationRow {
  id: string;
  provider: string;
  date: string;
  ledgerAmount: number;
  processorAmount: number;
  settlementAmount: number;
  currency: string;
  variance: number;
  variancePct: number;
  status: 'matched' | 'mismatch' | 'pending';
  transactionCount: number;
}

function useReconciliationData(period: string) {
  return useQuery({
    queryKey: ['reconciliation', period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('No merchant found');

      // Get transactions grouped by provider and date
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('id, amount, currency, provider, status, settlement_amount, created_at')
        .eq('merchant_id', merchant.id)
        .in('status', ['completed', 'refunded', 'chargeback'])
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Get ledger entries
      const { data: ledgerEntries } = await supabase
        .from('ledger_entries')
        .select('amount, currency, entry_type, transaction_id, created_at')
        .limit(500);

      // Group by provider + date
      const groups = new Map<string, {
        provider: string;
        date: string;
        txnTotal: number;
        settlementTotal: number;
        ledgerTotal: number;
        currency: string;
        count: number;
      }>();

      (transactions || []).forEach(tx => {
        const date = tx.created_at.split('T')[0];
        const key = `${tx.provider}-${date}`;

        if (!groups.has(key)) {
          groups.set(key, {
            provider: tx.provider,
            date,
            txnTotal: 0,
            settlementTotal: 0,
            ledgerTotal: 0,
            currency: tx.currency,
            count: 0,
          });
        }

        const g = groups.get(key)!;
        g.txnTotal += tx.amount;
        g.settlementTotal += tx.settlement_amount || tx.amount;
        g.count += 1;

        // Find matching ledger credit
        const credit = (ledgerEntries || []).find(
          le => le.transaction_id === tx.id && le.entry_type === 'credit'
        );
        if (credit) g.ledgerTotal += credit.amount;
      });

      const rows: ReconciliationRow[] = Array.from(groups.values()).map((g, i) => {
        const processorAmount = g.settlementTotal;
        const actualVariance = g.ledgerTotal - processorAmount;
        const variancePct = processorAmount > 0 ? (actualVariance / processorAmount) * 100 : 0;

        return {
          id: `recon-${i}`,
          provider: g.provider,
          date: g.date,
          ledgerAmount: g.ledgerTotal,
          processorAmount,
          settlementAmount: g.settlementTotal,
          currency: g.currency,
          variance: actualVariance,
          variancePct,
          status: Math.abs(actualVariance) < 0.01 ? 'matched' : Math.abs(variancePct) > 5 ? 'mismatch' : 'pending',
          transactionCount: g.count,
        };
      });

      return rows.sort((a, b) => b.date.localeCompare(a.date));
    },
  });
}

export default function Reconciliation() {
  const [period, setPeriod] = useState('7d');
  const { data: rows, isLoading, refetch } = useReconciliationData(period);

  const stats = useMemo(() => {
    if (!rows) return { matched: 0, mismatched: 0, pending: 0, totalVariance: 0 };
    return {
      matched: rows.filter(r => r.status === 'matched').length,
      mismatched: rows.filter(r => r.status === 'mismatch').length,
      pending: rows.filter(r => r.status === 'pending').length,
      totalVariance: rows.reduce((sum, r) => sum + Math.abs(r.variance), 0),
    };
  }, [rows]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle2 className="h-3 w-3 mr-1" />Matched</Badge>;
      case 'mismatch':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Mismatch</Badge>;
      default:
        return <Badge className="bg-warning/10 text-warning border-warning/20"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const exportCSV = () => {
    if (!rows) return;
    const header = 'Date,Provider,Ledger Amount,Processor Amount,Settlement Amount,Variance,Variance %,Status,Transactions\n';
    const csv = rows.map(r =>
      `${r.date},${r.provider},${r.ledgerAmount.toFixed(2)},${r.processorAmount.toFixed(2)},${r.settlementAmount.toFixed(2)},${r.variance.toFixed(2)},${r.variancePct.toFixed(2)}%,${r.status},${r.transactionCount}`
    ).join('\n');
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliation-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Reconciliation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Daily settlement vs ledger vs processor comparison</p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector value={period as any} onValueChange={(v) => setPeriod(v)} />
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Matched</p>
                <p className="text-2xl font-bold text-foreground">{stats.matched}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10"><XCircle className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Mismatched</p>
                <p className="text-2xl font-bold text-foreground">{stats.mismatched}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10"><AlertTriangle className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><Scale className="h-5 w-5 text-muted-foreground" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Variance</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalVariance, 'USD')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Reconciliation</CardTitle>
          <CardDescription>Settlement vs Ledger vs Processor data with variance highlighting</CardDescription>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Ledger</TableHead>
                  <TableHead className="text-right">Processor</TableHead>
                  <TableHead className="text-right">Settlement</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Txns</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows?.map(row => (
                  <TableRow key={row.id} className={row.status === 'mismatch' ? 'bg-destructive/5' : ''}>
                    <TableCell className="text-sm font-medium">{row.date}</TableCell>
                    <TableCell className="text-sm capitalize">{row.provider}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(row.ledgerAmount, row.currency as any)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(row.processorAmount, row.currency as any)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(row.settlementAmount, row.currency as any)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono text-sm flex items-center justify-end gap-1 ${row.variance > 0 ? 'text-success' : row.variance < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {row.variance > 0 ? <TrendingUp className="h-3 w-3" /> : row.variance < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                        {formatCurrency(Math.abs(row.variance), row.currency as any)}
                        <span className="text-xs text-muted-foreground">({row.variancePct.toFixed(1)}%)</span>
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(row.status)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{row.transactionCount}</TableCell>
                  </TableRow>
                ))}
                {!rows?.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No reconciliation data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
