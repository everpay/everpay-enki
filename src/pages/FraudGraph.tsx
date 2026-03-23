import { useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/lib/format';
import { Shield, AlertTriangle, Network, Fingerprint, Mail, Globe, CreditCard, Smartphone } from 'lucide-react';

function useFraudGraphData() {
  return useQuery({
    queryKey: ['fraud-graph'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('No merchant');

      const [{ data: scores }, { data: devices }, { data: behavioral }] = await Promise.all([
        supabase.from('fraud_scores').select('*').eq('merchant_id', merchant.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('device_analytics').select('*').eq('merchant_id', merchant.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('behavioral_profiles').select('*').eq('merchant_id', merchant.id).order('created_at', { ascending: false }).limit(50),
      ]);

      return { scores: scores || [], devices: devices || [], behavioral: behavioral || [], merchantId: merchant.id };
    },
  });
}

function RiskBadge({ level }: { level: string | null }) {
  switch (level) {
    case 'critical': case 'high':
      return <Badge variant="destructive">{level}</Badge>;
    case 'medium':
      return <Badge className="bg-warning/10 text-warning border-warning/20">{level}</Badge>;
    default:
      return <Badge className="bg-success/10 text-success border-success/20">{level || 'low'}</Badge>;
  }
}

function NodeTypeIcon({ type }: { type: string | null }) {
  switch (type) {
    case 'email': return <Mail className="h-4 w-4 text-chart-1" />;
    case 'device': return <Smartphone className="h-4 w-4 text-chart-2" />;
    case 'ip': return <Globe className="h-4 w-4 text-chart-3" />;
    case 'card': return <CreditCard className="h-4 w-4 text-chart-4" />;
    default: return <Fingerprint className="h-4 w-4 text-muted-foreground" />;
  }
}

export default function FraudGraph() {
  const { data, isLoading } = useFraudGraphData();

  const stats = useMemo(() => {
    const s = data?.scores || [];
    return {
      total: s.length,
      highRisk: s.filter(x => (x.total_score || 0) >= 70).length,
      blocked: s.filter(x => x.action_taken === 'block').length,
      avgScore: s.length ? Math.round(s.reduce((sum, x) => sum + (x.total_score || 0), 0) / s.length) : 0,
      uniqueDevices: new Set((data?.devices || []).map(d => d.device_id)).size,
      suspiciousDevices: (data?.devices || []).filter(d => (d.risk_score || 0) > 50).length,
    };
  }, [data]);

  // Build entity clusters from fraud scores
  const clusters = useMemo(() => {
    const emailMap = new Map<string, { scores: typeof data.scores; devices: Set<string>; ips: Set<string>; cards: Set<string> }>();

    (data?.scores || []).forEach(s => {
      const email = s.customer_email || 'unknown';
      if (!emailMap.has(email)) {
        emailMap.set(email, { scores: [], devices: new Set(), ips: new Set(), cards: new Set() });
      }
      const cluster = emailMap.get(email)!;
      cluster.scores.push(s);
      if (s.device_fingerprint) cluster.devices.add(s.device_fingerprint);
      if (s.ip_address) cluster.ips.add(s.ip_address);
      if (s.card_bin) cluster.cards.add(s.card_bin);
    });

    return Array.from(emailMap.entries())
      .map(([email, c]) => ({
        email,
        riskScore: Math.max(...c.scores.map(s => s.total_score || 0)),
        events: c.scores.length,
        devices: c.devices.size,
        ips: c.ips.size,
        cards: c.cards.size,
        factors: [...new Set(c.scores.flatMap(s => s.risk_factors || []))],
        lastSeen: c.scores[0]?.created_at || '',
      }))
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [data]);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Fraud Intelligence — SIGGY</h1>
        <p className="mt-1 text-sm text-muted-foreground">Entity graph analysis, device fingerprinting, and risk clustering</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card><CardContent className="pt-5 text-center">
          <p className="text-xs text-muted-foreground">Fraud Events</p>
          <p className="text-xl font-bold text-foreground mt-1">{stats.total}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 text-center">
          <p className="text-xs text-muted-foreground">High Risk</p>
          <p className="text-xl font-bold text-destructive mt-1">{stats.highRisk}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 text-center">
          <p className="text-xs text-muted-foreground">Blocked</p>
          <p className="text-xl font-bold text-foreground mt-1">{stats.blocked}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 text-center">
          <p className="text-xs text-muted-foreground">Avg Score</p>
          <p className="text-xl font-bold text-foreground mt-1">{stats.avgScore}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 text-center">
          <p className="text-xs text-muted-foreground">Unique Devices</p>
          <p className="text-xl font-bold text-foreground mt-1">{stats.uniqueDevices}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 text-center">
          <p className="text-xs text-muted-foreground">Suspicious</p>
          <p className="text-xl font-bold text-destructive mt-1">{stats.suspiciousDevices}</p>
        </CardContent></Card>
      </div>

      {/* Entity Clusters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Network className="h-5 w-5" />Entity Clusters</CardTitle>
          <CardDescription>Grouped by email identity with linked devices, IPs, and card BINs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="text-center">Events</TableHead>
                  <TableHead className="text-center"><Smartphone className="h-4 w-4 inline" /></TableHead>
                  <TableHead className="text-center"><Globe className="h-4 w-4 inline" /></TableHead>
                  <TableHead className="text-center"><CreditCard className="h-4 w-4 inline" /></TableHead>
                  <TableHead>Risk Factors</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clusters.map((c, i) => (
                  <TableRow key={i} className={c.riskScore >= 70 ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-mono text-sm">{c.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          c.riskScore >= 70 ? 'bg-destructive/20 text-destructive' :
                          c.riskScore >= 40 ? 'bg-warning/20 text-warning' :
                          'bg-success/20 text-success'
                        }`}>{c.riskScore}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">{c.events}</TableCell>
                    <TableCell className="text-center text-sm">{c.devices}</TableCell>
                    <TableCell className="text-center text-sm">{c.ips}</TableCell>
                    <TableCell className="text-center text-sm">{c.cards}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {c.factors.slice(0, 3).map((f, j) => (
                          <Badge key={j} variant="outline" className="text-xs">{f}</Badge>
                        ))}
                        {c.factors.length > 3 && <Badge variant="outline" className="text-xs">+{c.factors.length - 3}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.lastSeen ? formatDate(c.lastSeen) : '—'}</TableCell>
                  </TableRow>
                ))}
                {!clusters.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No fraud data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Behavioral Profiles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Fingerprint className="h-5 w-5" />Behavioral Biometrics</CardTitle>
          <CardDescription>Session behavior patterns and confidence scoring</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Typing Speed</TableHead>
                <TableHead className="text-right">Mouse Entropy</TableHead>
                <TableHead className="text-right">Session (s)</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.behavioral || []).map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.customer_id?.slice(0, 8) || '—'}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{b.typing_speed?.toFixed(1) || '—'}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{b.mouse_entropy?.toFixed(2) || '—'}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{b.session_duration || '—'}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-mono text-sm ${(b.confidence_score || 0) > 0.7 ? 'text-success' : 'text-warning'}`}>
                      {((b.confidence_score || 0) * 100).toFixed(0)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{b.created_at ? formatDate(b.created_at) : '—'}</TableCell>
                </TableRow>
              ))}
              {!(data?.behavioral || []).length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No behavioral data</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
