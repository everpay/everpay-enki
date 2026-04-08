import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

export type PeriodValue = 'this_hour' | 'today' | 'this_week' | 'this_month' | 'this_year' | '7d' | '30d' | '90d' | 'all';

interface PeriodSelectorProps {
  value: PeriodValue;
  onValueChange: (value: PeriodValue) => void;
  className?: string;
}

const periodOptions: { value: PeriodValue; label: string }[] = [
  { value: 'this_hour', label: 'This hour' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'this_year', label: 'This year' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

export function getPeriodCutoff(period: PeriodValue): Date | null {
  const now = new Date();
  switch (period) {
    case 'this_hour':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'this_week': {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'this_month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'this_year':
      return new Date(now.getFullYear(), 0, 1);
    case '7d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case '30d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d;
    }
    case '90d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return d;
    }
    case 'all':
      return null;
  }
}

export function PeriodSelector({ value, onValueChange, className }: PeriodSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as PeriodValue)}>
      <SelectTrigger className={`h-8 text-xs gap-1.5 ${className || 'w-[140px]'}`}>
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <SelectValue placeholder="Period" />
      </SelectTrigger>
      <SelectContent>
        {periodOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
