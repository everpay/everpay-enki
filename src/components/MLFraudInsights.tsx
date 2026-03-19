import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMLFraud } from '@/hooks/useMLFraud';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { Brain, RefreshCw, Target, Zap, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'hsl(var(--foreground))',
};

const FEATURE_LABELS: Record<string, string> = {
  amount_normalized: 'Amount',
  country_mismatch: 'Country Match',
  attempt_velocity: 'Velocity',
  proxy_detected: 'Proxy',
  time_anomaly: 'Time',
  bin_risk: 'BIN Risk',
};

export function MLFraudInsights() {
  const { triggerRetrain } = useMLFraud();
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainResult, setRetrainResult] = useState<Record<string, unknown> | null>(null);

  // Fetch fraud_scores for accuracy analysis
  const { data: fraudScores = [] } = useQuery({
    queryKey: ['fraud-scores-insights'],
    queryFn: async () => {
      const { data } = await supabase
        .from('fraud_scores')
        .select('total_score, risk_level, action_taken, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  // Derive stats
  const totalPredictions = fraudScores.length;
  const blocked = fraudScores.filter(s => s.action_taken === 'block').length;
  const reviewed = fraudScores.filter(s => s.action_taken === 'review').length;
  const allowed = fraudScores.filter(s => s.action_taken === 'allow').length;

  const avgScore = totalPredictions > 0
    ? Math.round(fraudScores.reduce((s, f) => s + (f.total_score || 0), 0) / totalPredictions)
    : 0;

  // Feature importance from metadata
  const featureImportance = (() => {
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};
    fraudScores.forEach(s => {
      const meta = s.metadata as Record<string, unknown> | null;
      const weights = meta?.ml_weights as Record<string, number> | undefined;
      if (weights) {
        Object.entries(weights).forEach(([k, v]) => {
          sums[k] = (sums[k] || 0) + v;
          counts[k] = (counts[k] || 0) + 1;
        });
      }
    });
    return Object.entries(sums).map(([key, total]) => ({
      feature: FEATURE_LABELS[key] || key,
      weight: Math.round((total / (counts[key] || 1)) * 100),
    }));
  })();

  // Score distribution buckets
  const scoreDistribution = (() => {
    const buckets = [
      { range: '0-25', count: 0, label: 'Low' },
      { range: '26-50', count: 0, label: 'Medium' },
      { range: '51-75', count: 0, label: 'High' },
      { range: '76-100', count: 0, label: 'Critical' },
    ];
    fraudScores.forEach(s => {
      const score = s.total_score || 0;
      if (score <= 25) buckets[0].count++;
      else if (score <= 50) buckets[1].count++;
      else if (score <= 75) buckets[2].count++;
      else buckets[3].count++;
    });
    return buckets;
  })();

  const handleRetrain = async () => {
    setIsRetraining(true);
    try {
      const result = await triggerRetrain();
      if (result) {
        setRetrainResult(result as Record<string, unknown>);
        toast.success(`Model retrained on ${(result as any).total_records} records — accuracy ${(result as any).model_accuracy}%`);
      } else {
        toast.error('Retrain returned no result');
      }
    } catch {
      toast.error('Failed to retrain model');
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Predictions</span>
            </div>
            <p className="text-xl font-bold text-foreground">{totalPredictions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Avg Score</span>
            </div>
            <p className="text-xl font-bold text-foreground">{avgScore}/100</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Allowed</span>
            <p className="text-xl font-bold text-success">{allowed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Reviewed</span>
            <p className="text-xl font-bold text-warning">{reviewed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Blocked</span>
            <p className="text-xl font-bold text-destructive">{blocked}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Score Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={scoreDistribution} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feature Importance Radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Feature Importance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {featureImportance.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={featureImportance} outerRadius="70%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="feature" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <PolarRadiusAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                  <Radar dataKey="weight" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
                No ML predictions yet — run payments to generate data.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Retrain Panel */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" /> Model Retrain
            </CardTitle>
            <Button size="sm" onClick={handleRetrain} disabled={isRetraining} className="gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
              {isRetraining ? 'Retraining...' : 'Retrain Now'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {retrainResult ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Records</p>
                <p className="text-lg font-bold text-foreground">{(retrainResult as any).total_records}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fraud Rate</p>
                <p className="text-lg font-bold text-destructive">{(retrainResult as any).fraud_rate}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Accuracy</p>
                <p className="text-lg font-bold text-success">{(retrainResult as any).model_accuracy}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Updated Weights</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries((retrainResult as any).updated_weights || {}).map(([k, v]) => (
                    <Badge key={k} variant="secondary" className="text-[10px]">
                      {k.replace('_weight', '')}: {String(v)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click "Retrain Now" to recalculate model weights from historical fraud scores and dispute outcomes.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
