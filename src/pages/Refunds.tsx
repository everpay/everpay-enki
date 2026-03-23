import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RotateCcw, DollarSign, CheckCircle2, XCircle, Clock, Search, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/format';
import { RefundChargebackPanel } from '@/components/RefundChargebackPanel';

function useRefunds() {
  return useQuery({
    queryKey: ['refunds'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('No merchant found');
      const { data, error } = await supabase
        .from('refunds')
        .select('*, transaction:transactions(amount, currency, customer_email, provider)')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useCompletedTransactions() {
  return useQuery({
    queryKey: ['completed-transactions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('No merchant found');
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('merchant_id', merchant.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

export default function Refunds() {
  const { data: refunds, refetch } = useRefunds();
  const { data: transactions } = useCompletedTransactions();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRefund, setExpandedRefund] = useState<string | null>(null);

  const selectedTransaction = transactions?.find(t => t.id === selectedTxn);

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxn || !refundAmount) return;
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('No merchant found');

      const txn = transactions?.find(t => t.id === selectedTxn);
      if (!txn) throw new Error('Transaction not found');

      const amount = parseFloat(refundAmount);
      if (amount > txn.amount) { toast.error('Refund amount exceeds transaction amount'); return; }

      const { error } = await supabase.from('refunds').insert({
        transaction_id: selectedTxn,
        merchant_id: merchant.id,
        amount,
        currency: txn.currency,
        reason,
        provider: txn.provider,
        status: 'pending',
      });
      if (error) throw error;

      // Update transaction status if full refund
      if (amount === txn.amount) {
        await supabase.from('transactions').update({ status: 'refunded' }).eq('id', selectedTxn);
      }

      toast.success('Refund initiated successfully');
      setOpen(false);
      setSelectedTxn('');
      setRefundAmount('');
      setReason('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['completed-transactions'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create refund');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default: return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const totalRefunded = refunds?.reduce((sum, r) => sum + (r.status !== 'failed' ? Number(r.amount) : 0), 0) || 0;
  const pendingRefunds = refunds?.filter(r => r.status === 'pending').length || 0;

  const filteredRefunds = refunds?.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (r.transaction as any)?.customer_email?.toLowerCase().includes(q) || r.reason?.toLowerCase().includes(q);
  });

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Refunds</h1>
          <p className="mt-1 text-sm text-muted-foreground">Issue and track payment refunds</p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <RotateCcw className="h-4 w-4" />Issue Refund
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><DollarSign className="h-5 w-5 text-muted-foreground" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Refunded</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRefunded, 'USD')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><RotateCcw className="h-5 w-5 text-muted-foreground" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Refunds</p>
                <p className="text-2xl font-bold">{refunds?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><Clock className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingRefunds}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Refund History</CardTitle>
              <CardDescription>All refund requests and their status</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by email or reason..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRefunds?.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{r.transaction?.customer_email || '—'}</TableCell>
                  <TableCell className="font-mono">{formatCurrency(r.amount, r.currency)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{r.reason || '—'}</TableCell>
                  <TableCell className="text-sm">{r.provider || '—'}</TableCell>
                  <TableCell>{getStatusBadge(r.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                </TableRow>
              ))}
              {!filteredRefunds?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No refunds yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Refund Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Refund</DialogTitle>
            <DialogDescription>Select a completed transaction to refund. Partial or full refunds are supported.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRefund} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Transaction</Label>
              <Select value={selectedTxn} onValueChange={v => { setSelectedTxn(v); const txn = transactions?.find(t => t.id === v); if (txn) setRefundAmount(String(txn.amount)); }}>
                <SelectTrigger><SelectValue placeholder="Select a transaction..." /></SelectTrigger>
                <SelectContent>
                  {transactions?.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.customer_email || 'Unknown'} — {formatCurrency(t.amount, t.currency as any)} ({formatDate(t.created_at)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTransaction && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Original Amount</span><span className="font-mono">{formatCurrency(selectedTransaction.amount, selectedTransaction.currency as any)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Provider</span><span>{selectedTransaction.provider}</span></div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Refund Amount</Label>
              <Input type="number" step="0.01" min="0" max={selectedTransaction?.amount} value={refundAmount} onChange={e => setRefundAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea placeholder="Customer requested refund..." value={reason} onChange={e => setReason(e.target.value)} rows={2} />
            </div>
            <Button type="submit" className="w-full" disabled={isProcessing || !selectedTxn}>{isProcessing ? 'Processing...' : 'Issue Refund'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
