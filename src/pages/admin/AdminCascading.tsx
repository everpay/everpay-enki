import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowUpDown, Plus, Trash2, Loader2, Shield, RotateCcw, ArrowRight, Zap, Globe, Search, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PROCESSORS = ['shieldhub', 'mondo', 'moneto', 'paygate10', 'facilitapay', 'ofa', 'makapay', 'lipad', 'payok', 'prometeo'];

export default function AdminCascading() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState('');
  const [primaryProcessor, setPrimaryProcessor] = useState('shieldhub');
  const [fallbackProcessor, setFallbackProcessor] = useState('mondo');
  const [priority, setPriority] = useState('0');
  const [ruleName, setRuleName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: merchants } = useQuery({
    queryKey: ['admin-merchants-cascade'],
    queryFn: async () => {
      const { data, error } = await supabase.from('merchants').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ['admin-cascade-routes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routing_rules')
        .select('*, merchants:merchant_id(name)')
        .order('priority', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: attempts } = useQuery({
    queryKey: ['admin-cascade-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_attempts')
        .select('id, transaction_id, provider, status, attempt_number, response_code, response_message, latency_ms, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const handleAddRule = async () => {
    if (!selectedMerchant || !ruleName) { toast.error('Name and merchant required'); return; }
    try {
      const { error } = await supabase.from('routing_rules').insert({
        merchant_id: selectedMerchant,
        name: ruleName,
        target_provider: primaryProcessor,
        fallback_provider: fallbackProcessor,
        priority: parseInt(priority) || 0,
      });
      if (error) throw error;
      toast.success('Cascade rule added');
      setShowAdd(false);
      setRuleName('');
      queryClient.invalidateQueries({ queryKey: ['admin-cascade-routes'] });
    } catch { toast.error('Failed to add rule'); }
  };

  const handleToggle = async (id: string, active: boolean) => {
    const { error } = await supabase.from('routing_rules').update({ active, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error('Update failed');
    else queryClient.invalidateQueries({ queryKey: ['admin-cascade-routes'] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('routing_rules').delete().eq('id', id);
    if (error) toast.error('Delete failed');
    else { toast.success('Deleted'); queryClient.invalidateQueries({ queryKey: ['admin-cascade-routes'] }); }
  };

  // Group attempts by transaction for cascade visualization
  const cascadeGroups = attempts ? Object.values(
    attempts.reduce((acc: Record<string, any[]>, a: any) => {
      if (!acc[a.transaction_id]) acc[a.transaction_id] = [];
      acc[a.transaction_id].push(a);
      return acc;
    }, {})
  ).filter((g: any) => g.length > 1).slice(0, 20) : [];

  const filteredRoutes = routes?.filter((r: any) =>
    !searchQuery || 
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.merchants as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalRules = routes?.length || 0;
  const activeRules = routes?.filter((r: any) => r.active).length || 0;
  const cascadeEvents = cascadeGroups.length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Cascading Payments</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage failover routing, processor stacking, and cascade history</p>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Add Cascade Rule</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Cascade Rule</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Rule Name *</Label>
                  <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="e.g. EU Card Failover" />
                </div>
                <div className="space-y-2">
                  <Label>Merchant *</Label>
                  <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
                    <SelectTrigger><SelectValue placeholder="Select merchant" /></SelectTrigger>
                    <SelectContent>{merchants?.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Primary Processor</Label>
                    <Select value={primaryProcessor} onValueChange={setPrimaryProcessor}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PROCESSORS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fallback Processor</Label>
                    <Select value={fallbackProcessor} onValueChange={setFallbackProcessor}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PROCESSORS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Priority (lower = first)</Label>
                  <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleAddRule}>Create Cascade Rule</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Rules</p><p className="text-2xl font-bold">{totalRules}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Active Rules</p><p className="text-2xl font-bold text-primary">{activeRules}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Cascade Events</p><p className="text-2xl font-bold">{cascadeEvents}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Processors</p><p className="text-2xl font-bold">{PROCESSORS.length}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="rules" className="space-y-4">
          <TabsList>
            <TabsTrigger value="rules">Routing Rules</TabsTrigger>
            <TabsTrigger value="history">Cascade History</TabsTrigger>
            <TabsTrigger value="strategy">Routing Strategy</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search rules..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>

            {routesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : !filteredRoutes?.length ? (
              <Card><CardContent className="flex flex-col items-center py-12">
                <ArrowUpDown className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No Cascade Rules</p>
                <p className="text-sm text-muted-foreground">Add routing rules to enable automatic failover</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {filteredRoutes.map((rule: any) => (
                  <Card key={rule.id} className="hover:border-primary/20 transition-colors">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{rule.name}</span>
                            <Badge variant="outline">P{rule.priority}</Badge>
                            {!rule.active && <Badge variant="secondary">Disabled</Badge>}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{(rule.merchants as any)?.name || 'Unknown'}</span>
                            <span>•</span>
                            <Badge className="text-xs bg-primary/10 text-primary border-0">{rule.target_provider}</Badge>
                            {rule.fallback_provider && (
                              <>
                                <ArrowRight className="h-3 w-3" />
                                <Badge className="text-xs bg-amber-500/10 text-amber-600 border-0">{rule.fallback_provider}</Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={rule.active} onCheckedChange={(v) => handleToggle(rule.id, v)} />
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {cascadeGroups.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center py-12">
                <RotateCcw className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No Cascade Events Yet</p>
                <p className="text-sm text-muted-foreground">Multi-attempt transactions will appear here</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-4">
                {(cascadeGroups as any[][]).map((group, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-mono">txn: {group[0].transaction_id.slice(0, 12)}...</CardTitle>
                      <CardDescription>{group.length} attempts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 flex-wrap">
                        {group.sort((a: any, b: any) => a.attempt_number - b.attempt_number).map((attempt: any, j: number) => (
                          <div key={attempt.id} className="flex items-center gap-2">
                            {j > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                            <div className={`border rounded-lg px-3 py-2 text-xs ${attempt.status === 'succeeded' || attempt.status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
                              <div className="font-medium">{attempt.provider}</div>
                              <div className="text-muted-foreground">#{attempt.attempt_number} • {attempt.latency_ms || '—'}ms</div>
                              <Badge variant={attempt.status === 'succeeded' || attempt.status === 'completed' ? 'default' : 'destructive'} className="text-[10px] mt-1">{attempt.status === 'succeeded' || attempt.status === 'completed' ? 'Approved' : attempt.status === 'failed' ? 'Declined' : attempt.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="strategy" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Automatic Failover</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>When a transaction fails at the primary processor, the cascade engine automatically routes to the next available processor based on:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Priority order</strong> — lower priority value = tried first</li>
                    <li><strong>Region match</strong> — processors matching card issuer region preferred</li>
                    <li><strong>Success rate</strong> — real-time processor health influences routing</li>
                    <li><strong>Card brand support</strong> — only route to processors supporting the card network</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><RefreshCw className="h-5 w-5 text-primary" /> Manual Retry</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>Failed transactions can be manually retried via API or dashboard:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>API endpoint</strong> — <code className="text-xs bg-muted px-1 py-0.5 rounded">/v2/payments/cascade/retry</code></li>
                    <li><strong>Max retries</strong> — configurable per merchant (default: 3)</li>
                    <li><strong>Backoff</strong> — exponential backoff between retries</li>
                    <li><strong>Force processor</strong> — override routing to specific processor</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Processor Stack</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {PROCESSORS.map((p) => (
                      <div key={p} className="border rounded-lg p-3 text-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm font-medium capitalize">{p}</p>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto mt-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
