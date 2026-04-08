import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Search, Loader2, Shield, RefreshCw, Ban, History, Key, AlertTriangle, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { revokeToken, rotateToken } from '@/services/tokenization';
import { formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  active: { label: 'Active', variant: 'default', icon: CheckCircle2 },
  inactive: { label: 'Inactive', variant: 'secondary', icon: XCircle },
  expired: { label: 'Expired', variant: 'outline', icon: AlertTriangle },
  revoked: { label: 'Revoked', variant: 'destructive', icon: Ban },
  rotated: { label: 'Rotated', variant: 'secondary', icon: RotateCcw },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="gap-1">
      <Icon className="h-3 w-3" /> {cfg.label}
    </Badge>
  );
}

export default function AdminTokenManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [revokeTarget, setRevokeTarget] = useState<any>(null);
  const [eventsToken, setEventsToken] = useState<string | null>(null);

  const { data: tokens, isLoading } = useQuery({
    queryKey: ['admin-tokens', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('payment_methods')
        .select('id, card_brand, card_last4, exp_month, exp_year, is_default, status, usage_count, last_used_at, network_token_status, card_updater_enabled, created_at, customer_id, merchant_id, previous_token_id')
        .order('created_at', { ascending: false })
        .limit(500);
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['token-events', eventsToken],
    enabled: !!eventsToken,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('token_events' as any)
        .select('*')
        .eq('token_id', eventsToken)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = tokens?.filter((t: any) =>
    !search ||
    (t.card_last4 || '').includes(search) ||
    (t.card_brand || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.customer_id || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.id || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: tokens?.length || 0,
    active: tokens?.filter((t: any) => t.status === 'active').length || 0,
    expired: tokens?.filter((t: any) => t.status === 'expired').length || 0,
    revoked: tokens?.filter((t: any) => t.status === 'revoked').length || 0,
    rotated: tokens?.filter((t: any) => t.status === 'rotated').length || 0,
    networkTokens: tokens?.filter((t: any) => t.network_token_status === 'active').length || 0,
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeToken(revokeTarget.id, revokeTarget.merchant_id, 'admin_revocation');
      toast.success('Token revoked');
      queryClient.invalidateQueries({ queryKey: ['admin-tokens'] });
    } catch {
      toast.error('Failed to revoke token');
    }
    setRevokeTarget(null);
  };

  const handleRunExpiry = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('token-expiry-check');
      if (error) throw error;
      toast.success(`Expiry check complete: ${data?.expired_count || 0} tokens expired`);
      queryClient.invalidateQueries({ queryKey: ['admin-tokens'] });
    } catch {
      toast.error('Failed to run expiry check');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Key className="h-6 w-6 text-primary" /> Token Lifecycle Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor and manage all tokenized payment methods across merchants</p>
          </div>
          <Button onClick={handleRunExpiry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Run Expiry Check
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-6">
          {[
            { label: 'Total Tokens', value: stats.total, icon: CreditCard },
            { label: 'Active', value: stats.active, icon: CheckCircle2 },
            { label: 'Expired', value: stats.expired, icon: AlertTriangle },
            { label: 'Revoked', value: stats.revoked, icon: Ban },
            { label: 'Rotated', value: stats.rotated, icon: RotateCcw },
            { label: 'Network Tokens', value: stats.networkTokens, icon: Shield },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
                <p className="text-xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by last4, brand, ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
              <SelectItem value="rotated">Rotated</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Token Table */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : !filtered?.length ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Tokens Found</p>
          </CardContent></Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand / Last4</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Usage</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Network Token</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((token: any) => (
                    <TableRow key={token.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium capitalize">{token.card_brand || 'Card'}</span>
                          <span className="text-muted-foreground">•••• {token.card_last4}</span>
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={token.status || 'active'} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{token.exp_month}/{token.exp_year}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{token.usage_count || 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {token.last_used_at ? formatDistanceToNow(new Date(token.last_used_at), { addSuffix: true }) : '—'}
                      </TableCell>
                      <TableCell>
                        {token.network_token_status === 'active' ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-xs">Active</Badge>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(token.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setEventsToken(token.id)} title="View History">
                            <History className="h-4 w-4" />
                          </Button>
                          {token.status === 'active' && (
                            <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(token)} title="Revoke">
                              <Ban className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Revoke Dialog */}
        <Dialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revoke Token</DialogTitle>
              <DialogDescription>
                This will permanently revoke the token. Active subscriptions and recurring payments using this token will fail.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <p className="text-sm"><strong>Brand:</strong> {revokeTarget?.card_brand} •••• {revokeTarget?.card_last4}</p>
              <p className="text-sm"><strong>ID:</strong> <code className="text-xs bg-muted px-1 rounded">{revokeTarget?.id}</code></p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRevokeTarget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRevoke}>Revoke Token</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Event History Dialog */}
        <Dialog open={!!eventsToken} onOpenChange={() => setEventsToken(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Token Event History</DialogTitle>
              <DialogDescription>Audit trail for token <code className="text-xs bg-muted px-1 rounded">{eventsToken?.slice(0, 8)}...</code></DialogDescription>
            </DialogHeader>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {eventsLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : !events?.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">No events recorded</p>
              ) : (
                events.map((evt: any) => (
                  <div key={evt.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{evt.event_type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(evt.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                        <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                          {JSON.stringify(evt.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
