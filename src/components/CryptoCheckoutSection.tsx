import { useState } from 'react';
import { Bitcoin, Coins, QrCode, Copy, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateCryptoPayment, useConvertCrypto } from '@/hooks/useElektropay';
import { toast } from 'sonner';

const CRYPTO_OPTIONS = [
  { id: 'USDT.TRC20', label: 'USDT (TRC-20)', network: 'Tron', icon: '₮' },
  { id: 'USDT.ERC20', label: 'USDT (ERC-20)', network: 'Ethereum', icon: '₮' },
  { id: 'USDC.ERC20', label: 'USDC (ERC-20)', network: 'Ethereum', icon: '$' },
  { id: 'USDC.POLY', label: 'USDC (Polygon)', network: 'Polygon', icon: '$' },
  { id: 'BTC', label: 'Bitcoin', network: 'Bitcoin', icon: '₿' },
  { id: 'ETH', label: 'Ethereum', network: 'Ethereum', icon: 'Ξ' },
  { id: 'LTC', label: 'Litecoin', network: 'Litecoin', icon: 'Ł' },
  { id: 'TRX', label: 'Tron', network: 'Tron', icon: '◈' },
];

interface CryptoCheckoutSectionProps {
  amount: string;
  currency: string;
  customerEmail: string;
  customerName: string;
  description?: string;
  successUrl?: string;
  cancelUrl?: string;
  onPaymentCreated?: (paymentUrl: string) => void;
}

export function CryptoCheckoutSection({
  amount,
  currency,
  customerEmail,
  customerName,
  description,
  successUrl,
  cancelUrl,
  onPaymentCreated,
}: CryptoCheckoutSectionProps) {
  const [selectedCrypto, setSelectedCrypto] = useState('USDT.TRC20');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const createPayment = useCreateCryptoPayment();
  const convertCrypto = useConvertCrypto();

  const selectedOption = CRYPTO_OPTIONS.find(c => c.id === selectedCrypto);

  const handleCryptoPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!customerEmail) {
      toast.error('Customer email is required');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createPayment.mutateAsync({
        amount: parseFloat(amount),
        fiat_currency: currency,
        crypto_currency: selectedCrypto,
        customer_email: customerEmail,
        customer_name: customerName,
        description,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      if (result.payment_url) {
        setPaymentData(result);
        onPaymentCreated?.(result.payment_url);
      } else {
        toast.error('Failed to create crypto payment');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const fiatAmount = parseFloat(amount || '0');

      <Button
        className="w-full gap-2"
        onClick={handleCryptoPayment}
        disabled={isProcessing || !amount || parseFloat(amount) <= 0}
      >
        {isProcessing ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Creating Payment...</>
        ) : (
          <><Bitcoin className="h-4 w-4" /> Pay with {selectedOption?.label || 'Crypto'}</>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
        <Coins className="h-3 w-3" /> Powered by Elektropay
      </div>
    </div>
  );
}
