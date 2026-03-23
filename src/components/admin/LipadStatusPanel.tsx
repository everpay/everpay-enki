import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Wifi, Globe, Clock, Hash } from 'lucide-react';

export function LipadStatusPanel() {
  const { data: lipadEvents } = useQuery({
    queryKey: ['lipad-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_events')
        .select('id, event_type, created_at, payload')
        .eq('provider', 'lipad')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: lipadTxCount } = useQuery({
    queryKey: ['lipad-tx-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('provider', 'lipad');
      if (error) throw error;
      return count || 0;
    },
  });

  const lastEvent = lipadEvents?.[0];
  const isHealthy = lastEvent && new Date(lastEvent.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000;
  const eventCount = lipadEvents?.length || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Lipad.io (Africa)
          </span>
          <Badge className={isHealthy ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'}>
            {isHealthy ? <><CheckCircle2 className="h-3 w-3 mr-1" />Connected</> : <><XCircle className="h-3 w-3 mr-1" />No recent events</>}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border p-3 text-center">
            <Wifi className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold text-foreground">{eventCount}</p>
            <p className="text-xs text-muted-foreground">Recent Webhooks</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <Hash className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold text-foreground">{lipadTxCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Total Transactions</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm font-medium text-foreground">{lastEvent ? new Date(lastEvent.created_at).toLocaleDateString() : '—'}</p>
            <p className="text-xs text-muted-foreground">Last Event</p>
          </div>
        </div>

        {lipadEvents && lipadEvents.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Events</p>
            {lipadEvents.slice(0, 5).map(ev => (
              <div key={ev.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
                <span className="text-foreground font-medium">{ev.event_type}</span>
                <span className="text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
