import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/format';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, Gauge, Clock, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';

function useAdminRollingReserves() {
  return useQuery({
    queryKey: ['admin-rolling-reserves'],
    queryFn: async () => {
      const { data, error } = await supabase.from('reserves').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

function useAdminCardVelocity() {
  return useQuery({
    queryKey: ['admin-card-velocity'],
    queryFn: async () => {
      const { data, error } = await supabase.from('card_velocity').select('*, merchants(name)').order('transaction_date', { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
  });
}

const MAX_VELOCITY = 3;

export default function AdminReservesDashboard() {
  const { data: reserves = [], isLoading: loadingReserves } = useAdminRollingReserves();
  const { data: velocity = [], isLoading: loadingVelocity } = useAdminCardVelocity();

  const heldReserves = reserves.filter((r: any) => r.status === 'held');
  const releasedReserves = reserves.filter((r: any) => r.status === 'released');
  const totalHeld = heldReserves.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
  const totalReleased = releasedReserves.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

  const today = new Date().toISOString().split('T')[0];
  const todayVelocity = velocity.filter((v: any) => v.transaction_date === today);
  const atLimit = todayVelocity.filter((v: any) => v.transaction_count >= MAX_VELOCITY);

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Reserves & Velocity</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform-wide rolling reserves and velocity controls</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="rounded-lg bg-amber-500/10 p-2.5"><DollarSign className="h-5 w-5 text-amber-500" /></div><div><p className="text-xs text-muted-foreground">Total Held</p><p className="text-xl font-bold text-foreground">{formatCurrency(totalHeld, 'USD')}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="rounded-lg bg-emerald-500/10 p-2.5"><TrendingUp className="h-5 w-5 text-emerald-500" /></div><div><p className="text-xs text-muted-foreground">Total Released</p><p className="text-xl font-bold text-foreground">{formatCurrency(totalReleased, 'USD')}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="rounded-lg bg-destructive/10 p-2.5"><AlertTriangle className="h-5 w-5 text-destructive" /></div><div><p className="text-xs text-muted-foreground">Velocity Alerts</p><p className="text-xl font-bold text-foreground">{atLimit.length}</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="reserves" className="space-y-4">
        <TabsList><TabsTrigger value="reserves">Rolling Reserves</TabsTrigger><TabsTrigger value="velocity">Card Velocity</TabsTrigger></TabsList>
        <TabsContent value="reserves">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-amber-500" />All Reserves</CardTitle></CardHeader>
            <CardContent>
              {loadingReserves ? <p className="text-sm text-muted-foreground py-4">Loading...</p> : reserves.length === 0 ? <p className="text-sm text-muted-foreground py-4">No reserves yet.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Release Date</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {reserves.slice(0, 50).map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell>{formatCurrency(r.amount || 0, 'USD')}</TableCell>
                        <TableCell><Badge variant={r.status === 'held' ? 'secondary' : 'outline'}>{r.status}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-xs">{r.release_date ? formatDate(r.release_date) : '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{formatDate(r.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="velocity">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Gauge className="h-4 w-4 text-blue-500" />Card Velocity (3/day/customer)</CardTitle></CardHeader>
            <CardContent>
              {loadingVelocity ? <p className="text-sm text-muted-foreground py-4">Loading...</p> : todayVelocity.length === 0 ? <p className="text-sm text-muted-foreground py-4">No velocity records today.</p> : (
                <div className="space-y-3">
                  {todayVelocity.map((v: any) => {
                    const pct = Math.min((v.transaction_count / MAX_VELOCITY) * 100, 100);
                    const isAtLimit = v.transaction_count >= MAX_VELOCITY;
                    return (
                      <div key={v.id} className="rounded-lg border border-border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div><p className="text-sm font-medium text-foreground">{v.merchants?.name || 'Unknown'}</p><p className="text-xs text-muted-foreground font-mono">{v.customer_identifier}</p></div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${isAtLimit ? 'text-destructive' : 'text-foreground'}`}>{v.transaction_count}/{MAX_VELOCITY}</span>
                            {isAtLimit && <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" /> Blocked</Badge>}
                          </div>
                        </div>
                        <Progress value={pct} className={`h-1.5 ${isAtLimit ? '[&>div]:bg-destructive' : ''}`} />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
