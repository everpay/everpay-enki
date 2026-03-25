import * as React from 'react';
import { cn } from '@/lib/utils';
import { CurrencyInput } from './currency-input';
import { Button } from './button';
import { ArrowUpDown, RefreshCw } from 'lucide-react';

const MOCK_RATES: Record<string, number> = {
  'USD-EUR': 0.92, 'EUR-USD': 1.087, 'USD-GBP': 0.79, 'GBP-USD': 1.265,
  'USD-BRL': 5.18, 'BRL-USD': 0.193, 'USD-CAD': 1.36, 'CAD-USD': 0.735,
  'USD-MXN': 17.12, 'MXN-USD': 0.058, 'USD-INR': 83.2, 'INR-USD': 0.012,
  'USD-JPY': 149.5, 'JPY-USD': 0.0067, 'USD-BTC': 0.0000148, 'BTC-USD': 67500,
  'USD-ETH': 0.000285, 'ETH-USD': 3510,
};

const ALL_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CAD', 'BRL', 'MXN', 'COP', 'INR', 'NGN',
  'ZAR', 'KES', 'JPY', 'CNY', 'AUD', 'BDT', 'PKR',
];

interface CurrencyConverterProps {
  className?: string;
}

export function CurrencyConverter({ className }: CurrencyConverterProps) {
  const [fromAmount, setFromAmount] = React.useState('100');
  const [fromCurrency, setFromCurrency] = React.useState('USD');
  const [toCurrency, setToCurrency] = React.useState('EUR');
  const [lastUpdated, setLastUpdated] = React.useState(new Date());

  const rateKey = `${fromCurrency}-${toCurrency}`;
  const rate = MOCK_RATES[rateKey] || 1;
  const toAmount = fromAmount ? (parseFloat(fromAmount) * rate).toFixed(
    ['BTC', 'ETH'].includes(toCurrency) ? 8 : 2
  ) : '';

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
  };

  return (
    <div className={cn('space-y-3 rounded-xl border border-border bg-card p-4', className)}>
      <CurrencyInput
        value={fromAmount}
        onChange={setFromAmount}
        currency={fromCurrency}
        onCurrencyChange={setFromCurrency}
        currencies={ALL_CURRENCIES}
      />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full shrink-0" onClick={handleSwap}>
          <ArrowUpDown className="h-4 w-4" />
        </Button>
        <div className="flex-1 h-px bg-border" />
      </div>

      <CurrencyInput
        value={toAmount}
        onChange={() => {}}
        currency={toCurrency}
        onCurrencyChange={setToCurrency}
        currencies={ALL_CURRENCIES}
        readOnly
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span>1 {fromCurrency} = {rate} {toCurrency}</span>
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs px-2" onClick={() => setLastUpdated(new Date())}>
          <RefreshCw className="h-3 w-3" />
          {lastUpdated.toLocaleTimeString()}
        </Button>
      </div>
    </div>
  );
}
