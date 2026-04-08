interface RiskScoreGaugeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskScoreGauge({ score, label = 'Risk Score', size = 'md' }: RiskScoreGaugeProps) {
  const dims = size === 'sm' ? 80 : size === 'lg' ? 160 : 120;
  const stroke = size === 'sm' ? 6 : size === 'lg' ? 10 : 8;
  const radius = (dims - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / 100, 1);
  const dashOffset = circumference * (1 - progress);

  const color = score > 75 ? 'hsl(var(--destructive))' : score > 50 ? '#eab308' : score > 25 ? '#f97316' : 'hsl(var(--primary))';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={dims} height={dims} className="-rotate-90">
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="text-2xl font-bold text-foreground" style={{ marginTop: -(dims / 2 + 12) }}>
        {score.toFixed(0)}
      </span>
      <span className="text-xs text-muted-foreground mt-6">{label}</span>
    </div>
  );
}
