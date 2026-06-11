import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Plus, Trash2, ShieldCheck, KeyRound, Server, Settings2, ListChecks, Pencil } from 'lucide-react';

type AcsMerchant = {
  id: string;
  merchant_name: string;
  acs_merchant_id: string;
  acquirer_bin: string | null;
  acquirer_merchant_id: string | null;
  acquirer_name: string | null;
  country: string | null;
  mcc: string | null;
  merchant_url: string | null;
  status: string;
};

type AcsUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  master_auth_enabled: boolean;
  client_cert_fingerprint: string | null;
  client_cert_expires_at: string | null;
  last_login_at: string | null;
};

type RequestorConfig = {
  id: string;
  acs_merchant_id: string;
  requestor_id: string;
  requestor_name: string;
  requestor_url: string | null;
  api_version: string;
  supported_brands: string[];
  message_extensions: any;
  decoupled_auth_enabled: boolean;
  three_ri_enabled: boolean;
  whitelisting_enabled: boolean;
  threeds_method_url: string | null;
  notification_url: string | null;
  result_endpoint_url: string | null;
  enabled: boolean;
};

const emptyMerchant: Partial<AcsMerchant> = {
  merchant_name: '',
  acs_merchant_id: '',
  acquirer_bin: '',
  acquirer_merchant_id: '',
  acquirer_name: '',
  country: '',
  mcc: '',
  merchant_url: '',
  status: 'ENABLED',
};

