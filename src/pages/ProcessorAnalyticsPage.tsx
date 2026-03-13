import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { BarChart3, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const authRateData = [
  { processor: 'ShieldHub', rate: 96.2, decline: 3.8 },
  { processor: 'Mondo', rate: 94.8, decline: 5.2 },
  { processor: 'Moneto', rate: 93.1, decline: 6.9 },
];

const latencyData = [
  { time: '00:00', shieldhub: 310, mondo: 270, moneto: 400 },
  { time: '04:00', shieldhub: 290, mondo: 260, moneto: 380 },
  { time: '08:00', shieldhub: 340, mondo: 300, moneto: 450 },
  { time: '12:00', shieldhub: 380, mondo: 320, moneto: 490 },
  { time: '16:00', shieldhub: 350, mondo: 290, moneto: 430 },
  { time: '20:00', shieldhub: 320, mondo: 280, moneto: 410 },
];

const declineReasons = [
  { reason: 'Insufficient Funds', count: 4200, pct: '32%' },
  { reason: 'Do Not Honor', count: 2800, pct: '21%' },
  { reason: 'Card Expired', count: 1900, pct: '14%' },
  { reason: 'Invalid Card', count: 1500, pct: '11%' },
  { reason: 'Suspected Fraud', count: 1200, pct: '9%' },
  { reason: 'Other', count: 1700, pct: '13%' },
];

export default function ProcessorAnalyticsPage() {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Processor Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Performance metrics across all connected processors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Avg. Auth Rate" value="94.7%" change="+0.8%" icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard label="Total Declines (30d)" value="13,300" icon={<AlertCircle className="w-5 h-5" />} />
        <StatCard label="Avg. Latency" value="312ms" change="-18ms" icon={<Clock className="w-5 h-5" />} />
        <StatCard label="Uptime (30d)" value="99.97%" icon={<BarChart3 className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold mb-6">Authorization Rate by Processor</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={authRateData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="processor" className="text-muted-foreground" fontSize={12} />
              <YAxis domain={[0, 100]} className="text-muted-foreground" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value: number) => [`${value}%`]} />
              <Bar dataKey="rate" fill="hsl(152 60% 40%)" radius={[4, 4, 0, 0]} name="Auth Rate" />
              <Bar dataKey="decline" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} name="Decline Rate" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold mb-6">Response Latency (ms)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="time" className="text-muted-foreground" fontSize={12} />
              <YAxis className="text-muted-foreground" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="shieldhub" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="ShieldHub" />
              <Line type="monotone" dataKey="mondo" stroke="hsl(152 60% 40%)" strokeWidth={2} dot={false} name="Mondo" />
              <Line type="monotone" dataKey="moneto" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={false} name="Moneto" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Decline Reasons */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-6">Top Decline Reasons (30d)</h3>
        <div className="space-y-3">
          {declineReasons.map((r) => (
            <div key={r.reason} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{r.reason}</span>
                  <span className="text-sm text-muted-foreground">{r.count.toLocaleString()} ({r.pct})</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: r.pct }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
