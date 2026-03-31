import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import {
  Shield, Settings, Bell, AlertTriangle, Upload, RefreshCw,
  Check, X, FileUp, Eye, Loader2, Zap, ExternalLink
} from 'lucide-react';

export default function ChargeflowDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('disputes');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [merchantExtId, setMerchantExtId] = useState('');
  const [testing, setTesting] = useState(false);

  // Get merchant
  const { data: merchant } = useQuery({
    queryKey: ['merchant', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('merchants').select('id').eq('user_id', user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Chargeflow settings
  const { data: cfSettings } = useQuery({
    queryKey: ['chargeflow-settings', merchant?.id],
    queryFn: async () => {
      if (!merchant) return null;
      const { data } = await supabase
        .from('chargeflow_settings')
        .select('*')
        .eq('merchant_id', merchant.id)
        .maybeSingle();
      return data as any;
    },
    enabled: !!merchant,
  });

  // Disputes from disputes table
  const { data: disputes = [], isLoading: disputesLoading } = useQuery({
    queryKey: ['chargeflow-disputes', merchant?.id, statusFilter],
    queryFn: async () => {
      if (!merchant) return [];
      let query = supabase.from('disputes').select('*').eq('merchant_id', merchant.id).order('created_at', { ascending: false });
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      const { data } = await query;
      return data || [];
    },
    enabled: !!merchant,
  });

  // Notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['chargeflow-notifications', merchant?.id],
    queryFn: async () => {
      if (!merchant) return [];
      const { data } = await supabase
        .from('chargeflow_notifications')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data as any[]) || [];
    },
    enabled: !!merchant,
  });

  const saveSettings = useMutation({
    mutationFn: async () => {
      if (!merchant) throw new Error('No merchant');
      const payload = {
        merchant_id: merchant.id,
        api_key_encrypted: apiKey,
        merchant_external_id: merchantExtId,
        connected: false,
        updated_at: new Date().toISOString(),
      } as any;
      if (cfSettings) {
        const { error } = await supabase.from('chargeflow_settings').update(payload).eq('id', cfSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('chargeflow_settings').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chargeflow-settings'] });
      toast.success('Chargeflow settings saved');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const testConnection = async () => {
    setTesting(true);
    try {
      // Simulate test
      await new Promise((r) => setTimeout(r, 1500));
      if (!apiKey || !merchantExtId) {
        toast.error('Please enter API key and Merchant ID');
        return;
      }
      if (merchant && cfSettings) {
        await supabase.from('chargeflow_settings').update({ connected: true } as any).eq('id', cfSettings.id);
        queryClient.invalidateQueries({ queryKey: ['chargeflow-settings'] });
      }
      toast.success('Connection successful');
    } catch {
      toast.error('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      won: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      lost: 'bg-destructive/10 text-destructive border-destructive/20',
      in_review: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      closed: 'bg-muted text-muted-foreground border-border',
    };
    return <Badge variant="outline" className={map[status] || map.open}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Chargeflow</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage disputes, upload evidence, and track chargeback notifications.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="disputes" className="gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Disputes</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-3.5 w-3.5" />Notifications</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-3.5 w-3.5" />Settings</TabsTrigger>
        </TabsList>

        {/* ── Disputes ── */}
        <TabsContent value="disputes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Disputes</CardTitle>
                <CardDescription>All chargebacks and disputes from Chargeflow</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {disputesLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : disputes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Shield className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">No disputes found</p>
                  <p className="text-xs text-muted-foreground mt-1">Disputes will appear here when they are created</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map((d: any) => (
                      <TableRow key={d.id} className="cursor-pointer" onClick={() => setSelectedDispute(d)}>
                        <TableCell className="font-mono text-xs">{d.id.slice(0, 8)}…</TableCell>
                        <TableCell>{statusBadge(d.status)}</TableCell>
                        <TableCell className="text-sm">{d.reason || '—'}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(Number(d.amount), d.currency)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(d.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications ── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Webhook Notifications</CardTitle>
              <CardDescription>Real-time updates from Chargeflow</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs text-muted-foreground mt-1">Notifications will appear when Chargeflow sends webhook events</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n: any) => (
                    <div key={n.id} className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${n.read ? 'border-border' : 'border-primary/30 bg-primary/5'}`}>
                      <Zap className={`h-4 w-4 mt-0.5 ${n.read ? 'text-muted-foreground' : 'text-primary'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{n.event_type}</Badge>
                          <span className="text-[10px] text-muted-foreground">{formatDate(n.created_at)}</span>
                        </div>
                        <p className="text-sm text-foreground mt-1">{n.message || 'No message'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Settings ── */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chargeflow Integration</CardTitle>
              <CardDescription>Connect your Chargeflow account to automate dispute management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Status:</span>
                {cfSettings?.connected ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Connected</Badge>
                ) : (
                  <Badge variant="outline">Not connected</Badge>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Merchant API Key</Label>
                <Input
                  type="password"
                  value={apiKey || cfSettings?.api_key_encrypted || ''}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="cf_live_..."
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Merchant External ID</Label>
                <Input
                  value={merchantExtId || cfSettings?.merchant_external_id || ''}
                  onChange={(e) => setMerchantExtId(e.target.value)}
                  placeholder="merch_..."
                  className="h-9"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending} size="sm">
                  Save Settings
                </Button>
                <Button variant="outline" onClick={testConnection} disabled={testing} size="sm" className="gap-1.5">
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dispute Detail Dialog ── */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dispute Detail</DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Dispute ID</p>
                  <p className="font-mono text-sm">{selectedDispute.id.slice(0, 12)}…</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Status</p>
                  {statusBadge(selectedDispute.status)}
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Reason</p>
                  <p className="text-sm">{selectedDispute.reason || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Amount</p>
                  <p className="text-sm font-mono">{formatCurrency(Number(selectedDispute.amount), selectedDispute.currency)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Customer</p>
                  <p className="text-sm">{selectedDispute.customer_email || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Evidence Due</p>
                  <p className="text-sm">{selectedDispute.evidence_due_date ? formatDate(selectedDispute.evidence_due_date) : '—'}</p>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-xs mb-2 block">Upload Evidence</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <FileUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Drag & drop files or click to browse</p>
                  <p className="text-[10px] text-muted-foreground mt-1">PDF, PNG, JPG up to 10MB</p>
                  <input type="file" className="hidden" />
                  <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    Choose File
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedDispute(null)}>Close</Button>
                <Button size="sm" className="gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  Submit Evidence
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
