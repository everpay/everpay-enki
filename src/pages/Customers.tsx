import { useState, useMemo } from 'react';
import { CountrySelect } from '@/components/CountrySelect';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { Search, MoreHorizontal, Eye, Pencil, UserCircle, CreditCard, MapPin, Package, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { CardBrandBadge } from '@/components/CardBrandBadge';

interface Customer { id: string; email: string; first_name: string | null; last_name: string | null; billing_address: any; merchant_id: string; created_at: string; updated_at: string; }

function useCustomers() {
  return useQuery({ queryKey: ['customers'], queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
    if (!merchant) throw new Error('Merchant not found');
    const { data, error } = await supabase.from('customers').select('*').eq('merchant_id', merchant.id).order('created_at', { ascending: false });
    if (error) throw error;
    return data as Customer[];
  }});
}

function useCustomerPaymentMethods(customerId: string | null) {
  return useQuery({ queryKey: ['customer-payment-methods', customerId], enabled: !!customerId, queryFn: async () => {
    const { data, error } = await supabase.from('payment_methods').select('*').eq('customer_id', customerId!);
    if (error) throw error;
    return data;
  }});
}

const emptyForm = { first_name: '', last_name: '', email: '', billing_street: '', billing_city: '', billing_state: '', billing_zip: '', billing_country: '' };

