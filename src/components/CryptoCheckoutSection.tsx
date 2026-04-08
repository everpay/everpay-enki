import { useState } from 'react';
import { Bitcoin, Coins, QrCode, Copy, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateCryptoPayment } from '@/hooks/useElektropay';
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

  if (paymentData) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <QrCode className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-heading font-semibold text-foreground">Send Crypto Payment</h3>
          <p className="text-sm text-muted-foreground">
            Send exactly <span className="font-mono font-semibold text-foreground">{paymentData.payment_amount} {paymentData.payment_asset_id}</span> to the address below
          </p>
        </div>

        {paymentData.qrcode_url && (
          <div className="flex justify-center">
            <img src={paymentData.qrcode_url} alt="Payment QR Code" className="w-48 h-48 rounded-lg border border-border" />
          </div>
        )}

        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <Label className="text-xs text-muted-foreground">Wallet Address</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-background rounded px-2 py-1.5 break-all border border-border">
              {paymentData.address}
            </code>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(paymentData.address)}>
              {copied ? <CheckCircle className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Network</span>
            <span className="font-medium text-foreground">{paymentData.crypto_network_name || selectedOption?.network}</span>
          </div>
          <div className="flex justify-between">
            <span>Rate</span>
            <span className="font-mono">{paymentData.rate ? `1 ${currency} = ${paymentData.rate} ${paymentData.payment_asset_id}` : 'N/A'}</span>
          </div>
        </div>

        <Button variant="outline" className="w-full gap-2" onClick={() => window.open(paymentData.payment_url, '_blank')}>
          <ExternalLink className="h-3.5 w-3.5" /> Open Payment Page
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Select Cryptocurrency</Label>
        <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CRYPTO_OPTIONS.map(opt => (
              <SelectItem key={opt.id} value={opt.id}>
                <span className="flex items-center gap-2">
                  <span className="text-lg">{opt.icon}</span>
                  <span>{opt.label}</span>
                  <Badge variant="outline" className="text-[10px] ml-1">{opt.network}</Badge>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
