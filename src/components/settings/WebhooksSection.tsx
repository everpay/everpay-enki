import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Webhook, Copy, Trash2, Eye, EyeOff, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';

const WEBHOOK_EVENTS = [
  // Payments
  'payment.created', 'payment.authorized', 'payment.captured', 'payment.completed',
  'payment.failed', 'payment.expired', 'payment.canceled',
  // Refunds
  'refund.created', 'refund.processed', 'refund.failed',
  // Disputes & Chargebacks
  'chargeback.created', 'chargeback.updated', 'chargeback.won', 'chargeback.lost',
  'dispute.created', 'dispute.updated', 'dispute.won', 'dispute.lost',
  // Payouts
  'payout.created', 'payout.completed', 'payout.failed',
  // Subscriptions
  'subscription.created', 'subscription.updated', 'subscription.renewed',
  'subscription.canceled', 'subscription.expired', 'subscription.payment_failed',
  // Invoices
  'invoice.created', 'invoice.sent', 'invoice.paid', 'invoice.overdue', 'invoice.voided',
  // Customers
  'customer.created', 'customer.updated', 'customer.deleted',
  // Payment Methods
  'payment_method.attached', 'payment_method.detached', 'payment_method.updated',
  // Payment Links
  'payment_link.completed', 'payment_link.failed', 'payment_link.expired',
];

function useWebhookEndpoints() {
  return useQuery({
    queryKey: ['webhook-endpoints'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('No merchant found');
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useWebhookDeliveries() {
  return useQuery({
    queryKey: ['webhook-deliveries'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('No merchant found');
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*, endpoint:webhook_endpoints(url)')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}

export function WebhooksSection() {
  const { data: endpoints, refetch: refetchEndpoints } = useWebhookEndpoints();
  const { data: deliveries } = useWebhookDeliveries();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('No merchant found');
      const { error } = await supabase.from('webhook_endpoints').insert({
        merchant_id: merchant.id,
        url,
        events: selectedEvents.length > 0 ? selectedEvents : WEBHOOK_EVENTS,
      });
      if (error) throw error;
      toast.success('Webhook endpoint created');
      setOpen(false);
      setUrl('');
      setSelectedEvents([]);
      refetchEndpoints();
    } catch (err) {
      toast.error('Failed to create endpoint');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('webhook_endpoints').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Endpoint deleted');
    refetchEndpoints();
  };

  const handleToggle = async (id: string, active: boolean) => {
    const { error } = await supabase.from('webhook_endpoints').update({ active: !active }).eq('id', id);
    if (error) { toast.error('Failed to update'); return; }
    refetchEndpoints();
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret copied to clipboard');
  };

  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle2 className="h-3 w-3 mr-1" />Delivered</Badge>;
      case 'failed': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default: return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Webhook Endpoints</h3>
          <p className="text-sm text-muted-foreground">Configure endpoints and monitor delivery logs</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" size="sm"><Plus className="h-4 w-4" />Add Endpoint</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Webhook Endpoint</DialogTitle>
              <DialogDescription>We'll send POST requests with signed payloads to this URL.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Endpoint URL</Label>
                <Input placeholder="https://your-server.com/webhooks" value={url} onChange={e => setUrl(e.target.value)} type="url" required />
              </div>
              <div className="space-y-2">
                <Label>Events to subscribe</Label>
                <p className="text-xs text-muted-foreground mb-2">Leave empty to subscribe to all events</p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-border rounded-md p-3">
                  {WEBHOOK_EVENTS.map(event => (
                    <label key={event} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={selectedEvents.includes(event)} onCheckedChange={() => toggleEvent(event)} />
                      <span className="font-mono text-xs">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>{isCreating ? 'Creating...' : 'Create Endpoint'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="deliveries">Delivery Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints">
          <div className="space-y-4">
            {endpoints?.map(ep => (
              <Card key={ep.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Webhook className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm truncate">{ep.url}</span>
                        <Badge variant={ep.active ? 'default' : 'secondary'}>{ep.active ? 'Active' : 'Disabled'}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Secret:</span>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                          {visibleSecrets.has(ep.id) ? ep.secret : '••••••••••••••••'}
                        </code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSecretVisibility(ep.id)}>
                          {visibleSecrets.has(ep.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copySecret(ep.secret)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(ep.events as string[])?.slice(0, 5).map((ev: string) => (
                          <Badge key={ev} variant="outline" className="text-[10px] font-mono">{ev}</Badge>
                        ))}
                        {(ep.events as string[])?.length > 5 && (
                          <Badge variant="outline" className="text-[10px]">+{(ep.events as string[]).length - 5} more</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(ep.id, ep.active)}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(ep.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!endpoints?.length && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Webhook className="h-8 w-8 mb-3 opacity-40" />
                  <p>No webhook endpoints configured</p>
                  <p className="text-sm mt-1">Add an endpoint to receive real-time event notifications</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="deliveries">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Logs</CardTitle>
              <CardDescription>Recent webhook delivery attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries?.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.event_type}</TableCell>
                      <TableCell className="text-xs truncate max-w-[200px]">{d.endpoint?.url}</TableCell>
                      <TableCell>{getDeliveryStatusBadge(d.status)}</TableCell>
                      <TableCell className="font-mono text-xs">{d.response_status || '—'}</TableCell>
                      <TableCell className="text-center">{d.attempt_count}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(d.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {!deliveries?.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No delivery logs yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
