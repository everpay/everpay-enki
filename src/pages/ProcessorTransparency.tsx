import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '@/lib/format';
import { Activity, DollarSign, Clock, Zap } from 'lucide-react';

function useProcessorData() {
  return useQuery({
    queryKey: ['processor-transparency'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('No merchant');

      const [{ data: attempts }, { data: feeProfiles }, { data: rules }] = await Promise.all([
        supabase.from('payment_attempts').select('*, transaction:transactions(id, amount, currency, status, provider, created_at)')
          .order('created_at', { ascending: false }).limit(100),
        supabase.from('processor_fee_profiles').select('*').eq('merchant_id', merchant.id),
        supabase.from('routing_rules').select('*').eq('merchant_id', merchant.id).order('priority', { ascending: true }),
      ]);

      return { attempts: attempts || [], feeProfiles: feeProfiles || [], rules: rules || [], merchantId: merchant.id };
    },
  });
}

export default function ProcessorTransparency() {
  const { data, isLoading } = useProcessorData();
  const attempts = data?.attempts || [];
  const feeProfiles = data?.feeProfiles || [];
  const rules = data?.rules || [];

  // Compute summary stats
  const providers = [...new Set(attempts.map(a => a.provider))];
  const avgLatency = attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + (a.latency_ms || 0), 0) / attempts.length)
    : 0;
  const successRate = attempts.length > 0
    ? Math.round(attempts.filter(a => a.status === 'success' || a.status === 'completed').length / attempts.length * 100)
    : 0;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Processor Transparency</h1>
        <p className="mt-1 text-sm text-muted-foreground">View routing decisions, processor fees, and payment attempt details</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Activity className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Active Processors</p>
                <p className="text-2xl font-bold text-foreground">{providers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10"><Zap className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-foreground">{successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Latency</p>
                <p className="text-2xl font-bold text-foreground">{avgLatency}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10"><DollarSign className="h-5 w-5 text-accent-foreground" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Fee Profiles</p>
                <p className="text-2xl font-bold text-foreground">{feeProfiles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routing Rules */}
      {rules.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Routing Rules</CardTitle>
            <CardDescription>Active routing configuration by priority</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Currencies</TableHead>
                  <TableHead>Amount Range</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Fallback</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule: any) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-mono">{rule.priority}</TableCell>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      {(rule.currency_match as string[])?.length > 0
                        ? (rule.currency_match as string[]).map((c: string) => <Badge key={c} variant="outline" className="mr-1 text-xs">{c}</Badge>)
                        : <span className="text-muted-foreground text-xs">All</span>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {rule.amount_min || rule.amount_max
                        ? `${rule.amount_min || '0'} – ${rule.amount_max || '∞'}`
                        : 'Any'}
                    </TableCell>
                    <TableCell><Badge>{rule.target_provider}</Badge></TableCell>
                    <TableCell>{rule.fallback_provider ? <Badge variant="secondary">{rule.fallback_provider}</Badge> : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={rule.active ? 'default' : 'secondary'}>{rule.active ? 'Active' : 'Disabled'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Fee Profiles */}
      {feeProfiles.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Processor Fee Profiles</CardTitle>
            <CardDescription>Fee structure per processor and currency</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>% Fee</TableHead>
                  <TableHead>Fixed Fee</TableHead>
                  <TableHead>Chargeback Fee</TableHead>
                  <TableHead>Settlement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeProfiles.map((fp: any) => (
                  <TableRow key={fp.id}>
                    <TableCell><Badge>{fp.provider}</Badge></TableCell>
                    <TableCell>{fp.currency}</TableCell>
                    <TableCell>{fp.percentage_fee}%</TableCell>
                    <TableCell>{formatCurrency(fp.fixed_fee, fp.currency)}</TableCell>
                    <TableCell>{formatCurrency(fp.chargeback_fee, fp.currency)}</TableCell>
                    <TableCell>{fp.settlement_days}d</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payment Attempts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payment Attempts</CardTitle>
          <CardDescription>Individual processor routing attempts for each transaction</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8"><p className="text-muted-foreground">Loading...</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Processor</TableHead>
                  <TableHead>Attempt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.transaction_id?.slice(0, 8)}...</TableCell>
                    <TableCell><Badge variant="outline">{a.provider}</Badge></TableCell>
                    <TableCell className="text-center">#{a.attempt_number}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === 'success' || a.status === 'completed' ? 'default' : 'destructive'}>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{a.latency_ms ? `${a.latency_ms}ms` : '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">{a.response_message || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(a.created_at)}</TableCell>
                  </TableRow>
                ))}
                {attempts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No payment attempts recorded yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
