import { useState, useEffect } from 'react';
import { CountrySelect } from '@/components/CountrySelect';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, ArrowRight, Loader2, Shield, Lock, CheckCircle, Globe, Building2, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ThreeDSecureModal } from '@/components/ThreeDSecureModal';
import { usePaymentPolling } from '@/hooks/usePaymentPolling';



export default function Checkout() {
  const [searchParams] = useSearchParams();

  const amount = searchParams.get('amount') || '';
  const currency = searchParams.get('currency') || 'USD';
  const description = searchParams.get('description') ? decodeURIComponent(searchParams.get('description')!) : '';
  const email = searchParams.get('email') ? decodeURIComponent(searchParams.get('email')!) : '';
  const name = searchParams.get('name') ? decodeURIComponent(searchParams.get('name')!) : '';
  const ref = searchParams.get('ref') || '';
  const source = searchParams.get('source') || '';
  const orderId = searchParams.get('order_id') || ref;
  const method = searchParams.get('method') || 'all';
  const merchantId = searchParams.get('merchant_id') || '';
  const successUrl = searchParams.get('success_url') ? decodeURIComponent(searchParams.get('success_url')!) : '';
  const cancelUrl = searchParams.get('cancel_url') ? decodeURIComponent(searchParams.get('cancel_url')!) : '';

  const [customAmount, setCustomAmount] = useState(amount);
  const [customerEmail, setCustomerEmail] = useState(email);
  const [customerName, setCustomerName] = useState(name);
  const [customerPhone, setCustomerPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [billingCountry, setBillingCountry] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'openbanking'>(
    method === 'openbanking' ? 'openbanking' : 'card'
  );
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [threeDSUrl, setThreeDSUrl] = useState('');
  const [threeDSTransactionId, setThreeDSTransactionId] = useState('');
  const [showThreeDS, setShowThreeDS] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFailedProvider, setLastFailedProvider] = useState('');
  const [showRetryPanel, setShowRetryPanel] = useState(false);

  const redirectToOutcome = (outcome: 'success' | 'failed', transactionId?: string) => {
    const target = outcome === 'success'
      ? (successUrl || `/checkout/thank-you?amount=${encodeURIComponent(displayAmount)}&currency=${encodeURIComponent(currency)}`)
      : (cancelUrl || `/checkout/declined?amount=${encodeURIComponent(displayAmount)}&currency=${encodeURIComponent(currency)}`);

    const url = new URL(target, window.location.origin);
    if (transactionId) url.searchParams.set('transaction_id', transactionId);
    if (ref) url.searchParams.set('ref', ref);
    window.location.href = url.toString();
  };

  const { isPolling, startPolling } = usePaymentPolling({
    transactionId: null,
    enabled: false,
    onComplete: () => {
      setPaymentComplete(true);
      setShowThreeDS(false);
      setTimeout(() => redirectToOutcome('success', threeDSTransactionId), 1200);
    },
    onFailed: () => {
      setShowThreeDS(false);
      setTimeout(() => redirectToOutcome('failed', threeDSTransactionId), 600);
    },
  });

  const displayAmount = amount || customAmount;

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: any = {
        amount: parseFloat(displayAmount),
        currency,
        paymentMethod,
        customerEmail: customerEmail,
        description: description || `Payment ${ref}`,
        idempotencyKey: `link_${ref}_${Date.now()}`,
        merchantId: merchantId || undefined,
        source: source || undefined,
        orderId: orderId || undefined,
        successUrl: successUrl || undefined,
        cancelUrl: cancelUrl || undefined,
        customerDetails: {
          firstName: customerName.split(' ')[0] || '',
          lastName: customerName.split(' ').slice(1).join(' ') || '',
          phone: customerPhone,
        },
        billingDetails: {
          address: billingAddress,
          city: billingCity,
          state: billingState,
          postalCode: billingZip,
          country: billingCountry,
        },
      };

      if (paymentMethod === 'card' && cardNumber) {
        payload.cardDetails = {
          number: cardNumber.replace(/\s/g, ''),
          expMonth,
          expYear,
          cvc,
        };
      }

      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: payload,
      });

      if (error) throw error;

      // Handle 3DS redirect
      if (data?.providerResponse?.redirect_url || data?.providerResponse?.['3d_secure_redirect_url']) {
        const redirectUrl = data.providerResponse.redirect_url || data.providerResponse['3d_secure_redirect_url'];
        setThreeDSUrl(redirectUrl);
        setThreeDSTransactionId(data.transaction?.id || data.payment_intent?.id || '');
        setShowThreeDS(true);
        if (data.transaction?.id) startPolling(data.transaction.id);
        toast.info('3D Secure authentication required');
        setIsSubmitting(false);
        return;
      }

      // Start polling for pending payments
      if (data?.transaction?.status === 'pending' && data?.transaction?.id) {
        startPolling(data.transaction.id);
        toast.info('Payment is processing. We will update shortly.');
        return;
      }

      if (!data?.success || data?.transaction?.status === 'failed') {
        setRetryCount(prev => prev + 1);
        setLastFailedProvider(data?.transaction?.provider || '');
        if (retryCount < 2) {
          toast.error('Payment declined', {
            description: 'Try again or use a different payment method.',
            action: {
              label: 'Retry',
              onClick: () => handleSubmit(new Event('submit') as any),
            },
          });
          setShowRetryPanel(true);
        } else {
          toast.error('Payment declined after multiple attempts');
          redirectToOutcome('failed', data?.transaction?.id);
        }
        return;
      }

      // Send payment receipt email to customer
      if (customerEmail && data.transaction) {
        try {
          await supabase.functions.invoke('send-transactional-email', {
            body: {
              type: 'payment_receipt',
              to: customerEmail,
              data: {
                amount: parseFloat(displayAmount),
                currency,
                transaction_id: data.transaction.id,
                description: description || `Payment ${ref}`,
                date: new Date().toISOString(),
              },
            },
          });
          console.log('Payment receipt email sent to:', customerEmail);
        } catch (emailError) {
          console.error('Failed to send payment receipt email:', emailError);
          // Don't fail the payment if email fails
        }
      }

      setPaymentComplete(true);
      setTimeout(() => redirectToOutcome('success', data.transaction?.id || ''), 1200);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Payment Successful</h1>
          <p className="text-muted-foreground">
            Your payment of{' '}
            <span className="font-semibold text-foreground">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(parseFloat(displayAmount))}
            </span>{' '}
            has been processed.
          </p>
          {ref && (
            <p className="text-sm text-muted-foreground">Reference: <span className="font-mono">{ref}</span></p>
          )}
          {successUrl && (
            <p className="text-sm text-muted-foreground">Redirecting you back...</p>
          )}
          {!successUrl && (
            <p className="text-sm text-muted-foreground">You can close this window.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">Everpay</span>
          </div>
          {displayAmount && (
            <p className="text-4xl font-bold text-foreground">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(parseFloat(displayAmount))}
            </p>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Full Name</Label>
              <Input
                placeholder="John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-background border-border"
                disabled={!!name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="bg-background border-border"
                disabled={!!email}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Phone Number</Label>
            <Input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="bg-background border-border"
              required
            />
          </div>

          {/* Billing Address */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Billing Address</Label>
            <div className="space-y-2">
              <Input
                placeholder="Street address"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="bg-background border-border"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="City"
                value={billingCity}
                onChange={(e) => setBillingCity(e.target.value)}
                className="bg-background border-border"
                required
              />
              <Input
                placeholder="State / Province"
                value={billingState}
                onChange={(e) => setBillingState(e.target.value)}
                className="bg-background border-border"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Zip / Postal code"
                value={billingZip}
                onChange={(e) => setBillingZip(e.target.value)}
                className="bg-background border-border"
                required
              />
              <Input
                placeholder="Country (e.g. US)"
                value={billingCountry}
                onChange={(e) => setBillingCountry(e.target.value.toUpperCase())}
                className="bg-background border-border"
                maxLength={2}
                required
              />
            </div>
          </div>

          {!amount && (
            <div className="space-y-2">
              <Label className="text-xs">Amount ({currency})</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="bg-background border-border font-mono text-lg"
                min="0.01"
                step="0.01"
                required
              />
            </div>
          )}

          {/* Payment Method Tabs */}
          {method === 'all' ? (
            <Tabs value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="card" className="gap-2">
                  <CreditCard className="h-3.5 w-3.5" /> Card
                </TabsTrigger>
                <TabsTrigger value="openbanking" className="gap-2">
                  <Building2 className="h-3.5 w-3.5" /> Bank
                </TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="mt-4">
                <CardFields
                  cardNumber={cardNumber} setCardNumber={setCardNumber}
                  expMonth={expMonth} setExpMonth={setExpMonth}
                  expYear={expYear} setExpYear={setExpYear}
                  cvc={cvc} setCvc={setCvc}
                  formatCardNumber={formatCardNumber}
                />
              </TabsContent>

              <TabsContent value="openbanking" className="mt-4">
                <OpenBankingSection currency={currency} />
              </TabsContent>
            </Tabs>
          ) : method === 'openbanking' ? (
            <OpenBankingSection currency={currency} />
          ) : (
            <CardFields
              cardNumber={cardNumber} setCardNumber={setCardNumber}
              expMonth={expMonth} setExpMonth={setExpMonth}
              expYear={expYear} setExpYear={setExpYear}
              cvc={cvc} setCvc={setCvc}
              formatCardNumber={formatCardNumber}
            />
          )}

          <Button type="submit" className="w-full gap-2" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
            ) : (
              <>
                Pay {displayAmount ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(parseFloat(displayAmount)) : ''}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          {/* Security Footer */}
          <div className="flex items-center justify-center gap-4 pt-2 border-t border-border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> SSL Encrypted
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" /> PCI Compliant
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            Secured by <span className="font-medium text-foreground">Everpay</span> · checkout.everpayinc.com
          </p>
          {ref && (
            <p className="text-[10px] font-mono text-muted-foreground">Ref: {ref}</p>
          )}
          {cancelUrl && (
            <a href={cancelUrl} className="text-xs text-primary hover:underline">
              Cancel and return
            </a>
          )}
        </div>
      </div>

      {/* Retry Panel */}
      {showRetryPanel && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-5">
            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center">Payment Failed</h2>
            <p className="text-sm text-muted-foreground text-center">
              Your payment couldn't be processed{lastFailedProvider ? ` via ${lastFailedProvider}` : ''}. Try again or use a different method.
            </p>
            <div className="space-y-3">
              <Button
                className="w-full gap-2"
                onClick={() => {
                  setShowRetryPanel(false);
                  handleSubmit(new Event('submit') as any);
                }}
              >
                <RefreshCw className="h-4 w-4" /> Retry Payment
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  setShowRetryPanel(false);
                  setPaymentMethod(paymentMethod === 'card' ? 'openbanking' : 'card');
                }}
              >
                <Building2 className="h-4 w-4" /> Try {paymentMethod === 'card' ? 'Bank Transfer' : 'Card'} Instead
              </Button>
              {cancelUrl && (
                <Button variant="ghost" className="w-full text-muted-foreground" asChild>
                  <a href={cancelUrl}>Cancel and return</a>
                </Button>
              )}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Attempt {retryCount} of 3 · Secured by Everpay
            </p>
          </div>
        </div>
      )}

      {/* 3DS Modal */}
      <ThreeDSecureModal
        open={showThreeDS}
        onClose={() => setShowThreeDS(false)}
        redirectUrl={threeDSUrl}
        transactionId={threeDSTransactionId}
        onComplete={() => {
          setShowThreeDS(false);
        }}
      />
    </div>
  );
}

