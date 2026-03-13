import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { ShieldAlert, ShieldCheck, ShieldX, AlertTriangle, Fingerprint, Zap } from 'lucide-react';

const RISK_COLORS = {
  low: 'hsl(var(--success))',
  medium: 'hsl(48, 96%, 53%)',
  high: 'hsl(24, 95%, 53%)',
  critical: 'hsl(var(--destructive))',
};

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'hsl(var(--foreground))',
};

export function FraudAnalytics() {
  const { data: fraudScores = [], isLoading } = useQuery({
    queryKey: ['fraud-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fraud_scores')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const total = fraudScores.length;
    const blocked = fraudScores.filter(s => s.action_taken === 'block').length;
    const reviewed = fraudScores.filter(s => s.action_taken === 'review').length;
    const allowed = fraudScores.filter(s => s.action_taken === 'allow').length;
    const avgScore = total > 0 ? Math.round(fraudScores.reduce((sum, s) => sum + (s.total_score || 0), 0) / total) : 0;
    return { total, blocked, reviewed, allowed, avgScore };
  }, [fraudScores]);

  const riskDistribution = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    fraudScores.forEach(s => { counts[s.risk_level || 'low'] = (counts[s.risk_level || 'low'] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [fraudScores]);

  const scoreHistory = useMemo(() => {
    const buckets: Record<string, { date: string; avgScore: number; count: number; blocked: number; _total: number }> = {};
    fraudScores.forEach(s => {
      const key = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!buckets[key]) buckets[key] = { date: key, avgScore: 0, count: 0, blocked: 0, _total: 0 };
      buckets[key]._total += (s.total_score || 0);
      buckets[key].count += 1;
      if (s.action_taken === 'block') buckets[key].blocked += 1;
    });
    return Object.values(buckets).map(b => ({
      ...b,
      avgScore: b.count > 0 ? Math.round(b._total / b.count) : 0,
    })).reverse();
  }, [fraudScores]);

  const factorBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    fraudScores.forEach(s => {
      (s.risk_factors || []).forEach((f: string) => { counts[f] = (counts[f] || 0) + 1; });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
  }, [fraudScores]);

  const scoreBreakdown = useMemo(() => {
    if (fraudScores.length === 0) return { velocity: 0, device: 0, geo: 0 };
    const total = fraudScores.length;
    return {
      velocity: Math.round(fraudScores.reduce((s, f) => s + (f.velocity_score || 0), 0) / total),
      device: Math.round(fraudScores.reduce((s, f) => s + (f.device_score || 0), 0) / total),
      geo: Math.round(fraudScores.reduce((s, f) => s + (f.geo_score || 0), 0) / total),
    };
  }, [fraudScores]);

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (fraudScores.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <ShieldCheck className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">No fraud detection data yet. Process payments to see fraud analytics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <FraudKPI icon={ShieldAlert} label="Total Checks" value={stats.total.toString()} />
        <FraudKPI icon={ShieldX} label="Blocked" value={stats.blocked.toString()} color="destructive" />
        <FraudKPI icon={AlertTriangle} label="In Review" value={stats.reviewed.toString()} color="warning" />
        <FraudKPI icon={ShieldCheck} label="Allowed" value={stats.allowed.toString()} color="success" />
        <FraudKPI icon={Zap} label="Avg Score" value={`${stats.avgScore}/100`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Score History */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" /> Fraud Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={scoreHistory} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="avgScore" name="Avg Risk Score" stroke="hsl(24, 95%, 53%)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="blocked" name="Blocked" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {riskDistribution.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS] || 'hsl(var(--muted))'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {riskDistribution.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS[entry.name as keyof typeof RISK_COLORS] }} />
                  <span className="text-muted-foreground capitalize">{entry.name}</span>
                  <span className="font-medium text-foreground">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Factor Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-primary" /> Top Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {factorBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No risk factors detected</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={factorBreakdown} layout="vertical" margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="hsl(24, 95%, 53%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Score Component Averages */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Average Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5 pt-2">
              <ScoreBar label="Velocity Score" value={scoreBreakdown.velocity} color="hsl(var(--destructive))" description="Card velocity, rapid-fire detection, failed attempts" />
              <ScoreBar label="Device Score" value={scoreBreakdown.device} color="hsl(24, 95%, 53%)" description="Device fingerprint, shared devices, bot detection" />
              <ScoreBar label="Geo / IP Score" value={scoreBreakdown.geo} color="hsl(48, 96%, 53%)" description="IP hopping, timezone mismatches, unknown IPs" />
            </div>

            <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Action Breakdown</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-success">{stats.allowed}</p>
                  <p className="text-[10px] text-muted-foreground">Allowed</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-warning">{stats.reviewed}</p>
                  <p className="text-[10px] text-muted-foreground">Review</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-destructive">{stats.blocked}</p>
                  <p className="text-[10px] text-muted-foreground">Blocked</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FraudKPI({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  const colorClass = color === 'destructive' ? 'text-destructive' : color === 'warning' ? 'text-warning' : color === 'success' ? 'text-success' : 'text-primary';
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          <Icon className={`h-3.5 w-3.5 ${colorClass}`} />
        </div>
        <p className="font-heading text-lg font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function ScoreBar({ label, value, color, description }: { label: string; value: number; color: string; description: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Badge variant="outline" className="text-xs">{value}/100</Badge>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <p className="text-[10px] text-muted-foreground">{description}</p>
    </div>
  );
}
