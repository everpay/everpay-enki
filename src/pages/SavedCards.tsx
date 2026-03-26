import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CreditCard, Trash2, Search, Loader2, Shield, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SavedCards() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: cards, isLoading } = useQuery({
    queryKey: ['saved-cards'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('No merchant');

      const { data, error } = await supabase
        .from('payment_methods')
        .select('id, card_brand, card_last4, exp_month, exp_year, is_default, network_token_status, card_updater_enabled, created_at, customer_id')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('payment_methods').delete().eq('id', id);
      if (error) throw error;
      toast.success('Card removed');
      queryClient.invalidateQueries({ queryKey: ['saved-cards'] });
    } catch {
      toast.error('Failed to delete card');
    }
    setDeleteTarget(null);
  };

  const filtered = cards?.filter((c: any) =>
    !search || 
    (c.card_last4 || '').includes(search) || 
    (c.card_brand || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.customer_id || '').toLowerCase().includes(search.toLowerCase())
  );

  const brandColor = (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa': return 'bg-blue-500/10 text-blue-600';
      case 'mastercard': return 'bg-orange-500/10 text-orange-600';
      case 'amex': return 'bg-indigo-500/10 text-indigo-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Saved Cards</h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage tokenized card-on-file records for subscriptions and recurring payments</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Total Cards</p>
              </div>
              <p className="text-2xl font-bold">{cards?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Network Tokens</p>
              </div>
              <p className="text-2xl font-bold">{cards?.filter((c: any) => c.network_token_status === 'active').length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Auto-Update</p>
              </div>
              <p className="text-2xl font-bold">{cards?.filter((c: any) => c.card_updater_enabled).length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Default Cards</p>
              </div>
              <p className="text-2xl font-bold">{cards?.filter((c: any) => c.is_default).length || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by last 4, brand, or customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Card list */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : !filtered?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No Saved Cards</p>
              <p className="text-sm text-muted-foreground">Tokenized cards will appear here after customers save payment methods</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((card: any) => (
              <Card key={card.id} className="hover:border-primary/20 transition-colors">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${brandColor(card.card_brand)}`}>
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground capitalize">{card.card_brand || 'Card'}</span>
                        <span className="text-sm text-muted-foreground">•••• {card.card_last4}</span>
                        {card.is_default && <Badge variant="default" className="text-xs">Default</Badge>}
                        {card.network_token_status === 'active' && <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-0">Network Token</Badge>}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Exp: {card.exp_month}/{card.exp_year}</span>
                        <span>Customer: {card.customer_id?.slice(0, 8)}...</span>
                        {card.card_updater_enabled && <span className="text-primary">Auto-update ✓</span>}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(card.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete confirmation */}
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Remove Saved Card</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">This will permanently delete the tokenized card. Active subscriptions using this card will fail on next billing.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>Delete Card</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
