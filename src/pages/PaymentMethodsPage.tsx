import { AppLayout } from '@/components/AppLayout';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Building2, Smartphone } from 'lucide-react';

const methods = [
  {
    category: 'Cards',
    icon: <CreditCard className="w-5 h-5" />,
    endpoint: 'POST /payments/cards',
    items: [
      { name: 'Visa', enabled: true, volume: '$2.4M', rate: '96.8%' },
      { name: 'Mastercard', enabled: true, volume: '$1.8M', rate: '95.2%' },
      { name: 'Amex', enabled: true, volume: '$620K', rate: '93.1%' },
    ],
  },
  {
    category: 'Bank Debits',
    icon: <Building2 className="w-5 h-5" />,
    endpoint: 'POST /payments/ach | /payments/sepa',
    items: [
      { name: 'Open Banking', enabled: true, volume: '$1.1M', rate: '98.4%' },
      { name: 'PIX (Brazil)', enabled: true, volume: '$890K', rate: '97.9%' },
      { name: 'Boleto', enabled: true, volume: '$340K', rate: '96.1%' },
    ],
  },
  {
    category: 'Digital Wallets',
    icon: <Smartphone className="w-5 h-5" />,
    endpoint: 'POST /payments/wallet',
    items: [
      { name: 'Apple Pay', enabled: true, volume: '$340K', rate: '97.1%' },
      { name: 'Google Pay', enabled: true, volume: '$280K', rate: '96.5%' },
      { name: 'PayPal', enabled: false, volume: '$0', rate: '—' },
    ],
  },
];

export default function PaymentMethodsPage() {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Payment Methods</h1>
        <p className="mt-1 text-sm text-muted-foreground">Unified interface for global payment method support</p>
      </div>

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
                  {group.items.map((item) => (
                    <tr key={item.name} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium">{item.name}</td>
                      <td className="py-3">
                        <Badge variant={item.enabled ? 'default' : 'secondary'}>{item.enabled ? 'Active' : 'Disabled'}</Badge>
                      </td>
                      <td className="py-3 text-right font-mono text-sm">{item.volume}</td>
                      <td className="py-3 text-right font-mono text-sm text-emerald-500">{item.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
