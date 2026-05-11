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
import { Search, UserPlus, Eye, Store, CheckCircle2, XCircle, Clock, Globe, Mail, Phone, Pencil, Loader2, Send, RefreshCw, Link2, History, ShieldCheck } from 'lucide-react';
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
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [reconcileQuery, setReconcileQuery] = useState('');
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [reconcileResults, setReconcileResults] = useState<any[]>([]);
  const [linkTarget, setLinkTarget] = useState<{ merchant_id?: string; user_id?: string } | null>(null);
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
    setEditErrors({});
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selectedMerchant) return;
    setSavingEdit(true);
    setEditErrors({});
    try {
      const res = await externalProxy({
        action: 'update_merchant',
        merchant_id: selectedMerchant.id,
        patch: { name: editForm.name, email: editForm.email || null, phone: editForm.phone || null, status: editForm.status },
      });
      if (res?.field_errors) {
        setEditErrors(res.field_errors);
        toast({ title: 'Validation failed', description: res.error || 'Please fix the highlighted fields', variant: 'destructive' });
        return;
      }
      toast({ title: 'Merchant updated' });
      setEditOpen(false);
      await fetchMerchants();
    } catch (e: any) {
      const fe = e?.field_errors || e?.data?.field_errors;
      if (fe) setEditErrors(fe);
      toast({ title: 'Update failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    } finally { setSavingEdit(false); }
  };

  const loadAuditLog = async (merchant_id: string) => {
    try {
      const r = await externalProxy({ action: 'merchant_audit_log', merchant_id });
      setAuditLog(r.data || []);
    } catch { setAuditLog([]); }
  };

  const openDetail = async (m: MerchantRow) => {
    setSelectedMerchant(m);
    setDetailOpen(true);
    setAuditLog([]);
    loadAuditLog(m.id);
  };

  const runReconcileSearch = async () => {
    if (reconcileQuery.trim().length < 2) return;
    setReconcileLoading(true);
    try {
      const r = await externalProxy({ action: 'search_user_reconciliation', q: reconcileQuery.trim() });
      setReconcileResults(r.data || []);
    } catch (e: any) {
      toast({ title: 'Search failed', description: e?.message, variant: 'destructive' });
    } finally { setReconcileLoading(false); }
  };

  const linkUserToMerchant = async (merchant_id: string, user_id: string) => {
    try {
      await externalProxy({ action: 'link_merchant_user', merchant_id, user_id });
      toast({ title: 'Linked', description: 'User linked to merchant' });
      await fetchMerchants();
      await runReconcileSearch();
    } catch (e: any) {
      toast({ title: 'Link failed', description: e?.message, variant: 'destructive' });
    }
  };

  const resendInvite = async (email: string, merchant_id?: string) => {
    try {
      await externalProxy({ action: 'resend_invite', email, merchant_id });
      toast({ title: 'Invite sent', description: email });
    } catch (e: any) {
      toast({ title: 'Invite failed', description: e?.message, variant: 'destructive' });
    }
  };

  const syncMerchant = async (merchant_id: string) => {
    try {
      const r = await externalProxy({ action: 'sync_merchant_records', merchant_id });
      const s = r.summary || {};
      toast({ title: 'Sync complete', description: `Transactions: ${s.transactions || 0}, Provider events: ${s.provider_events || 0}` });
    } catch (e: any) {
      toast({ title: 'Sync failed', description: e?.message, variant: 'destructive' });
    }
  };

  const [approving, setApproving] = useState<string | null>(null);
  const [bulkApproving, setBulkApproving] = useState(false);

  const approveMerchant = async (m: MerchantRow) => {
    setApproving(m.id);
    try {
      const r = await externalProxy({
        action: 'approve_merchant',
        merchant_id: m.id,
        user_id: m.user_id,
        name: m.name,
        email: m.email,
      });
      if (r?.ok) {
        toast({ title: 'Merchant approved', description: `${m.email || m.name} • KYB docs approved: ${r.kyb_approved ?? 0}` });
        await fetchMerchants();
      } else {
        toast({ title: 'Approval failed', description: r?.error || 'Unknown error', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Approval failed', description: e?.message, variant: 'destructive' });
    } finally { setApproving(null); }
  };

  const approveAll = async () => {
    if (!confirm('Approve ALL merchants and mark their KYB documents as approved? This applies to every user in the production environment.')) return;
    setBulkApproving(true);
    try {
      const r = await externalProxy({ action: 'approve_all_merchants' });
      const s = r?.summary || {};
      toast({ title: 'Bulk approval complete', description: `Approved ${s.approved}/${s.total} (failed: ${s.failed})` });
      await fetchMerchants();
    } catch (e: any) {
      toast({ title: 'Bulk approval failed', description: e?.message, variant: 'destructive' });
    } finally { setBulkApproving(false); }
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
            <Button variant="outline" onClick={() => setReconcileOpen(true)}>
              <Search className="mr-2 h-4 w-4" />Reconcile
            </Button>
            <Button variant="outline" onClick={approveAll} disabled={bulkApproving}>
              {bulkApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Approve all
            </Button>
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
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => openDetail(m)} aria-label="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(m)} aria-label="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {m.email && (
                              <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => resendInvite(m.email!, m.id)} aria-label="Resend invite" title="Resend invite">
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => syncMerchant(m.id)} aria-label="Sync records" title="Sync records">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            {m.onboarding_status !== 'approved' && (
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700"
                                onClick={() => approveMerchant(m)}
                                disabled={approving === m.id}
                                aria-label="Approve merchant"
                                title="Approve (KYB + onboarding)"
                              >
                                {approving === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                              </Button>
                            )}
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
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
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
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><History className="h-4 w-4" /> Audit log</h3>
                  <Button size="sm" variant="ghost" onClick={() => loadAuditLog(selectedMerchant.id)}>Refresh</Button>
                </div>
                {auditLog.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No audit entries.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {auditLog.map((a: any) => (
                      <div key={a.id} className="rounded border bg-muted/20 p-2 text-xs">
                        <div className="flex justify-between">
                          <span className="font-medium">{a.action}</span>
                          <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                        </div>
                        <div className="text-muted-foreground">By: {a.metadata?.reviewer_email || a.metadata?.by || a.user_id || '—'}</div>
                        {a.metadata?.diff && (
                          <div className="mt-1 space-y-0.5">
                            {Object.entries(a.metadata.diff).map(([k, v]: any) => (
                              <div key={k} className="font-mono text-[11px]">
                                {k}: <span className="text-red-600">{String(v.old ?? '∅')}</span> → <span className="text-emerald-600">{String(v.new ?? '∅')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MerchantForm open={openAddMerchant} onOpenChange={setOpenAddMerchant} onSuccess={fetchMerchants} />

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader><DialogTitle>Edit Merchant</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="h-12" aria-invalid={!!editErrors.name} />
              {editErrors.name && <p className="text-xs text-destructive mt-1">{editErrors.name}</p>}
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="h-12" aria-invalid={!!editErrors.email} />
              {editErrors.email && <p className="text-xs text-destructive mt-1">{editErrors.email}</p>}
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="h-12" />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              {editErrors.status && <p className="text-xs text-destructive mt-1">{editErrors.status}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={saveEdit} disabled={savingEdit}>
                {savingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reconcile dialog */}
      <Dialog open={reconcileOpen} onOpenChange={setReconcileOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Find & link missing merchant users</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Search by email or name (e.g. globeandgo18@gmail.com)" value={reconcileQuery} onChange={e => setReconcileQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') runReconcileSearch(); }} className="h-11" />
              <Button onClick={runReconcileSearch} disabled={reconcileLoading || reconcileQuery.trim().length < 2}>
                {reconcileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {reconcileResults.length === 0 && !reconcileLoading && (
              <p className="text-xs text-muted-foreground">No results yet. Search across local + production environments.</p>
            )}
            <div className="space-y-2">
              {reconcileResults.map((r: any, i: number) => (
                <div key={i} className="rounded-md border p-3 text-sm flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.name || r.email || r.user_id}</span>
                      <Badge variant="outline" className="text-[10px]">{r.source}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                    {r.id && <div className="text-[11px] font-mono text-muted-foreground">merchant_id: {r.id}</div>}
                    {r.user_id && <div className="text-[11px] font-mono text-muted-foreground">user_id: {r.user_id}</div>}
                  </div>
                  <div className="flex flex-col gap-1">
                    {r.source === 'auth_user' && (
                      <>
                        <Select onValueChange={(mid) => linkUserToMerchant(mid, r.user_id)}>
                          <SelectTrigger className="h-8 text-xs w-[180px]"><SelectValue placeholder="Link to merchant…" /></SelectTrigger>
                          <SelectContent>
                            {merchants.map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                    {r.email && (
                      <Button size="sm" variant="outline" onClick={() => resendInvite(r.email, r.id)}>
                        <Send className="h-3 w-3 mr-1" /> Invite
                      </Button>
                    )}
                    {r.id && (
                      <Button size="sm" variant="outline" onClick={() => syncMerchant(r.id)}>
                        <RefreshCw className="h-3 w-3 mr-1" /> Sync
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