export default function AdminActiveServer3DS() {
  // ── Merchants tab ─────────────────────────────────────────────
  const [merchants, setMerchants] = useState<AcsMerchant[]>([]);
  const [loadingM, setLoadingM] = useState(true);
  const [nameQ, setNameQ] = useState('');
  const [idQ, setIdQ] = useState('');
  const [binQ, setBinQ] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [editM, setEditM] = useState<Partial<AcsMerchant> | null>(null);
  const [selectedM, setSelectedM] = useState<AcsMerchant | null>(null);

  async function loadMerchants() {
    setLoadingM(true);
    const { data, error } = await supabase
      .from('threeds_acs_merchants' as any)
      .select('*')
      .order('merchant_name');
    if (error) toast.error(error.message);
    setMerchants((data as any) || []);
    setLoadingM(false);
  }

  // ── Users tab ────────────────────────────────────────────────
  const [users, setUsers] = useState<AcsUser[]>([]);
  const [loadingU, setLoadingU] = useState(true);
  const [editU, setEditU] = useState<Partial<AcsUser> & { client_cert_pem?: string } | null>(null);

  async function loadUsers() {
    setLoadingU(true);
    const { data, error } = await supabase
      .from('threeds_acs_users' as any)
      .select('*')
      .order('email');
    if (error) toast.error(error.message);
    setUsers((data as any) || []);
    setLoadingU(false);
  }

  // ── Requestor config tab ─────────────────────────────────────
  const [configs, setConfigs] = useState<RequestorConfig[]>([]);
  const [loadingC, setLoadingC] = useState(true);
  const [editC, setEditC] = useState<Partial<RequestorConfig> | null>(null);

  async function loadConfigs() {
    setLoadingC(true);
    const { data, error } = await supabase
      .from('threeds_requestor_config' as any)
      .select('*')
      .order('requestor_name');
    if (error) toast.error(error.message);
    setConfigs((data as any) || []);
    setLoadingC(false);
  }

  useEffect(() => { loadMerchants(); loadUsers(); loadConfigs(); }, []);

  const filteredMerchants = useMemo(() => {
    const n = nameQ.trim().toLowerCase();
    const i = idQ.trim().toLowerCase();
    const b = binQ.trim().toLowerCase();
    return merchants.filter(m =>
      (!n || m.merchant_name.toLowerCase().includes(n)) &&
      (!i || m.acs_merchant_id.toLowerCase().includes(i)) &&
      (!b || (m.acquirer_bin || '').toLowerCase().includes(b))
    );
  }, [merchants, nameQ, idQ, binQ]);

  async function saveMerchant() {
    if (!editM) return;
    if (!editM.merchant_name || !editM.acs_merchant_id) {
      toast.error('Merchant name and Merchant ID are required');
      return;
    }
    const payload: any = { ...editM };
    delete payload.created_at; delete payload.updated_at;
    let res;
    if (editM.id) {
      res = await supabase.from('threeds_acs_merchants' as any).update(payload).eq('id', editM.id);
    } else {
      res = await supabase.from('threeds_acs_merchants' as any).insert(payload);
    }
    if (res.error) return toast.error(res.error.message);
    toast.success('Merchant saved');
    setEditM(null);
    loadMerchants();
  }

  async function deleteMerchant(id: string) {
    if (!confirm('Delete this 3DS merchant?')) return;
    const { error } = await supabase.from('threeds_acs_merchants' as any).delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted'); loadMerchants();
  }

  async function saveUser() {
    if (!editU || !editU.email) return toast.error('Email required');
    const payload: any = { ...editU };
    delete payload.created_at; delete payload.updated_at; delete payload.last_login_at;
    if (payload.client_cert_pem) {
      // Compute SHA-256 fingerprint
      const enc = new TextEncoder().encode(payload.client_cert_pem);
      const hash = await crypto.subtle.digest('SHA-256', enc);
      payload.client_cert_fingerprint = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
    }
    let res;
    if (editU.id) {
      res = await supabase.from('threeds_acs_users' as any).update(payload).eq('id', editU.id);
    } else {
      res = await supabase.from('threeds_acs_users' as any).insert(payload);
    }
    if (res.error) return toast.error(res.error.message);
    toast.success('User saved'); setEditU(null); loadUsers();
  }

  async function saveConfig() {
    if (!editC || !editC.acs_merchant_id || !editC.requestor_id || !editC.requestor_name) {
      return toast.error('Merchant, Requestor ID and Name required');
    }
    const payload: any = { ...editC };
    delete payload.created_at; delete payload.updated_at;
    if (typeof payload.supported_brands === 'string') {
      payload.supported_brands = payload.supported_brands.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    let res;
    if (editC.id) {
      res = await supabase.from('threeds_requestor_config' as any).update(payload).eq('id', editC.id);
    } else {
      res = await supabase.from('threeds_requestor_config' as any).insert(payload);
    }
    if (res.error) return toast.error(res.error.message);
    toast.success('Configuration saved'); setEditC(null); loadConfigs();
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            ActiveServer 3DS Administration
          </h1>
          <p className="text-muted-foreground">
            Manage ACS operator users (master auth + client certificates), the 3DS merchant directory,
            and per-merchant 3DS Requestor / Backend v2 / Features configuration.
          </p>
        </div>

        <Tabs defaultValue="merchants" className="space-y-4">
          <TabsList>
            <TabsTrigger value="merchants"><Server className="h-4 w-4 mr-2" />Merchants</TabsTrigger>
            <TabsTrigger value="users"><KeyRound className="h-4 w-4 mr-2" />User profile &amp; Master auth</TabsTrigger>
            <TabsTrigger value="config"><Settings2 className="h-4 w-4 mr-2" />Requestor config</TabsTrigger>
            <TabsTrigger value="features"><ListChecks className="h-4 w-4 mr-2" />Features</TabsTrigger>
          </TabsList>

          {/* ──────────── Merchants tab ──────────── */}
          <TabsContent value="merchants">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Merchant list</CardTitle>
                    <CardDescription>Select a row to view details.</CardDescription>
                  </div>
                  <Button onClick={() => setEditM({ ...emptyMerchant })}><Plus className="h-4 w-4 mr-2" />New</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4 items-end border-b pb-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Merchant name</Label>
                    <Input placeholder="Merchant name" value={nameQ} onChange={e => setNameQ(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Merchant ID</Label>
                    <Input placeholder="Merchant ID" value={idQ} onChange={e => setIdQ(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Acquirer BIN</Label>
                    <Input placeholder="Acquirer BIN" value={binQ} onChange={e => setBinQ(e.target.value)} />
                  </div>
                  <Button variant="outline" onClick={() => { setNameQ(''); setIdQ(''); setBinQ(''); }}>Clear</Button>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Display</span>
                    <Select value={String(pageSize)} onValueChange={v => setPageSize(parseInt(v))}>
                      <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <span>Records</span>
                  </div>
                  <div>Showing 1 to {Math.min(filteredMerchants.length, pageSize)} of {filteredMerchants.length} Merchants.</div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Merchant name</TableHead>
                        <TableHead>Merchant ID</TableHead>
                        <TableHead>Acquirer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-32 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingM ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Loading…</TableCell></TableRow>
                      ) : filteredMerchants.slice(0, pageSize).map(m => (
                        <TableRow key={m.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedM(m)}>
                          <TableCell className="font-medium text-primary">{m.merchant_name}</TableCell>
                          <TableCell className="font-mono text-primary">{m.acs_merchant_id}</TableCell>
                          <TableCell>{m.acquirer_bin || m.acquirer_name || '—'}</TableCell>
                          <TableCell>
                            <Badge variant={m.status === 'ENABLED' ? 'default' : 'secondary'}>{m.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                            <Button size="icon" variant="ghost" onClick={() => setEditM(m)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteMerchant(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ──────────── Users tab ──────────── */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User profile &amp; Master auth</CardTitle>
                    <CardDescription>Operator accounts, role assignment, and API client certificates for Master auth.</CardDescription>
                  </div>
                  <Button onClick={() => setEditU({ email: '', role: 'operator', status: 'active', master_auth_enabled: false })}>
                    <Plus className="h-4 w-4 mr-2" />New user
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Master auth</TableHead>
                        <TableHead>Client cert fingerprint</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-32 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingU ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Loading…</TableCell></TableRow>
                      ) : users.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No operator users yet.</TableCell></TableRow>
                      ) : users.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell>{u.full_name || '—'}</TableCell>
                          <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={u.master_auth_enabled ? 'default' : 'secondary'}>
                              {u.master_auth_enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[260px] truncate" title={u.client_cert_fingerprint || ''}>
                            {u.client_cert_fingerprint || '—'}
                          </TableCell>
                          <TableCell><Badge variant={u.status === 'active' ? 'default' : 'destructive'}>{u.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" onClick={() => setEditU(u)}><Pencil className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ──────────── Requestor config tab ──────────── */}
          <TabsContent value="config">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>3DS Requestor &amp; Backend v2 configuration</CardTitle>
                    <CardDescription>Per-merchant 3DS Requestor identity, API version, message extensions, and Backend v2 callback URLs.</CardDescription>
                  </div>
                  <Button onClick={() => setEditC({ api_version: '2.2.0', supported_brands: ['visa','mastercard','amex','jcb','discover'], message_extensions: [], decoupled_auth_enabled: false, three_ri_enabled: false, whitelisting_enabled: true, enabled: true })}>
                    <Plus className="h-4 w-4 mr-2" />New configuration
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requestor</TableHead>
                        <TableHead>Merchant</TableHead>
                        <TableHead>API version</TableHead>
                        <TableHead>Supported brands</TableHead>
                        <TableHead>Backend v2 URL</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-24 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingC ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Loading…</TableCell></TableRow>
                      ) : configs.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No requestor configurations yet.</TableCell></TableRow>
                      ) : configs.map(c => {
                        const m = merchants.find(x => x.id === c.acs_merchant_id);
                        return (
                          <TableRow key={c.id}>
                            <TableCell>
                              <div className="font-medium">{c.requestor_name}</div>
                              <div className="text-xs text-muted-foreground font-mono">{c.requestor_id}</div>
                            </TableCell>
                            <TableCell>{m?.merchant_name || '—'}</TableCell>
                            <TableCell><Badge variant="outline">{c.api_version}</Badge></TableCell>
                            <TableCell className="text-xs">{(c.supported_brands || []).join(', ')}</TableCell>
                            <TableCell className="font-mono text-xs max-w-[220px] truncate">{c.notification_url || '—'}</TableCell>
                            <TableCell><Badge variant={c.enabled ? 'default' : 'secondary'}>{c.enabled ? 'Enabled' : 'Disabled'}</Badge></TableCell>
                            <TableCell className="text-right">
                              <Button size="icon" variant="ghost" onClick={() => setEditC(c as any)}><Pencil className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ──────────── Features tab ──────────── */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>ActiveServer features</CardTitle>
                <CardDescription>Toggle protocol features per requestor configuration.</CardDescription>
              </CardHeader>
              <CardContent>
                {configs.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">Create a requestor configuration first.</div>
                ) : (
                  <div className="space-y-4">
                    {configs.map(c => (
                      <div key={c.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{c.requestor_name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{c.requestor_id} · {c.api_version}</div>
                          </div>
                          <Badge variant={c.enabled ? 'default' : 'secondary'}>{c.enabled ? 'Enabled' : 'Disabled'}</Badge>
                        </div>
                        <div className="grid gap-3 md:grid-cols-4">
                          <FeatureToggle label="Decoupled authentication" value={c.decoupled_auth_enabled}
                            onChange={v => updateFeature(c.id, { decoupled_auth_enabled: v })} />
                          <FeatureToggle label="3RI (3DS Requestor Initiated)" value={c.three_ri_enabled}
                            onChange={v => updateFeature(c.id, { three_ri_enabled: v })} />
                          <FeatureToggle label="Whitelisting" value={c.whitelisting_enabled}
                            onChange={v => updateFeature(c.id, { whitelisting_enabled: v })} />
                          <FeatureToggle label="Active" value={c.enabled}
                            onChange={v => updateFeature(c.id, { enabled: v })} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Merchant edit dialog ── */}
      <Dialog open={!!editM} onOpenChange={o => !o && setEditM(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editM?.id ? 'Edit merchant' : 'New merchant'}</DialogTitle></DialogHeader>
          {editM && (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Merchant name *"><Input value={editM.merchant_name || ''} onChange={e => setEditM({ ...editM, merchant_name: e.target.value })} /></Field>
              <Field label="Merchant ID * (12–15 digits)"><Input value={editM.acs_merchant_id || ''} onChange={e => setEditM({ ...editM, acs_merchant_id: e.target.value })} /></Field>
              <Field label="Acquirer BIN"><Input value={editM.acquirer_bin || ''} onChange={e => setEditM({ ...editM, acquirer_bin: e.target.value })} /></Field>
              <Field label="Acquirer Merchant ID"><Input value={editM.acquirer_merchant_id || ''} onChange={e => setEditM({ ...editM, acquirer_merchant_id: e.target.value })} /></Field>
              <Field label="Acquirer name"><Input value={editM.acquirer_name || ''} onChange={e => setEditM({ ...editM, acquirer_name: e.target.value })} /></Field>
              <Field label="Country (ISO-2)"><Input value={editM.country || ''} onChange={e => setEditM({ ...editM, country: e.target.value })} /></Field>
              <Field label="MCC"><Input value={editM.mcc || ''} onChange={e => setEditM({ ...editM, mcc: e.target.value })} /></Field>
              <Field label="Merchant URL"><Input value={editM.merchant_url || ''} onChange={e => setEditM({ ...editM, merchant_url: e.target.value })} /></Field>
              <Field label="Status">
                <Select value={editM.status || 'ENABLED'} onValueChange={v => setEditM({ ...editM, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENABLED">ENABLED</SelectItem>
                    <SelectItem value="DISABLED">DISABLED</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditM(null)}>Cancel</Button>
            <Button onClick={saveMerchant}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Merchant detail dialog ── */}
      <Dialog open={!!selectedM} onOpenChange={o => !o && setSelectedM(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedM?.merchant_name}</DialogTitle></DialogHeader>
          {selectedM && (
            <div className="grid gap-2 text-sm">
              <DetailRow label="Merchant ID" value={selectedM.acs_merchant_id} />
              <DetailRow label="Acquirer BIN" value={selectedM.acquirer_bin || '—'} />
              <DetailRow label="Acquirer Merchant ID" value={selectedM.acquirer_merchant_id || '—'} />
              <DetailRow label="Acquirer name" value={selectedM.acquirer_name || '—'} />
              <DetailRow label="Country" value={selectedM.country || '—'} />
              <DetailRow label="MCC" value={selectedM.mcc || '—'} />
              <DetailRow label="URL" value={selectedM.merchant_url || '—'} />
              <DetailRow label="Status" value={selectedM.status} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── User edit dialog ── */}
      <Dialog open={!!editU} onOpenChange={o => !o && setEditU(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editU?.id ? 'Edit user' : 'New user'}</DialogTitle></DialogHeader>
          {editU && (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Email *"><Input value={editU.email || ''} onChange={e => setEditU({ ...editU, email: e.target.value })} /></Field>
              <Field label="Full name"><Input value={editU.full_name || ''} onChange={e => setEditU({ ...editU, full_name: e.target.value })} /></Field>
              <Field label="Role">
                <Select value={editU.role || 'operator'} onValueChange={v => setEditU({ ...editU, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="master">Master</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={editU.status || 'active'} onValueChange={v => setEditU({ ...editU, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="md:col-span-2 flex items-center gap-3 p-3 border rounded-md">
                <Switch checked={!!editU.master_auth_enabled} onCheckedChange={v => setEditU({ ...editU, master_auth_enabled: v })} />
                <div>
                  <div className="font-medium text-sm">Master auth (API client certificate)</div>
                  <div className="text-xs text-muted-foreground">When enabled, this user authenticates to the Master Auth API via mutual TLS using the certificate below.</div>
                </div>
              </div>
              <div className="md:col-span-2">
                <Field label="Client certificate (PEM)">
                  <Textarea
                    rows={8}
                    placeholder="-----BEGIN CERTIFICATE-----&#10;…&#10;-----END CERTIFICATE-----"
                    value={editU.client_cert_pem || ''}
                    onChange={e => setEditU({ ...editU, client_cert_pem: e.target.value })}
                  />
                </Field>
                {editU.client_cert_fingerprint && (
                  <div className="text-xs text-muted-foreground mt-1 font-mono break-all">Fingerprint: {editU.client_cert_fingerprint}</div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditU(null)}>Cancel</Button>
            <Button onClick={saveUser}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Requestor config edit dialog ── */}
      <Dialog open={!!editC} onOpenChange={o => !o && setEditC(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editC?.id ? 'Edit configuration' : 'New requestor configuration'}</DialogTitle></DialogHeader>
          {editC && (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Merchant *">
                <Select value={editC.acs_merchant_id || ''} onValueChange={v => setEditC({ ...editC, acs_merchant_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select merchant" /></SelectTrigger>
                  <SelectContent>
                    {merchants.map(m => <SelectItem key={m.id} value={m.id}>{m.merchant_name} · {m.acs_merchant_id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="API version">
                <Select value={editC.api_version || '2.2.0'} onValueChange={v => setEditC({ ...editC, api_version: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2.1.0">2.1.0</SelectItem>
                    <SelectItem value="2.2.0">2.2.0</SelectItem>
                    <SelectItem value="2.3.0">2.3.0</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Requestor ID *"><Input value={editC.requestor_id || ''} onChange={e => setEditC({ ...editC, requestor_id: e.target.value })} /></Field>
              <Field label="Requestor name *"><Input value={editC.requestor_name || ''} onChange={e => setEditC({ ...editC, requestor_name: e.target.value })} /></Field>
              <Field label="Requestor URL"><Input value={editC.requestor_url || ''} onChange={e => setEditC({ ...editC, requestor_url: e.target.value })} /></Field>
              <Field label="Supported brands (comma-separated)">
                <Input
                  value={Array.isArray(editC.supported_brands) ? editC.supported_brands.join(', ') : (editC.supported_brands as any || '')}
                  onChange={e => setEditC({ ...editC, supported_brands: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                />
              </Field>
              <Field label="3DS Method URL"><Input value={editC.threeds_method_url || ''} onChange={e => setEditC({ ...editC, threeds_method_url: e.target.value })} /></Field>
              <Field label="Backend v2 notification URL"><Input value={editC.notification_url || ''} onChange={e => setEditC({ ...editC, notification_url: e.target.value })} /></Field>
              <Field label="Result endpoint URL"><Input value={editC.result_endpoint_url || ''} onChange={e => setEditC({ ...editC, result_endpoint_url: e.target.value })} /></Field>
              <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3 p-3 border rounded-md">
                <FeatureToggle label="Decoupled auth" value={!!editC.decoupled_auth_enabled} onChange={v => setEditC({ ...editC, decoupled_auth_enabled: v })} />
                <FeatureToggle label="3RI" value={!!editC.three_ri_enabled} onChange={v => setEditC({ ...editC, three_ri_enabled: v })} />
                <FeatureToggle label="Whitelisting" value={!!editC.whitelisting_enabled} onChange={v => setEditC({ ...editC, whitelisting_enabled: v })} />
                <FeatureToggle label="Enabled" value={editC.enabled ?? true} onChange={v => setEditC({ ...editC, enabled: v })} />
              </div>
              <Field label="Message extensions (JSON)" className="md:col-span-2">
                <Textarea rows={4}
                  value={typeof editC.message_extensions === 'string' ? editC.message_extensions : JSON.stringify(editC.message_extensions ?? [], null, 2)}
                  onChange={e => {
                    try { setEditC({ ...editC, message_extensions: JSON.parse(e.target.value) }); }
                    catch { setEditC({ ...editC, message_extensions: e.target.value as any }); }
                  }}
                />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditC(null)}>Cancel</Button>
            <Button onClick={saveConfig}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );

  async function updateFeature(id: string, patch: Partial<RequestorConfig>) {
    const { error } = await supabase.from('threeds_requestor_config' as any).update(patch).eq('id', id);
    if (error) return toast.error(error.message);
    loadConfigs();
  }
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1 border-b last:border-0">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2 font-mono">{value}</div>
    </div>
  );
}

function FeatureToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Switch checked={value} onCheckedChange={onChange} />
      <span>{label}</span>
    </label>
  );
}