import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Globe, DollarSign, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/format';

function useMultiAcquirerData() {
  return useQuery({
    queryKey: ['multi-acquirer'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('No merchant');

      const [{ data: acquirers }, { data: mids }, { data: attempts }, { data: transactions }] = await Promise.all([
        supabase.from('acquirers').select('*').order('name'),
        supabase.from('merchant_acquirer_mids').select('*, acquirer:acquirers(name, country, success_rate, avg_latency_ms)').eq('merchant_id', merchant.id),
        supabase.from('payment_attempts').select('provider, status, latency_ms, created_at').order('created_at', { ascending: false }).limit(500),
        supabase.from('transactions').select('provider, amount, currency, status, created_at').eq('merchant_id', merchant.id).limit(1000),
      ]);

      // Compute per-provider stats from real attempts
      const providerStats: Record<string, { total: number; success: number; latencySum: number; volumeSum: number }> = {};
      (attempts || []).forEach((a: any) => {
        if (!providerStats[a.provider]) providerStats[a.provider] = { total: 0, success: 0, latencySum: 0, volumeSum: 0 };
        providerStats[a.provider].total++;
        if (a.status === 'success' || a.status === 'completed') providerStats[a.provider].success++;
        providerStats[a.provider].latencySum += a.latency_ms || 0;
      });

      // Add volume from transactions
      (transactions || []).forEach((t: any) => {
        if (!providerStats[t.provider]) providerStats[t.provider] = { total: 0, success: 0, latencySum: 0, volumeSum: 0 };
        if (t.status === 'captured' || t.status === 'completed') providerStats[t.provider].volumeSum += Number(t.amount) || 0;
      });

      const acquirerList = (acquirers || []).map((acq: any) => {
        const stats = providerStats[acq.name.toLowerCase()] || providerStats[acq.name] || { total: 0, success: 0, latencySum: 0, volumeSum: 0 };
        const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : (acq.success_rate || 0).toFixed(1);
        const avgLatency = stats.total > 0 ? Math.round(stats.latencySum / stats.total) : (acq.avg_latency_ms || 0);
        return {
          name: acq.name,
          country: acq.country || 'Global',
          successRate: Number(successRate),
          avgLatency: `${avgLatency}ms`,
          status: acq.active ? 'Active' : 'Standby',
          volume: stats.volumeSum,
        };
      });

      // Routing distribution by region from transactions
      const regionMap: Record<string, Record<string, number>> = {};
      (transactions || []).forEach((t: any) => {
        const provider = t.provider || 'unknown';
        const region = 'Global'; // Simplified - use provider region if available
        if (!regionMap[region]) regionMap[region] = {};
        regionMap[region][provider] = (regionMap[region][provider] || 0) + 1;
      });

      const allProviders = [...new Set((transactions || []).map((t: any) => t.provider).filter(Boolean))];
      const routingData = Object.entries(regionMap).map(([region, providers]) => {
        const total = Object.values(providers).reduce((s, v) => s + v, 0);
        const row: any = { region };
        allProviders.forEach(p => {
          row[p] = total > 0 ? Math.round(((providers[p] || 0) / total) * 100) : 0;
        });
        return row;
      });

      // Compute overall stats
      const totalAttempts = (attempts || []).length;
      const totalSuccess = (attempts || []).filter((a: any) => a.status === 'success' || a.status === 'completed').length;
      const overallRate = totalAttempts > 0 ? ((totalSuccess / totalAttempts) * 100).toFixed(1) : '0';
      const regions = new Set((acquirers || []).map((a: any) => a.country).filter(Boolean));
      const totalSavings = acquirerList.length > 1 ? acquirerList.reduce((s, a) => s + a.volume, 0) * 0.003 : 0; // Est. ~0.3% savings from multi-acquirer

      return {
        acquirerList,
        routingData,
        allProviders,
        activeCount: (acquirers || []).filter((a: any) => a.active).length,
        overallRate,
        regionCount: regions.size || 1,
        savings: totalSavings,
      };
    },
  });
}

export default function MultiAcquirer() {
  const { data, isLoading } = useMultiAcquirerData();

  const acquirerList = data?.acquirerList || [];
  const routingData = data?.routingData || [];
  const allProviders = data?.allProviders || [];

  const chartColors = [
    'hsl(var(--primary))',
    'hsl(152 60% 40%)',
    'hsl(38 92% 50%)',
    'hsl(280 60% 50%)',
    'hsl(200 70% 50%)',
  ];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Multi-Acquirer Switch</h1>
        <p className="mt-1 text-sm text-muted-foreground">Intelligent routing across acquiring banks and processors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Active Acquirers" value={String(data?.activeCount || 0)} icon={GitBranch} />
        <StatCard title="Avg. Auth Rate" value={`${data?.overallRate || 0}%`} icon={Activity} />
        <StatCard title="Regions Covered" value={String(data?.regionCount || 0)} icon={Globe} />
        <StatCard title="Est. Cost Savings" value={formatCurrency(data?.savings || 0, 'USD')} icon={DollarSign} />
      </div>

      {routingData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 mb-8">
          <h3 className="text-lg font-semibold mb-6">Routing Distribution by Region</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={routingData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="region" className="text-muted-foreground" fontSize={12} />
              <YAxis className="text-muted-foreground" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip />
              {allProviders.map((p, i) => (
                <Bar key={p} dataKey={p} stackId="a" fill={chartColors[i % chartColors.length]} name={p} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-6">Connected Acquirers</h3>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading acquirer data...</p>
        ) : acquirerList.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No acquirers configured yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Acquirer</th>
                  <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Region</th>
                  <th className="text-right pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Success Rate</th>
                  <th className="text-right pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg. Latency</th>
                  <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Volume (30d)</th>
                </tr>
              </thead>
              <tbody>
                {acquirerList.map((a: any) => (
                  <tr key={a.name} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-4 font-medium">{a.name}</td>
                    <td className="py-4 text-sm text-muted-foreground">{a.country}</td>
                    <td className="py-4 text-right font-mono text-sm text-emerald-500">{a.successRate}%</td>
                    <td className="py-4 text-right font-mono text-sm">{a.avgLatency}</td>
                    <td className="py-4">
                      <Badge variant={a.status === 'Active' ? 'default' : 'secondary'}>{a.status}</Badge>
                    </td>
                    <td className="py-4 text-right font-semibold">{formatCurrency(a.volume, 'USD')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
