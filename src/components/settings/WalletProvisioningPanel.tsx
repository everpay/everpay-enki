import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, CheckCircle2, AlertCircle, Clock, Copy, ShieldCheck } from 'lucide-react';
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
      const [pe, el] = await Promise.all([
        supabase
          .from('provider_events')
          .select('event_type, payload, created_at')
          .eq('merchant_id', merchantId)
          .like('event_type', 'wallet.provision.%')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('event_logs')
          .select('event_type, payload, created_at')
          .or('event_type.like.kyb.%,event_type.like.wallet.auto_provision.%')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      const elFiltered = (el.data || []).filter((r: any) => r.payload?.merchant_id === merchantId);
      return [...(pe.data || []), ...elFiltered]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 12);
    },
    refetchInterval: 15000,
  });

  const { data: profile } = useQuery({
    queryKey: ['merchant-profile-kyb', merchantId],
    enabled: !!merchantId,
    queryFn: async () => {
      const { data } = await supabase
        .from('merchant_profiles')
        .select('onboarding_status, kyb_verified_at, country')
        .eq('merchant_id', merchantId)
        .maybeSingle();
      return data;
    },
    refetchInterval: 15000,
  });

  const copy = (v?: string | null) => { if (v) { navigator.clipboard.writeText(v); toast.success('Copied'); } };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />KYB & wallet provisioning</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1"><ShieldCheck className="h-3 w-3" />KYB status</div>
            <Badge variant={profile?.onboarding_status === 'approved' ? 'default' : 'secondary'} className="mt-1">
              {profile?.onboarding_status || 'unknown'}
            </Badge>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Verified at</div>
            <div className="font-mono text-xs mt-1">{profile?.kyb_verified_at ? new Date(profile.kyb_verified_at).toLocaleString() : '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Wallet provisioning</div>
            <Badge variant={wallets.length ? 'default' : 'secondary'} className="mt-1">
              {wallets.length ? `${wallets.length} active` : 'pending'}
            </Badge>
          </div>
        </div>

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
            <div className="text-xs font-medium text-muted-foreground mb-2">Activity feed</div>
            <ul className="space-y-1.5">
              {events.map((e: any, i: number) => {
                const t = e.event_type as string;
                const ok = t.endsWith('.success') || t === 'kyb.document.approved';
                const skipped = t.endsWith('.skipped');
                const Icon = ok ? CheckCircle2 : skipped ? Clock : AlertCircle;
                const cls = ok ? 'text-success' : skipped ? 'text-muted-foreground' : 'text-destructive';
                const err = e.payload?.upstream?.message || e.payload?.error?.message || (typeof e.payload?.error === 'string' ? e.payload.error : null);
                return (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <Icon className={`h-3.5 w-3.5 mt-0.5 ${cls}`} />
                    <div className="flex-1 min-w-0">
                      <div className={cls}>{t}</div>
                      <div className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</div>
                      {err && <div className="text-destructive text-[11px] break-all">{String(err)}</div>}
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