function CardFields({
  cardNumber, setCardNumber, expMonth, setExpMonth, expYear, setExpYear, cvc, setCvc, formatCardNumber,
}: {
  cardNumber: string; setCardNumber: (v: string) => void;
  expMonth: string; setExpMonth: (v: string) => void;
  expYear: string; setExpYear: (v: string) => void;
  cvc: string; setCvc: (v: string) => void;
  formatCardNumber: (v: string) => string;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">Card Number</Label>
        <Input
          type="text"
          placeholder="4242 4242 4242 4242"
          value={formatCardNumber(cardNumber)}
          onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
          className="bg-background border-border font-mono"
          maxLength={19}
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Month</Label>
          <Input type="text" placeholder="12" value={expMonth} onChange={(e) => setExpMonth(e.target.value)} className="bg-background border-border" maxLength={2} required />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Year</Label>
          <Input type="text" placeholder="2025" value={expYear} onChange={(e) => setExpYear(e.target.value)} className="bg-background border-border" maxLength={4} required />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">CVC</Label>
          <Input type="text" placeholder="123" value={cvc} onChange={(e) => setCvc(e.target.value)} className="bg-background border-border" maxLength={4} required />
        </div>
      </div>
    </div>
  );
}

function OpenBankingSection({ currency }: { currency: string }) {
  const banks = ['EUR', 'GBP'].includes(currency)
    ? [
        { name: 'Revolut', icon: '🏦' },
        { name: 'Monzo', icon: '🏦' },
        { name: 'Barclays', icon: '🏦' },
        { name: 'HSBC', icon: '🏦' },
        { name: 'Deutsche Bank', icon: '🏦' },
        { name: 'ING', icon: '🏦' },
      ]
    : [
        { name: 'Chase', icon: '🏦' },
        { name: 'Bank of America', icon: '🏦' },
        { name: 'Wells Fargo', icon: '🏦' },
        { name: 'Citi', icon: '🏦' },
      ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium text-foreground">Select your bank</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {banks.map((bank) => (
          <button
            key={bank.name}
            type="button"
            className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-sm text-foreground hover:border-primary hover:bg-primary/5 transition-colors text-left"
          >
            <span>{bank.icon}</span>
            <span>{bank.name}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        You'll be redirected to your bank to authorize the payment securely.
      </p>
    </div>
  );
}
