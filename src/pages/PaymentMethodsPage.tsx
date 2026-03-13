import { AppLayout } from '@/components/AppLayout';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Building2, Smartphone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/format';

function usePaymentMethodsData() {
  return useQuery({
    queryKey: ['payment-methods-page'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('No merchant');

      const [{ data: transactions }, { data: paymentMethods }] = await Promise.all([
        supabase.from('transactions').select('id, amount, currency, status, provider, metadata, created_at')
          .eq('merchant_id', merchant.id).limit(1000),
        supabase.from('payment_methods').select('id, card_brand, card_last4').limit(500),
      ]);

      // Aggregate by card brand from payment_methods and transactions
      const cardBrandStats: Record<string, { count: number; volume: number; success: number; total: number }> = {};

      // Count card brands from stored payment methods
      (paymentMethods || []).forEach((pm: any) => {
        const brand = (pm.card_brand || 'unknown').toLowerCase();
        if (!cardBrandStats[brand]) cardBrandStats[brand] = { count: 0, volume: 0, success: 0, total: 0 };
        cardBrandStats[brand].count++;
      });

      // Aggregate transaction volumes by provider type
      const providerVolume: Record<string, { volume: number; success: number; total: number }> = {};
      (transactions || []).forEach((t: any) => {
        const p = (t.provider || 'unknown').toLowerCase();
        if (!providerVolume[p]) providerVolume[p] = { volume: 0, success: 0, total: 0 };
        providerVolume[p].total++;
        if (t.status === 'captured' || t.status === 'completed') {
          providerVolume[p].success++;
          providerVolume[p].volume += Number(t.amount) || 0;
        }
      });

      // Map known brands
      const knownCards = ['visa', 'mastercard', 'amex', 'discover'];
      const knownWallets = ['apple_pay', 'google_pay', 'paypal', 'apple pay', 'google pay'];
      const knownBanks = ['ach', 'sepa', 'open_banking', 'pix', 'boleto', 'open banking'];

      const buildItems = (knownNames: string[], fallbackProviders: string[]) => {
        const items: { name: string; enabled: boolean; volume: number; rate: string }[] = [];

        knownNames.forEach(name => {
          const stats = cardBrandStats[name] || providerVolume[name] || { volume: 0, success: 0, total: 0 };
          const pStats = providerVolume[name] || stats;
          const rate = pStats.total > 0 ? `${((pStats.success / pStats.total) * 100).toFixed(1)}%` : '—';
          items.push({
            name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
            enabled: pStats.total > 0 || (cardBrandStats[name]?.count || 0) > 0,
            volume: pStats.volume || 0,
            rate,
          });
        });

        return items;
      };

      const cardItems = buildItems(knownCards, []);
      const bankItems = buildItems(knownBanks, []);
      const walletItems = buildItems(knownWallets, []);

      // Also add any unknown providers that don't fit categories
      const categorized = [...knownCards, ...knownWallets, ...knownBanks];
      Object.entries(providerVolume).forEach(([p, stats]) => {
        if (!categorized.includes(p)) {
          cardItems.push({
            name: p.charAt(0).toUpperCase() + p.slice(1),
            enabled: stats.total > 0,
            volume: stats.volume,
            rate: stats.total > 0 ? `${((stats.success / stats.total) * 100).toFixed(1)}%` : '—',
          });
        }
      });

      return { cardItems, bankItems, walletItems };
    },
  });
}

export default function PaymentMethodsPage() {
  const { data, isLoading } = usePaymentMethodsData();

  const methods = [
    {
      category: 'Cards',
      icon: <CreditCard className="w-5 h-5" />,
      endpoint: 'POST /payments/cards',
      items: data?.cardItems || [],
    },
    {
      category: 'Bank Debits',
      icon: <Building2 className="w-5 h-5" />,
      endpoint: 'POST /payments/ach | /payments/sepa',
      items: data?.bankItems || [],
    },
    {
      category: 'Digital Wallets',
      icon: <Smartphone className="w-5 h-5" />,
      endpoint: 'POST /payments/wallet',
      items: data?.walletItems || [],
    },
  ];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Payment Methods</h1>
        <p className="mt-1 text-sm text-muted-foreground">Unified interface for global payment method support</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6">
          {methods.map((group) => (
            <div key={group.category} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {group.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{group.category}</h3>
                    <p className="font-mono text-xs text-muted-foreground">{group.endpoint}</p>
                  </div>
                </div>
              </div>
              {group.items.length === 0 ? (
                <p className="text-muted-foreground text-center py-6 text-sm">No {group.category.toLowerCase()} data yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Method</th>
                        <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-right pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Volume (30d)</th>
                        <th className="text-right pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Auth Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item: any) => (
                        <tr key={item.name} className="border-b border-border last:border-0">
                          <td className="py-3 font-medium">{item.name}</td>
                          <td className="py-3">
                            <Badge variant={item.enabled ? 'default' : 'secondary'}>{item.enabled ? 'Active' : 'Inactive'}</Badge>
                          </td>
                          <td className="py-3 text-right font-mono text-sm">{formatCurrency(item.volume, 'USD')}</td>
                          <td className="py-3 text-right font-mono text-sm text-emerald-500">{item.rate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
