import { useState } from 'react';
import { CountrySelect } from '@/components/CountrySelect';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Globe, Trash2, Loader2, ArrowUpDown } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PROCESSORS = ['shieldhub', 'mondo', 'moneto', 'paygate10', 'ofa', 'makapay', 'lipad', 'payok', 'matrix', 'dcbank'];

export default function AdminPspRouting() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState('');
  const [country, setCountry] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [processor, setProcessor] = useState('shieldhub');
  const [priority, setPriority] = useState('0');
  const [filterMerchant, setFilterMerchant] = useState('all');

  const { data: merchants } = useQuery({
    queryKey: ['admin-merchants-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('merchants').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: routes, isLoading } = useQuery({
    queryKey: ['admin-psp-routes', filterMerchant],
    queryFn: async () => {
      let query = supabase.from('psp_routes').select('*, merchants(name)').order('priority', { ascending: true });
      if (filterMerchant !== 'all') query = query.eq('merchant_id', filterMerchant);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleAdd = async () => {
    if (!selectedMerchant || !processor) { toast.error('Merchant and processor required'); return; }
    try {
      const { error } = await supabase.from('psp_routes').insert({
        merchant_id: selectedMerchant,
        country: country || null,
        card_brand: cardBrand || null,
        risk_level: riskLevel || null,
        processor,
        priority: parseInt(priority) || 0,
      });
      if (error) throw error;
      toast.success('Route added');
      setShowAdd(false);
      setCountry(''); setCardBrand(''); setRiskLevel(''); setProcessor('shieldhub'); setPriority('0');
      queryClient.invalidateQueries({ queryKey: ['admin-psp-routes'] });
    } catch { toast.error('Failed to add route'); }
  };

  const handleToggle = async (id: string, active: boolean) => {
    const { error } = await supabase.from('psp_routes').update({ active, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error('Failed to update');
    else queryClient.invalidateQueries({ queryKey: ['admin-psp-routes'] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('psp_routes').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); queryClient.invalidateQueries({ queryKey: ['admin-psp-routes'] }); }
  };

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">PSP Routing</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage per-merchant processor routing rules</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Add Route</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Routing Rule</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Merchant *</Label>
                <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
                  <SelectTrigger><SelectValue placeholder="Select merchant" /></SelectTrigger>
                  <SelectContent>
                    {merchants?.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Country (optional)</Label>
                  <CountrySelect value={country} onValueChange={setCountry} placeholder="Select country..." />
                </div>
                <div className="space-y-2">
                  <Label>Card Brand (optional)</Label>
                  <Input value={cardBrand} onChange={(e) => setCardBrand(e.target.value)} placeholder="visa, mastercard" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Risk Level (optional)</Label>
                  <Select value={riskLevel} onValueChange={setRiskLevel}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Target Processor *</Label>
                <Select value={processor} onValueChange={setProcessor}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROCESSORS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleAdd}>Add Routing Rule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <Select value={filterMerchant} onValueChange={setFilterMerchant}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Filter by merchant" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Merchants</SelectItem>
            {merchants?.map((m: any) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : !routes?.length ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12">
          <Globe className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground">No Routing Rules</p>
          <p className="text-sm text-muted-foreground">Add PSP routing rules per merchant</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {routes.map((route: any) => (
            <Card key={route.id} className="hover:border-primary/20 transition-colors">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ArrowUpDown className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{(route as any).merchants?.name || 'Unknown'}</span>
                      <Badge variant="outline">P{route.priority}</Badge>
                      <Badge className="bg-primary/10 text-primary border-primary/20">{route.processor}</Badge>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {route.country && <Badge variant="secondary" className="text-xs">🌍 {route.country}</Badge>}
                      {route.card_brand && <Badge variant="secondary" className="text-xs">💳 {route.card_brand}</Badge>}
                      {route.risk_level && <Badge variant="secondary" className="text-xs">⚠️ {route.risk_level}</Badge>}
                      {!route.country && !route.card_brand && !route.risk_level && (
                        <span className="text-xs text-muted-foreground">Catch-all rule</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={route.active} onCheckedChange={(v) => handleToggle(route.id, v)} />
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(route.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
