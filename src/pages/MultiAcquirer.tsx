import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Globe, DollarSign, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const acquirers = [
  { name: 'ShieldHub', region: 'Global', successRate: 96.2, avgLatency: '320ms', cost: '2.9% + $0.30', status: 'Active', volume: '$2.1M' },
  { name: 'Mondo', region: 'EU / UK', successRate: 94.8, avgLatency: '280ms', cost: '2.6% + €0.20', status: 'Active', volume: '$1.8M' },
  { name: 'Moneto', region: 'LATAM', successRate: 93.1, avgLatency: '410ms', cost: '2.5% + $0.25', status: 'Standby', volume: '$1.4M' },
];

const routingData = [
  { region: 'North America', shieldhub: 70, mondo: 10, moneto: 20 },
  { region: 'Europe', shieldhub: 15, mondo: 75, moneto: 10 },
  { region: 'Latin America', shieldhub: 10, mondo: 5, moneto: 85 },
  { region: 'UK', shieldhub: 20, mondo: 70, moneto: 10 },
];

export default function MultiAcquirer() {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Multi-Acquirer Switch</h1>
        <p className="mt-1 text-sm text-muted-foreground">Intelligent routing across acquiring banks and processors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Active Acquirers" value="3" icon={<GitBranch className="w-5 h-5" />} />
        <StatCard label="Avg. Auth Rate" value="94.7%" change="+0.8%" icon={<Activity className="w-5 h-5" />} />
        <StatCard label="Regions Covered" value="8" icon={<Globe className="w-5 h-5" />} />
        <StatCard label="Cost Savings" value="$42K" change="vs single acquirer" icon={<DollarSign className="w-5 h-5" />} />
      </div>

      {/* Routing Distribution */}
      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <h3 className="text-lg font-semibold mb-6">Routing Distribution by Region</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={routingData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="region" className="text-muted-foreground" fontSize={12} />
            <YAxis className="text-muted-foreground" fontSize={12} tickFormatter={(v) => `${v}%`} />
            <Tooltip />
            <Bar dataKey="shieldhub" stackId="a" fill="hsl(var(--primary))" name="ShieldHub" />
            <Bar dataKey="mondo" stackId="a" fill="hsl(152 60% 40%)" name="Mondo" />
            <Bar dataKey="moneto" stackId="a" fill="hsl(38 92% 50%)" name="Moneto" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Acquirers Table */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-6">Connected Acquirers</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Acquirer</th>
                <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Region</th>
                <th className="text-right pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Success Rate</th>
                <th className="text-right pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg. Latency</th>
                <th className="text-right pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cost</th>
                <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Volume (30d)</th>
              </tr>
            </thead>
            <tbody>
              {acquirers.map((a) => (
                <tr key={a.name} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-4 font-medium">{a.name}</td>
                  <td className="py-4 text-sm text-muted-foreground">{a.region}</td>
                  <td className="py-4 text-right font-mono text-sm text-emerald-500">{a.successRate}%</td>
                  <td className="py-4 text-right font-mono text-sm">{a.avgLatency}</td>
                  <td className="py-4 text-right text-sm text-muted-foreground">{a.cost}</td>
                  <td className="py-4">
                    <Badge variant={a.status === 'Active' ? 'default' : 'secondary'}>{a.status}</Badge>
                  </td>
                  <td className="py-4 text-right font-semibold">{a.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
