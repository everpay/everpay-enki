import { Progress } from '@/components/ui/progress';

interface RateLimitGaugeProps {
  label: string;
  current: number;
  limit: number;
  burstLimit: number;
  multiplier?: number;
}

export function RateLimitGauge({ label, current, limit, burstLimit, multiplier = 1 }: RateLimitGaugeProps) {
  const effectiveLimit = Math.round(limit * multiplier);
  const usage = effectiveLimit > 0 ? Math.min((current / effectiveLimit) * 100, 100) : 0;
  const severity = usage > 90 ? 'text-destructive' : usage > 70 ? 'text-yellow-500' : 'text-green-500';

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground capitalize">{label}</span>
        <span className={`text-xs font-mono ${severity}`}>
          {current}/{effectiveLimit} rpm
        </span>
      </div>
      <Progress value={usage} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Base: {limit} rpm</span>
        <span>Burst: {burstLimit}</span>
        {multiplier !== 1 && <span>×{multiplier.toFixed(2)}</span>}
      </div>
    </div>
  );
}
