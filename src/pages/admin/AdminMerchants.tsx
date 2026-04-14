import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MerchantForm from '@/components/admin/MerchantForm';
import { Search, UserPlus, Eye, Store, CheckCircle2, XCircle, Clock, Globe, Mail, Phone } from 'lucide-react';

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

  useEffect(() => { fetchMerchants(); }, []);

  const fetchMerchants = async () => {
    try {
      setLoading(true);

      // Use edge function to bypass RLS and get all merchants
      const { data: result, error } = await supabase.functions.invoke('list-merchants');

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      const merchantList = (result?.merchants || []).map((m: any) => ({
        ...m,
        status: m.profile?.onboarding_status === 'approved' ? 'active' : 'pending',
        onboarding_status: m.profile?.onboarding_status || 'pending',
        source: m.source || 'local',
      }));

      setMerchants(merchantList);
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
      // Fallback to direct query
      try {
        const { data: merchantData } = await supabase
          .from('merchants')
          .select('id, name, user_id, email, phone, created_at')
          .order('created_at', { ascending: false });

        setMerchants((merchantData || []).map(m => ({
          ...m,
          status: 'pending',
          onboarding_status: 'pending',
          source: 'direct',
        })));
      } catch {
        toast({ title: 'Error', description: 'Failed to load merchants', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredMerchants = merchants.filter(m => {
    const matchesSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchTerm.toLowerCase());
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
            <h1 className="text-3xl font-bold tracking-tight">Merchants</h1>
            <p className="text-muted-foreground">Manage merchant accounts, onboarding, and access</p>
          </div>
          <Button onClick={() => setOpenAddMerchant(true)}>
            <UserPlus className="mr-2 h-4 w-4" />Add Merchant
          </Button>
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
                <Input placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
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
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedMerchant(m); setDetailOpen(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
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
