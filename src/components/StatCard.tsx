import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  subtitle?: string;
}

export function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, subtitle }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card animate-fade-in transition-shadow hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground font-medium">{title}</p>
          <p className="font-heading text-3xl font-bold tracking-tight text-foreground num">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      {change && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={`text-xs font-medium ${
              changeType === 'positive'
                ? 'text-success'
                : changeType === 'negative'
                ? 'text-destructive'
                : 'text-muted-foreground'
            }`}
          >
            {change}
          </span>
          <span className="text-xs text-muted-foreground">vs last period</span>
        </div>
      )}
    </div>
  );
}
