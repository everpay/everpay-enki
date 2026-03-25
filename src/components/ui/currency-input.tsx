import * as React from 'react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Input } from './input';

const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸', symbol: '$' },
  { code: 'EUR', flag: '🇪🇺', symbol: '€' },
  { code: 'GBP', flag: '🇬🇧', symbol: '£' },
  { code: 'CAD', flag: '🇨🇦', symbol: '$' },
  { code: 'BRL', flag: '🇧🇷', symbol: 'R$' },
  { code: 'MXN', flag: '🇲🇽', symbol: '$' },
  { code: 'COP', flag: '🇨🇴', symbol: '$' },
  { code: 'INR', flag: '🇮🇳', symbol: '₹' },
  { code: 'NGN', flag: '🇳🇬', symbol: '₦' },
  { code: 'ZAR', flag: '🇿🇦', symbol: 'R' },
  { code: 'KES', flag: '🇰🇪', symbol: 'KSh' },
  { code: 'ARS', flag: '🇦🇷', symbol: '$' },
  { code: 'BDT', flag: '🇧🇩', symbol: '৳' },
  { code: 'PKR', flag: '🇵🇰', symbol: '₨' },
  { code: 'EGP', flag: '🇪🇬', symbol: 'E£' },
  { code: 'JPY', flag: '🇯🇵', symbol: '¥' },
  { code: 'CNY', flag: '🇨🇳', symbol: '¥' },
  { code: 'AUD', flag: '🇦🇺', symbol: '$' },
  { code: 'HKD', flag: '🇭🇰', symbol: '$' },
  { code: 'KRW', flag: '🇰🇷', symbol: '₩' },
  { code: 'THB', flag: '🇹🇭', symbol: '฿' },
  { code: 'VND', flag: '🇻🇳', symbol: '₫' },
  { code: 'IDR', flag: '🇮🇩', symbol: 'Rp' },
  { code: 'MYR', flag: '🇲🇾', symbol: 'RM' },
  { code: 'PHP', flag: '🇵🇭', symbol: '₱' },
] as const;

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  currencies?: string[];
  disabled?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  step?: string;
  readOnly?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  currency,
  onCurrencyChange,
  currencies,
  disabled,
  min,
  max,
  placeholder = '0.00',
  className,
  required,
  step = '0.01',
  readOnly,
}: CurrencyInputProps) {
  const availableCurrencies = currencies
    ? CURRENCIES.filter(c => currencies.includes(c.code))
    : CURRENCIES;

  const selected = CURRENCIES.find(c => c.code === currency);

  return (
    <div className={cn('flex rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background', className)}>
      <Select value={currency} onValueChange={onCurrencyChange} disabled={disabled}>
        <SelectTrigger className="w-[110px] border-0 border-r border-input rounded-r-none shadow-none focus:ring-0 focus:ring-offset-0 bg-muted/50 shrink-0">
          <SelectValue>
            <span className="flex items-center gap-1.5 text-sm">
              <span>{selected?.flag}</span>
              <span className="font-medium">{currency}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[280px]">
          {availableCurrencies.map(c => (
            <SelectItem key={c.code} value={c.code}>
              <span className="flex items-center gap-2">
                <span>{c.flag}</span>
                <span className="font-medium">{c.code}</span>
                <span className="text-muted-foreground text-xs">{c.symbol}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="relative flex-1">
        {selected && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            {selected.symbol}
          </span>
        )}
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          min={min}
          max={max}
          step={step}
          required={required}
          className={cn(
            'border-0 shadow-none rounded-l-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-lg',
            selected ? 'pl-9' : 'pl-3'
          )}
        />
      </div>
    </div>
  );
}

export { CURRENCIES };
