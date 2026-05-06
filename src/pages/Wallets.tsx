import { AppLayout } from '@/components/AppLayout';
import { useAccounts } from '@/hooks/useAccounts';
import { useProviderEvents } from '@/hooks/useProviderEvents';
import { formatCurrency } from '@/lib/format';
import { Wallet, TrendingUp, Clock, CreditCard, ExternalLink, Banknote, Bitcoin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CryptoWalletDashboard } from '@/components/CryptoWalletDashboard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const currencyFlags: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', BRL: '🇧🇷', MXN: '🇲🇽', COP: '🇨🇴', CAD: '🇨🇦',
};

const currencyNames: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  BRL: 'Brazilian Real',
  MXN: 'Mexican Peso',
  COP: 'Colombian Peso',
  CAD: 'Canadian Dollar',
};

export default function Wallets() {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: providerEvents = [] } = useProviderEvents();
  const navigate = useNavigate();

  // Latest provider_event per currency → routing/status badge
  const latestByCurrency = new Map<string, { provider: string; status: string; fallbackFrom?: string; at: string }>();
  for (const ev of providerEvents) {
    const p: any = (ev as any).payload || {};
    const cur = (p.currency || p.asset_id || '').toString().toUpperCase();
    if (!cur || latestByCurrency.has(cur)) continue;
    const status = (ev.event_type || '').split('.').pop() || 'event';
    latestByCurrency.set(cur, {
      provider: ev.provider || 'unknown',
      status,
      fallbackFrom: p.fallback_from || p.cascaded_from,
      at: ev.created_at,
    });
  }

  const badgeStyle = (p: string) => {
    const k = (p || '').toLowerCase();
    if (k.includes('smartfast')) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    if (k === 'mondo') return 'bg-indigo-100 text-indigo-700 border-indigo-300';
    if (k === 'brighty') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (k === 'moneto') return 'bg-sky-100 text-sky-700 border-sky-300';
    if (k === 'elektropay') return 'bg-teal-100 text-teal-700 border-teal-300';
    return 'bg-muted text-muted-foreground border-border';
  };

  const totalBalance = accounts.reduce((sum, acc) => {
    // Convert to USD for total (simplified)
    const rate = acc.currency === 'USD' ? 1 : acc.currency === 'CAD' ? 0.74 : acc.currency === 'EUR' ? 1.08 : 1;
    return sum + (acc.balance * rate);
  }, 0);

  const totalAvailable = accounts.reduce((sum, acc) => {
    const rate = acc.currency === 'USD' ? 1 : acc.currency === 'CAD' ? 0.74 : acc.currency === 'EUR' ? 1.08 : 1;
    return sum + (acc.available_balance * rate);
  }, 0);

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Wallets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Multi-currency balances powered by Moneto</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Moneto Connected
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total Balance (USD eq.)</span>
          </div>
          <p className="font-heading text-2xl font-bold text-foreground">
            {formatCurrency(totalBalance, 'USD')}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Available to Withdraw</span>
          </div>
          <p className="font-heading text-2xl font-bold text-success">
            {formatCurrency(totalAvailable, 'USD')}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Pending Settlement</span>
          </div>
          <p className="font-heading text-2xl font-bold text-warning">
            {formatCurrency(totalBalance - totalAvailable, 'USD')}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 rounded-xl border border-border bg-card">
          <p className="text-muted-foreground">Loading wallets...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-border bg-card">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-2">No wallets yet</p>
          <p className="text-sm text-muted-foreground mb-4">Receive your first payment to create a wallet</p>
          <Button onClick={() => navigate('/new-payment')} className="gap-2">
            <CreditCard className="h-4 w-4" />
            Create Payment
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div key={account.id} className="rounded-xl border border-border bg-card p-5 shadow-card animate-fade-in hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{currencyFlags[account.currency] || '💰'}</span>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">{account.currency}</h3>
                    <p className="text-xs text-muted-foreground">{currencyNames[account.currency] || 'Currency'}</p>
                  </div>
                </div>
                {(() => {
                  const r = latestByCurrency.get(account.currency);
                  if (!r) return <Badge variant="secondary" className="text-xs">Moneto</Badge>;
                  return (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className={`text-[10px] gap-1 ${badgeStyle(r.provider)}`}>
                            <span className="capitalize">{r.provider}</span>
                            <span className="opacity-70">· {r.status}</span>
                            {r.fallbackFrom && <span className="rounded-sm bg-amber-200 px-1 text-amber-800">fallback</span>}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          <div>Routed via <b>{r.provider}</b></div>
                          <div>Last event: {r.status}</div>
                          {r.fallbackFrom && <div>Fallback from {r.fallbackFrom}</div>}
                          <div className="opacity-70">{new Date(r.at).toLocaleString()}</div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })()}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wallet className="h-3.5 w-3.5" />
                    Total Balance
                  </div>
                  <span className="font-heading font-bold text-foreground">
                    {formatCurrency(account.balance, account.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                    Available
                  </div>
                  <span className="text-sm text-success font-medium">
                    {formatCurrency(account.available_balance, account.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-warning" />
                    Pending
                  </div>
                  <span className="text-sm text-warning font-medium">
                    {formatCurrency(account.pending_balance, account.currency)}
                  </span>
                </div>
              </div>

              <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full gradient-primary"
                  style={{ width: `${account.balance > 0 ? (account.available_balance / account.balance) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                {account.balance > 0 ? ((account.available_balance / account.balance) * 100).toFixed(1) : 0}% available
              </p>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => navigate(`/payouts?currency=${account.currency}`)}
                >
                  <Banknote className="h-3.5 w-3.5" />
                  Withdraw
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => window.open('https://demo.genwin.app', '_blank')}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Moneto Info */}
      <div className="mt-8 rounded-xl border border-border bg-card/50 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <img src="https://moneto.ca/favicon.ico" alt="Moneto" className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-foreground mb-1">Powered by Moneto Wallet</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Secure multi-currency wallets with instant settlements and low-cost payouts to Canadian and US banks.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">CAD Supported</Badge>
              <Badge variant="outline">Instant Transfers</Badge>
              <Badge variant="outline">PCI DSS Compliant</Badge>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
