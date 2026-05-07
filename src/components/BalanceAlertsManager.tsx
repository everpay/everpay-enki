import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Trash2, AlertTriangle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'BRL', 'MXN', 'COP', 'INR', 'PKR', 'NGN', 'AUD'];

export function BalanceAlertsManager() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [thresholdType, setThresholdType] = useState<'below' | 'above'>('below');
  const [amount, setAmount] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(true);

  const { data: merchant } = useQuery({
    queryKey: ['merchant', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('merchants').select('id').eq('user_id', user!.id).maybeSingle();
      return data;
    },
  });

  const { data: configs = [] } = useQuery({
    queryKey: ['balance-alert-configs', merchant?.id],
    enabled: !!merchant?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('balance_alert_configs')
        .select('*')
        .eq('merchant_id', merchant!.id)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ['balance-alert-history', merchant?.id],
    enabled: !!merchant?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('balance_alert_history')
        .select('*')
        .eq('merchant_id', merchant!.id)
        .order('triggered_at', { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!merchant?.id) throw new Error('No merchant');
      const { error } = await supabase.from('balance_alert_configs').insert({
        merchant_id: merchant.id,
        currency,
        threshold_type: thresholdType,
        threshold_amount: parseFloat(amount),
        notify_email: notifyEmail,
        active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Alert created');
      qc.invalidateQueries({ queryKey: ['balance-alert-configs'] });
      setShowAdd(false); setAmount('');
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to create alert'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('balance_alert_configs').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['balance-alert-configs'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('balance_alert_configs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Alert removed');
      qc.invalidateQueries({ queryKey: ['balance-alert-configs'] });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-heading flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Balance Alerts
            </CardTitle>
            <CardDescription>Get notified when a currency balance crosses a threshold.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAdd((s) => !s)} className="gap-2">
            <Plus className="h-4 w-4" /> New Alert
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAdd && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div>
                <Label className="text-xs">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Trigger when</Label>
                <Select value={thresholdType} onValueChange={(v: any) => setThresholdType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="below">Below</SelectItem>
                    <SelectItem value="above">Above</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Amount</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} id="notify-email" />
                <Label htmlFor="notify-email" className="text-xs cursor-pointer">Email me</Label>
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!amount || createMutation.isPending}>
                {createMutation.isPending ? 'Saving…' : 'Save Alert'}
              </Button>
            </div>
          )}

          {configs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No alerts configured yet.</p>
          ) : (
            <div className="space-y-2">
              {configs.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">{c.currency}</Badge>
                    <span className="text-sm">
                      Balance <span className="font-semibold capitalize">{c.threshold_type}</span>{' '}
                      <span className="font-mono">{Number(c.threshold_amount).toLocaleString()}</span>
                    </span>
                    {c.notify_email && <Mail className="h-3.5 w-3.5 text-muted-foreground" aria-label="Email enabled" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={c.active} onCheckedChange={(active) => toggleMutation.mutate({ id: c.id, active })} />
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" /> Recent Alert History
          </CardTitle>
          <CardDescription>Last 20 alerts that fired for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No alerts have fired yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg border border-border bg-card/60 p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant={h.threshold_type === 'below' ? 'destructive' : 'default'} className="capitalize">
                      {h.threshold_type}
                    </Badge>
                    <span>
                      <span className="font-mono">{h.currency}</span> balance{' '}
                      <span className="font-semibold">{Number(h.observed_balance).toLocaleString()}</span>{' '}
                      <span className="text-muted-foreground">vs threshold {Number(h.threshold_amount).toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {h.notification_sent && <Badge variant="outline" className="gap-1"><Mail className="h-3 w-3" /> sent</Badge>}
                    <span>{formatDistanceToNow(new Date(h.triggered_at), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
