import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { externalProxy } from '@/hooks/useExternalData';
import MerchantForm from '@/components/admin/MerchantForm';
import { Search, UserPlus, Eye, Store, CheckCircle2, XCircle, Clock, Globe, Mail, Phone, Pencil, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { NewSinceBadge } from '@/components/admin/NewSinceBadge';
import { SyncNowButton } from '@/components/admin/SyncNowButton';
import { useNewSinceLastVisit } from '@/hooks/useNewSinceLastVisit';

interface MerchantRow {
  id: string;
  name: string;
  user_id: string;
  email?: string;
  phone?: string;
  created_at: string;
  status: string;
  onboarding_status: string;
  source: string;
  profile?: any;
}

export default function AdminMerchants() {
  const { toast } = useToast();
  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openAddMerchant, setOpenAddMerchant] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<{ name: string; email: string; phone: string; status: string }>({ name: '', email: '', phone: '', status: 'pending' });
  const [savingEdit, setSavingEdit] = useState(false);
  const { countNew, markVisited } = useNewSinceLastVisit('admin-merchants');
  const newCount = countNew(merchants);

  useEffect(() => { fetchMerchants(); }, []);

  useEffect(() => {
    if (!loading && merchants.length) {
      const t = setTimeout(() => markVisited(), 1500);
      return () => clearTimeout(t);
    }
  }, [loading, merchants.length, markVisited]);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const result = await externalProxy({ action: 'list_merchants_full' });
      const merchantList = (result.data || []).map((m: any) => ({
        ...m,
        status: m.profile?.onboarding_status === 'approved' ? 'active' : 'pending',
        onboarding_status: m.profile?.onboarding_status || 'pending',
        source: 'platform',
      }));
      setMerchants(merchantList);
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
      toast({ title: 'Error', description: 'Failed to load merchants', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (m: MerchantRow) => {
    setSelectedMerchant(m);
    setEditForm({ name: m.name || '', email: m.email || '', phone: m.phone || '', status: m.status || 'pending' });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selectedMerchant) return;
    setSavingEdit(true);
    try {
      await externalProxy({
        action: 'update_merchant',
        merchant_id: selectedMerchant.id,
        patch: { name: editForm.name, email: editForm.email || null, phone: editForm.phone || null, status: editForm.status },
      });
      toast({ title: 'Merchant updated' });
      setEditOpen(false);
      await fetchMerchants();
    } catch (e: any) {
      toast({ title: 'Update failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    } finally { setSavingEdit(false); }
  };

  const filteredMerchants = merchants.filter(m => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = m.name?.toLowerCase().includes(term) ||
      m.email?.toLowerCase().includes(term) ||
      m.id?.toLowerCase().includes(term) ||
      m.user_id?.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: merchants.length,
    active: merchants.filter(m => m.status === 'active').length,
    pending: merchants.filter(m => m.status === 'pending').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Merchants</h1>
              <NewSinceBadge count={newCount} label="new merchants" />
            </div>
            <p className="text-muted-foreground">Manage merchant accounts, onboarding, and access</p>
          </div>
          <div className="flex items-center gap-2">
            <SyncNowButton onSynced={fetchMerchants} />
            <Button onClick={() => setOpenAddMerchant(true)}>
              <UserPlus className="mr-2 h-4 w-4" />Add Merchant
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Total Merchants', value: stats.total, icon: Store },
            { label: 'Active', value: stats.active, icon: CheckCircle2 },
            { label: 'Pending', value: stats.pending, icon: Clock },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                  </div>
                  <s.icon className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Merchants</CardTitle>
            <CardDescription>View and manage all merchant accounts across environments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name, email, merchant ID, or user ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading merchants...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Onboarding</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMerchants.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{m.email || '—'}</TableCell>
                        <TableCell>{getStatusBadge(m.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            m.onboarding_status === 'approved' ? 'text-emerald-600 border-emerald-300' : 'text-amber-600 border-amber-300'
                          }>
                            {m.onboarding_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(m.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedMerchant(m); setDetailOpen(true); }} aria-label="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(m)} aria-label="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {!loading && filteredMerchants.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No merchants found.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Merchant Details</DialogTitle></DialogHeader>
          {selectedMerchant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{selectedMerchant.name}</p></div>
                <div><p className="text-sm text-muted-foreground">Status</p>{getStatusBadge(selectedMerchant.status)}</div>
                {selectedMerchant.email && (
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><p className="text-sm">{selectedMerchant.email}</p></div>
                )}
                {selectedMerchant.phone && (
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><p className="text-sm">{selectedMerchant.phone}</p></div>
                )}
                <div><p className="text-sm text-muted-foreground">Onboarding</p><p className="font-medium">{selectedMerchant.onboarding_status}</p></div>
                <div><p className="text-sm text-muted-foreground">Joined</p><p className="font-medium">{new Date(selectedMerchant.created_at).toLocaleDateString()}</p></div>
              </div>
              {selectedMerchant.source === 'platform' && (
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  <Globe className="h-3 w-3 mr-1" /> Platform OS
                </Badge>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MerchantForm open={openAddMerchant} onOpenChange={setOpenAddMerchant} onSuccess={fetchMerchants} />
    </AppLayout>
  );
}