export default function Customers() {
  const { data: customers = [], isLoading } = useCustomers();
  const { data: transactions = [] } = useTransactions();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editForm, setEditForm] = useState({ ...emptyForm });

  const activeCustomerId = viewCustomer?.id ?? editCustomer?.id ?? null;
  const { data: paymentMethods = [] } = useCustomerPaymentMethods(activeCustomerId);

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(c => c.email.toLowerCase().includes(q) || (c.first_name || '').toLowerCase().includes(q) || (c.last_name || '').toLowerCase().includes(q));
  }, [customers, search]);

  const customerTransactions = useMemo(() => {
    if (!viewCustomer) return [];
    return transactions.filter(tx => tx.customer_email === viewCustomer.email);
  }, [viewCustomer, transactions]);

  const openEdit = (c: Customer) => {
    const billing = c.billing_address || {};
    setEditForm({ first_name: c.first_name || '', last_name: c.last_name || '', email: c.email, billing_street: billing.street || '', billing_city: billing.city || '', billing_state: billing.state || '', billing_zip: billing.zip || '', billing_country: billing.country || '' });
    setEditCustomer(c);
  };

  const buildAddress = () => ({ street: editForm.billing_street, city: editForm.billing_city, state: editForm.billing_state, zip: editForm.billing_zip, country: editForm.billing_country });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editCustomer) return;
      const { error } = await supabase.from('customers').update({ first_name: editForm.first_name || null, last_name: editForm.last_name || null, email: editForm.email, billing_address: buildAddress() }).eq('id', editCustomer.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Customer updated'); queryClient.invalidateQueries({ queryKey: ['customers'] }); setEditCustomer(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('Merchant not found');
      const { error } = await supabase.from('customers').insert({ merchant_id: merchant.id, email: editForm.email, first_name: editForm.first_name || null, last_name: editForm.last_name || null, billing_address: buildAddress() });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Customer created'); queryClient.invalidateQueries({ queryKey: ['customers'] }); setShowAddModal(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setEditForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Customers</h1><p className="mt-1 text-sm text-muted-foreground">Manage your customer records and payment history</p></div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <Button onClick={() => { setEditForm({ ...emptyForm }); setShowAddModal(true); }} className="gap-2 shrink-0"><Plus className="h-4 w-4" /> Add Customer</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 rounded-xl border border-border bg-card"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16"><UserCircle className="h-12 w-12 text-muted-foreground mb-3" /><p className="text-muted-foreground font-medium">{search ? 'No customers match your search' : 'No customers yet'}</p></CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead className="hidden md:table-cell">Location</TableHead><TableHead className="hidden md:table-cell">Created</TableHead><TableHead className="w-[60px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{filtered.map(c => {
              const addr = c.billing_address as any;
              return (<TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-semibold text-foreground">{c.first_name || c.last_name ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : '—'}</TableCell>
                <TableCell className="text-muted-foreground">{c.email}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{addr?.city ? `${addr.city}, ${addr.country || ''}` : '—'}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{format(new Date(c.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setViewCustomer(c)} className="gap-2"><Eye className="h-4 w-4" /> View</DropdownMenuItem><DropdownMenuItem onClick={() => openEdit(c)} className="gap-2"><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
              </TableRow>);
            })}</TableBody></Table>
        </CardContent></Card>
      )}

      {/* View Customer Drawer */}
      <Sheet open={!!viewCustomer} onOpenChange={() => setViewCustomer(null)}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary" />{viewCustomer?.first_name || viewCustomer?.email}</SheetTitle><SheetDescription>{viewCustomer?.email}</SheetDescription></SheetHeader>
          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="w-full"><TabsTrigger value="details" className="flex-1 gap-1.5"><UserCircle className="h-3.5 w-3.5" /> Details</TabsTrigger><TabsTrigger value="purchases" className="flex-1 gap-1.5"><Package className="h-3.5 w-3.5" /> Purchases</TabsTrigger><TabsTrigger value="cards" className="flex-1 gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Cards</TabsTrigger></TabsList>
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4"><div><Label className="text-xs font-semibold text-muted-foreground uppercase">Email</Label><p className="text-sm font-semibold text-foreground">{viewCustomer?.email}</p></div><div><Label className="text-xs font-semibold text-muted-foreground uppercase">Created</Label><p className="text-sm font-semibold text-foreground">{viewCustomer ? format(new Date(viewCustomer.created_at), 'PPP') : ''}</p></div></div>
            </TabsContent>
            <TabsContent value="purchases" className="mt-4">{customerTransactions.length === 0 ? <p className="text-sm text-muted-foreground py-4">No transactions yet</p> : customerTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border"><div><p className="text-sm font-medium">{formatCurrency(tx.amount, tx.currency as any)}</p><p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), 'PP')}</p></div><Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>{tx.status}</Badge></div>
            ))}</TabsContent>
            <TabsContent value="cards" className="mt-4 space-y-2">{paymentMethods.length === 0 ? <p className="text-sm text-muted-foreground py-4">No saved cards</p> : paymentMethods.map((pm: any) => <CardBrandBadge key={pm.id} brand={pm.card_brand} last4={pm.card_last4} expMonth={pm.exp_month} expYear={pm.exp_year} />)}</TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Edit/Add Dialog */}
      <Dialog open={!!editCustomer || showAddModal} onOpenChange={() => { setEditCustomer(null); setShowAddModal(false); }}>
        <DialogContent><DialogHeader><DialogTitle>{editCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">First Name</Label><Input value={editForm.first_name} onChange={f('first_name')} /></div><div><Label className="text-xs">Last Name</Label><Input value={editForm.last_name} onChange={f('last_name')} /></div></div>
            <div><Label className="text-xs">Email</Label><Input value={editForm.email} onChange={f('email')} type="email" /></div>
            <div className="border-t pt-4"><h4 className="text-sm font-bold flex items-center gap-2 mb-3"><MapPin className="h-4 w-4 text-primary" /> Billing Address</h4>
              <div className="space-y-3"><Input value={editForm.billing_street} onChange={f('billing_street')} placeholder="Street" /><div className="grid grid-cols-2 gap-3"><Input value={editForm.billing_city} onChange={f('billing_city')} placeholder="City" /><Input value={editForm.billing_state} onChange={f('billing_state')} placeholder="State" /></div><div className="grid grid-cols-2 gap-3"><Input value={editForm.billing_zip} onChange={f('billing_zip')} placeholder="ZIP" /><Input value={editForm.billing_country} onChange={f('billing_country')} placeholder="Country" /></div></div>
            </div>
            <Button className="w-full" onClick={() => editCustomer ? updateMutation.mutate() : createMutation.mutate()}>{editCustomer ? 'Save Changes' : 'Create Customer'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
