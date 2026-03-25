import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';

const BRAND_LOGOS: Record<string, string> = {
  visa: '/logos/visa.svg',
  mastercard: '/logos/mastercard.svg',
  amex: '/logos/american-express.svg',
  discover: '/logos/discover.svg',
};

function detectBrand(number: string): string {
  const n = number.replace(/\s/g, '');
  if (!n) return '';
  if (n.startsWith('4')) return 'visa';
  if (n.startsWith('5') || (n.startsWith('2') && parseInt(n.slice(0, 4)) >= 2221 && parseInt(n.slice(0, 4)) <= 2720)) return 'mastercard';
  if (n.startsWith('34') || n.startsWith('37')) return 'amex';
  if (n.startsWith('6')) return 'discover';
  return '';
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(' ') : digits;
}

interface CardNumberInputProps {
  onCardChange: (data: { cardNumber: string; expiry: string; cvv: string; brand: string }) => void;
  disabled?: boolean;
  className?: string;
}

export function CardNumberInput({ onCardChange, disabled, className }: CardNumberInputProps) {
  const [cardNumber, setCardNumber] = React.useState('');
  const [expiry, setExpiry] = React.useState('');
  const [cvv, setCvv] = React.useState('');
  const brand = detectBrand(cardNumber);

  React.useEffect(() => {
    onCardChange({ cardNumber: cardNumber.replace(/\s/g, ''), expiry, cvv, brand });
  }, [cardNumber, expiry, cvv, brand]);

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 19) setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
    setExpiry(v);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="relative">
        <Input
          type="text"
          placeholder="4242 4242 4242 4242"
          value={cardNumber}
          onChange={handleCardChange}
          disabled={disabled}
          className="font-mono pr-14"
          maxLength={23}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {brand && BRAND_LOGOS[brand] ? (
            <img src={BRAND_LOGOS[brand]} alt={brand} className="h-6 w-auto rounded-sm" />
          ) : (
            <div className="flex gap-0.5">
              {Object.entries(BRAND_LOGOS).map(([b, src]) => (
                <img key={b} src={src} alt={b} className="h-4 w-auto rounded-sm opacity-30" />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="text"
          placeholder="MM/YY"
          value={expiry}
          onChange={handleExpiryChange}
          disabled={disabled}
          className="font-mono"
          maxLength={5}
        />
        <Input
          type="text"
          placeholder="CVV"
          value={cvv}
          onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
          disabled={disabled}
          className="font-mono"
          maxLength={4}
        />
      </div>
    </div>
  );
}
