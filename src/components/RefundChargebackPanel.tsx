import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Link2, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';

interface RefundChargebackPanelProps {
  transactionId: string;
}

export function RefundChargebackPanel({ transactionId }: RefundChargebackPanelProps) {
  const { data: disputes } = useQuery({
    queryKey: ['refund-disputes', transactionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!transactionId,
  });

  if (!disputes?.length) return null;

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Related Chargebacks & Disputes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {disputes.map(d => (
          <div key={d.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
            <div className="flex items-center gap-3">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">{d.reason || 'Unknown reason'}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(d.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm">{formatCurrency(d.amount, d.currency as any)}</span>
              <Badge variant={d.status === 'open' ? 'destructive' : d.status === 'won' ? 'default' : 'secondary'}>
                {d.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
