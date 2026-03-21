import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/format';
import { Users, DollarSign, TrendingUp, Plus, Building2, Mail, BarChart3, Loader2 } from 'lucide-react';

export default function ResellerPortal() {
  const { user } = useAuth();
  const [showNewApp, setShowNewApp] = useState(false);
  const [form, setForm] = useState({
    business_name: '', contact_name: '', contact_email: '', phone: '',
    website: '', business_type: 'ecommerce', estimated_volume: '', notes: '',
  });

  const { data: referredMerchants = [] } = useQuery({
    queryKey: ['referred-merchants', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: merchants } = await supabase
        .from('merchants')
        .select('*')
        .order('created_at', { ascending: false });
      return merchants || [];
    },
    enabled: !!user,
  });

  const { data: volumeStats } = useQuery({
    queryKey: ['reseller-volume', referredMerchants],
    queryFn: async () => {
      if (referredMerchants.length === 0) return { totalVolume: 0, totalTransactions: 0, commission: 0 };
      const merchantIds = referredMerchants.map((m: any) => m.id);
      const { data: txns } = await supabase
        .from('transactions')
        .select('amount, status')
        .in('merchant_id', merchantIds)
        .eq('status', 'completed');
      const totalVolume = (txns || []).reduce((sum, t) => sum + Number(t.amount), 0);
      const commission = totalVolume * 0.00125;
      return { totalVolume, totalTransactions: txns?.length || 0, commission };
    },
    enabled: referredMerchants.length > 0,
  });

  const stats = volumeStats || { totalVolume: 0, totalTransactions: 0, commission: 0 };

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Reseller Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage merchant referrals, track volume & commissions</p>
        </div>
        <Dialog open={showNewApp} onOpenChange={setShowNewApp}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />New Merchant Application</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Submit Merchant Application</DialogTitle>
              <DialogDescription>Refer a new merchant. They'll receive an invitation to set up their account.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Business Name</Label><Input value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} placeholder="Acme Corp" /></div>
                <div className="space-y-2"><Label>Business Type</Label>
                  <Select value={form.business_type} onValueChange={v => setForm(f => ({ ...f, business_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ecommerce">E-Commerce</SelectItem>
                      <SelectItem value="saas">SaaS</SelectItem>
                      <SelectItem value="marketplace">Marketplace</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Contact Name</Label><Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="John Doe" /></div>
                <div className="space-y-2"><Label>Contact Email</Label><Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="john@acme.com" /></div>
              </div>
              <div className="space-y-2"><Label>Estimated Monthly Volume (USD)</Label><Input value={form.estimated_volume} onChange={e => setForm(f => ({ ...f, estimated_volume: e.target.value }))} placeholder="50,000" /></div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional context..." rows={3} /></div>
              <Button className="w-full gap-2" disabled={!form.contact_email || !form.contact_name}><Mail className="h-4 w-4" />Submit & Send Invitation</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{referredMerchants.length}</p><p className="text-xs text-muted-foreground">Referred Merchants</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-emerald-500" /></div><div><p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalVolume, 'USD')}</p><p className="text-xs text-muted-foreground">Total Volume</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-amber-500" /></div><div><p className="text-2xl font-bold text-foreground">{stats.totalTransactions}</p><p className="text-xs text-muted-foreground">Total Transactions</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{formatCurrency(stats.commission, 'USD')}</p><p className="text-xs text-muted-foreground">Earned Commissions</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Referred Merchants</CardTitle><CardDescription>Merchants you've referred to the platform</CardDescription></CardHeader>
        <CardContent>
          {referredMerchants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-1">No referred merchants yet</p>
              <p className="text-sm text-muted-foreground mb-4">Submit your first merchant application to start earning commissions</p>
              <Button variant="outline" onClick={() => setShowNewApp(true)} className="gap-2"><Plus className="h-4 w-4" />Submit Application</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left"><th className="pb-3 font-medium text-muted-foreground">Business</th><th className="pb-3 font-medium text-muted-foreground">Created</th><th className="pb-3 font-medium text-muted-foreground text-right">Status</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {referredMerchants.map((merchant: any) => (
                    <tr key={merchant.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span className="font-medium text-foreground">{merchant.name}</span></div></td>
                      <td className="py-3 text-muted-foreground text-xs">{new Date(merchant.created_at).toLocaleDateString()}</td>
                      <td className="py-3 text-right"><Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">Active</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
