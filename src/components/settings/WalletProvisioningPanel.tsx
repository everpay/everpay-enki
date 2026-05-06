import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, CheckCircle2, AlertCircle, Clock, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface Props { merchantId?: string }

export function WalletProvisioningPanel({ merchantId }: Props) {
  const { data: wallets = [] } = useQuery({
    queryKey: ['elektropay-wallets', merchantId],
    enabled: !!merchantId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('elektropay_wallets')
        .select('asset_id, currency, crypto_network, wallet_address, address_id, status, created_at')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: true });
      return data || [];
    },
    refetchInterval: 15000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['wallet-provision-events', merchantId],
    enabled: !!merchantId,
    queryFn: async () => {
      const { data } = await supabase
        .from('provider_events')
        .select('event_type, payload, created_at')
        .eq('merchant_id', merchantId)
        .like('event_type', 'wallet.provision.%')
        .order('created_at', { ascending: false })
        .limit(8);
      return data || [];
    },
    refetchInterval: 15000,
  });

  const copy = (v?: string | null) => { if (v) { navigator.clipboard.writeText(v); toast.success('Copied'); } };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Wallet provisioning</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {wallets.length === 0 && (
          <p className="text-sm text-muted-foreground">No wallets provisioned yet. A USDT.TRC20 wallet is auto-created after KYB approval (non-US/CA).</p>
        )}
        {wallets.map((w: any) => (
          <div key={w.asset_id} className="rounded-lg border p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{w.asset_id}</span>
              <Badge variant={w.status === 'active' ? 'default' : 'secondary'}>{w.crypto_network || w.currency}</Badge>
            </div>
            {w.wallet_address && (
              <div className="flex items-center gap-2 text-xs font-mono break-all">
                <span className="text-muted-foreground">{w.wallet_address}</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copy(w.wallet_address)}><Copy className="h-3 w-3" /></Button>
              </div>
            )}
            {!w.wallet_address && w.address_id && (
              <div className="text-xs text-muted-foreground">Address ID: <code>{w.address_id}</code></div>
            )}
          </div>
        ))}

        {events.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs font-medium text-muted-foreground mb-2">Recent activity</div>
            <ul className="space-y-1.5">
              {events.map((e: any, i: number) => {
                const ok = e.event_type === 'wallet.provision.success';
                const skipped = e.event_type === 'wallet.provision.skipped';
                const Icon = ok ? CheckCircle2 : skipped ? Clock : AlertCircle;
                const cls = ok ? 'text-success' : skipped ? 'text-muted-foreground' : 'text-destructive';
                return (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <Icon className={`h-3.5 w-3.5 mt-0.5 ${cls}`} />
                    <div className="flex-1 min-w-0">
                      <div className={cls}>{e.event_type.replace('wallet.provision.', '')}</div>
                      <div className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</div>
                      {e.payload?.upstream?.message && (
                        <div className="text-destructive text-[11px]">{String(e.payload.upstream.message)}</div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}