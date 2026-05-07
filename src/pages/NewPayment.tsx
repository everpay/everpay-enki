import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Currency } from '@/lib/types';
import { resolveProvider } from '@/lib/providers';
import { Badge } from '@/components/ui/badge';
import { CountrySelect, COUNTRIES } from '@/components/CountrySelect';
import { COUNTRY_PAYMENT_CONFIGS, getConfigForCountry } from '@/lib/country-routing';
import { CreditCard, ArrowRight, Loader2, Globe, MapPin, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { VGSCardForm } from '@/components/VGSCardForm';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeviceAnalytics } from '@/hooks/useDeviceAnalytics';
import { useFraudDetection, FraudRiskResult } from '@/hooks/useFraudDetection';
import { useFeePreview } from '@/hooks/useFeePreview';
import { Receipt } from 'lucide-react';

import { usePaymentPolling } from '@/hooks/usePaymentPolling';

// Detect region from browser locale / timezone
function detectRegion(): { region: string; label: string; flag: string } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locale = navigator.language || 'en-US';

    if (tz.startsWith('Europe/') || locale.startsWith('en-GB') || locale.startsWith('de') || locale.startsWith('fr') || locale.startsWith('es-ES')) {
      return { region: 'EU', label: 'EU Region', flag: '🇪🇺' };
    }
    if (tz.startsWith('America/Sao_Paulo') || tz.startsWith('Brazil') || locale.startsWith('pt-BR')) {
      return { region: 'BR', label: 'Brazil', flag: '🇧🇷' };
    }
    if (tz.startsWith('America/Mexico') || locale.startsWith('es-MX')) {
      return { region: 'MX', label: 'Mexico', flag: '🇲🇽' };
    }
    if (tz.startsWith('America/Bogota') || locale.startsWith('es-CO')) {
      return { region: 'CO', label: 'Colombia', flag: '🇨🇴' };
    }
    return { region: 'US', label: 'US/Global', flag: '🌐' };
  } catch {
    return { region: 'US', label: 'US/Global', flag: '🌐' };
  }
}

// Map region to preferred currency
function regionToCurrency(region: string): Currency {
  switch (region) {
    case 'EU': return 'EUR';
    case 'BR': return 'BRL';
    case 'MX': return 'MXN';
    case 'CO': return 'COP';
    default: return 'USD';
  }
}

export default function NewPayment() {
  const detectedRegion = detectRegion();
  const defaultCurrency = regionToCurrency(detectedRegion.region);

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix' | 'boleto' | 'apple_pay' | 'open_banking' | 'upi' | 'bank_transfer' | 'spei' | 'wallet' | 'p2p'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [holderName, setHolderName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingPostalCode, setBillingPostalCode] = useState('');
  const [billingCountry, setBillingCountry] = useState('US');
  const selectedCountryConfig = getConfigForCountry(billingCountry);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vgsToken, setVgsToken] = useState('');
  const [cardEntryMode, setCardEntryMode] = useState<'standard' | 'vgs'>('standard');
  const [threeDSUrl, setThreeDSUrl] = useState('');
  const [threeDSTransactionId, setThreeDSTransactionId] = useState('');
  const [showThreeDS, setShowThreeDS] = useState(false);

  const queryClient = useQueryClient();
  const { deviceInfo } = useDeviceAnalytics();
  const { isChecking: isFraudChecking, lastResult: fraudResult, checkFraud } = useFraudDetection();
  const selectedProvider = resolveProvider(currency, billingCountry);
  const numericAmount = parseFloat(amount) || 0;
  const { data: feePreview, isLoading: feePreviewLoading, error: feePreviewError, refetch: refetchFee } = useFeePreview(selectedProvider, currency, numericAmount);
  const feeMissing = !feePreviewLoading && !feePreviewError && !feePreview?.matched;
  const idempotencyKey = `idk_${Date.now()}`;

  const { isPolling, currentStatus: pollingStatus, startPolling } = usePaymentPolling({
    transactionId: null,
    enabled: false,
    onComplete: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to create a payment');
        return;
      }

      // Run fraud check first
      const cardBin = cardNumber?.replace(/\s/g, '').slice(0, 6);
      const fraudCheck = await checkFraud({
        card_bin: cardBin || undefined,
        card_last4: cardNumber?.replace(/\s/g, '').slice(-4) || undefined,
        customer_email: email || undefined,
        amount: parseFloat(amount),
        currency,
        device_fingerprint: deviceInfo?.device_id,
        ip_address: deviceInfo?.ip_address,
        user_agent: deviceInfo?.user_agent,
        device_type: deviceInfo?.device_type,
        timezone: deviceInfo?.timezone,
      });

      if (fraudCheck?.action === 'block') {
        toast.error('Payment blocked by fraud detection', {
          description: `Risk score: ${fraudCheck.total_score}/100 — ${fraudCheck.factors.join(', ')}`,
        });
        setIsSubmitting(false);
        return;
      }

      if (fraudCheck?.action === 'review') {
        toast.warning('Payment flagged for review', {
          description: `Risk score: ${fraudCheck.total_score}/100`,
        });
      }

      const payload: any = {
        amount: parseFloat(amount),
        currency,
        paymentMethod,
        customerEmail: email,
        description,
        idempotencyKey,
        customerDetails: {
          firstName: firstName || 'Customer',
          lastName: lastName || 'User',
          phone: phone || '1234567890',
        },
        billingDetails: {
          address: billingAddress || '123 Main St',
          postalCode: billingPostalCode || '12345',
          city: billingCity || 'New York',
          state: billingState || 'NY',
          country: billingCountry || 'US',
        },
        deviceInfo: deviceInfo ? {
          device_type: deviceInfo.device_type,
          os: deviceInfo.os,
          browser: deviceInfo.browser,
          browser_version: deviceInfo.browser_version,
          screen_resolution: deviceInfo.screen_resolution,
          timezone: deviceInfo.timezone,
          user_agent: deviceInfo.user_agent,
          ip_address: deviceInfo.ip_address,
        } : undefined,
      };

      if (paymentMethod === 'card') {
        if (cardEntryMode === 'vgs' && vgsToken) {
          payload.vgsToken = vgsToken;
        } else if (cardNumber) {
          payload.cardDetails = { number: cardNumber, expMonth, expYear, cvc, holderName: holderName || `${firstName} ${lastName}` };
        }
      }

      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: payload,
      });

      if (error) throw error;

      // Handle 3DS redirect from Mondo
      if (data?.providerResponse?.redirect_url || data?.providerResponse?.['3d_secure_redirect_url']) {
        const redirectUrl = data.providerResponse.redirect_url || data.providerResponse['3d_secure_redirect_url'];
        setThreeDSUrl(redirectUrl);
        setThreeDSTransactionId(data.transaction?.id || '');
        setShowThreeDS(true);
        // Start polling for status updates during 3DS
        if (data.transaction?.id) {
          startPolling(data.transaction.id);
        }
        toast.info('3D Secure authentication required', {
          description: 'Please complete verification with your bank.',
        });
        setIsSubmitting(false);
        return;
      }

      if (data?.success) {
        toast.success('Payment created successfully!', {
          description: `${amount} ${currency} via ${selectedProvider} — ${data.transaction.id.slice(0, 8)}`,
        });
      } else if (data?.transaction?.status === 'pending') {
        // Start polling for pending transactions
        if (data.transaction?.id) {
          startPolling(data.transaction.id);
        }
        toast.info('Payment processing', {
          description: `Checking status for ${data.transaction.id.slice(0, 8)}...`,
        });
      } else {
        toast.warning('Payment pending', {
          description: `Status: ${data?.transaction?.status || 'unknown'} — ${data?.transaction?.id?.slice(0, 8) || ''}`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      setAmount(''); setEmail(''); setDescription('');
      setCardNumber(''); setExpMonth(''); setExpYear(''); setCvc('');
      setHolderName(''); setFirstName(''); setLastName(''); setPhone('');
      setBillingAddress(''); setBillingCity(''); setBillingState(''); setBillingPostalCode('');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const providerRegionLabel: Record<string, { label: string; badge: string }> = {
    mondo: { label: 'EU / UK payments', badge: '🇪🇺 Mondo' },
    shieldhub: { label: 'US & Global payments', badge: '🌐 ShieldHub' },
    stripe: { label: 'Global fallback', badge: '⚡ Stripe' },
    paygate10: { label: 'Emerging markets', badge: '🌍 Paygate10' },
    ofa: { label: 'Asia-Pacific payments', badge: '🌏 OFA Pay' },
    moneto: { label: 'Canada payments', badge: '🇨🇦 Moneto' },
  };

  const providerInfo = providerRegionLabel[selectedProvider] || { label: '', badge: selectedProvider };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Create Payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">Route payment through optimal provider</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="space-y-2">
            <Label>Amount & Currency</Label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              currency={currency}
              onCurrencyChange={(v) => setCurrency(v as Currency)}
              required
              min="0.01"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">💳 Card</SelectItem>
                <SelectItem value="pix">🇧🇷 PIX</SelectItem>
                <SelectItem value="boleto">📄 Boleto</SelectItem>
                <SelectItem value="apple_pay"><span className="inline-flex items-center gap-1.5"><img src="/logos/apple-pay-icon.png" alt="" className="h-4 w-auto" /> Apple Pay</span></SelectItem>
                <SelectItem value="open_banking">🏦 Open Banking</SelectItem>
                <SelectItem value="upi">🇮🇳 UPI</SelectItem>
                <SelectItem value="bank_transfer"><span className="inline-flex items-center gap-1.5"><img src="/logos/bank-transfer-icon.png" alt="" className="h-4 w-auto" /> Bank Transfer</span></SelectItem>
                <SelectItem value="spei">🇲🇽 SPEI</SelectItem>
                <SelectItem value="wallet">👛 Wallet</SelectItem>
                <SelectItem value="p2p">🔄 P2P</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Tabs */}
          <Tabs value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="card" className="gap-1.5">💳 Card</TabsTrigger>
              <TabsTrigger value="open_banking" className="gap-1.5"><img src="/logos/bank-transfer-icon.png" alt="" className="h-4 w-auto" /> Open Banking</TabsTrigger>
              <TabsTrigger value="apple_pay" className="gap-1.5"><img src="/logos/apple-pay-icon.png" alt="" className="h-4 w-auto" /> Apple Pay</TabsTrigger>
              <TabsTrigger value="pix">🇧🇷 PIX</TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="mt-4">
              <Tabs value={cardEntryMode} onValueChange={(v: any) => setCardEntryMode(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="standard">One Time Payment</TabsTrigger>
                  <TabsTrigger value="vgs">Recurring Payment</TabsTrigger>
                </TabsList>

                <TabsContent value="standard" className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                  <div className="space-y-2">
                    <Label>Cardholder Name</Label>
                    <Input
                      type="text" placeholder="Joe Doe" value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Card Number</Label>
                    <Input
                      type="text" placeholder="4242 4242 4242 4242" value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="bg-background border-border font-mono" maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Exp Month</Label>
                      <Input type="text" placeholder="04" value={expMonth} onChange={(e) => setExpMonth(e.target.value)} className="bg-background border-border" maxLength={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>Exp Year</Label>
                      <Input type="text" placeholder="27" value={expYear} onChange={(e) => setExpYear(e.target.value)} className="bg-background border-border" maxLength={4} />
                    </div>
                    <div className="space-y-2">
                      <Label>CVC</Label>
                      <Input type="text" placeholder="123" value={cvc} onChange={(e) => setCvc(e.target.value)} className="bg-background border-border" maxLength={4} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="vgs" className="mt-4">
                  <VGSCardForm onTokenReceived={setVgsToken} isSubmitting={isSubmitting} />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="open_banking" className="mt-4 space-y-4 p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Open Banking Payment</h4>
                  <p className="text-xs text-muted-foreground">Pay directly from your bank account</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Select your bank to initiate a secure bank transfer. You'll be redirected to your bank's authentication page.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Badge variant="outline" className="justify-center py-2">🇬🇧 UK Banks</Badge>
                  <Badge variant="outline" className="justify-center py-2">🇪🇺 EU Banks</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported via Mondo Open Banking API. Instant settlement for EUR/GBP.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="apple_pay" className="mt-4 space-y-4 p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-foreground flex items-center justify-center p-1.5">
                  <img src="/logos/apple-pay-icon.png" alt="Apple Pay" className="h-full w-auto brightness-0 invert" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Apple Pay</h4>
                  <p className="text-xs text-muted-foreground">Fast checkout with Face ID or Touch ID</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Use Apple Pay for a quick and secure checkout. Your card details are never shared.
                </p>
                <div className="bg-foreground text-background rounded-lg py-3 text-center font-medium cursor-pointer hover:opacity-90 transition-opacity">
                   Pay with Apple Pay
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Available on Safari and iOS devices
                </p>
              </div>
            </TabsContent>

            <TabsContent value="pix" className="mt-4 space-y-4 p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#32BCAD]/10 flex items-center justify-center">
                  <span className="text-lg">🇧🇷</span>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">PIX Instant Payment</h4>
                  <p className="text-xs text-muted-foreground">Brazil's instant payment system</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Scan the QR code with your banking app to complete the payment instantly.
                </p>
                <div className="flex justify-center py-4">
                  <div className="h-32 w-32 bg-muted rounded-lg flex items-center justify-center border border-border">
                    <span className="text-xs text-muted-foreground">QR Code</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Available for BRL transactions only
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Customer Details */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="text-sm font-medium text-foreground">Customer Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input type="text" placeholder="Joe" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input type="text" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-background border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="customer@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="text" placeholder="(702)486-5000" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-background border-border" />
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="text-sm font-medium text-foreground">Billing Address</h4>
            <div className="space-y-2">
              <Label>Street Address</Label>
              <Input type="text" placeholder="123 Main St" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Input type="text" placeholder="Las Vegas" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input type="text" placeholder="NV" value={billingState} onChange={(e) => setBillingState(e.target.value)} className="bg-background border-border" maxLength={2} />
              </div>
              <div className="space-y-2">
                <Label>Zip Code</Label>
                <Input type="text" placeholder="89101" value={billingPostalCode} onChange={(e) => setBillingPostalCode(e.target.value)} className="bg-background border-border" maxLength={10} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <CountrySelect value={billingCountry} onValueChange={setBillingCountry} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Payment description..." value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background border-border resize-none" rows={3}
            />
          </div>

          <Button type="submit" className="w-full gap-2" size="lg" disabled={isSubmitting || feePreviewLoading || feeMissing}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Processing...</>
            ) : feeMissing ? (
              <>Add fee profile to enable</>
            ) : (
              <><CreditCard className="h-4 w-4" />Create Payment<ArrowRight className="h-4 w-4" /></>
            )}
          </Button>
        </form>

        <div className="space-y-4">
          {/* Region Detection */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="font-heading text-sm font-semibold text-foreground">Region Detected</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{detectedRegion.flag}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{detectedRegion.label}</p>
                <p className="text-xs text-muted-foreground">Default currency: {defaultCurrency}</p>
              </div>
            </div>
          </div>

          {/* Routing Preview */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Routing Preview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Provider</span>
                <Badge variant="provider">{selectedProvider}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Route</span>
                <span className="text-xs text-muted-foreground">{providerInfo.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Currency</span>
                <span className="text-sm font-medium text-foreground">{currency}</span>
              </div>
              {['BRL', 'MXN', 'COP'].includes(currency) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Settlement</span>
                  <span className="text-sm text-foreground">USD (auto-convert)</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Vault</span>
                <Badge variant="outline" className="text-xs">Parallel</Badge>
              </div>
            </div>
          </div>

          {/* Fee Preview */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="h-4 w-4 text-primary" />
              <h3 className="font-heading text-sm font-semibold text-foreground">Processor Fee Preview</h3>
            </div>
            {feePreviewLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Calculating fee…
              </div>
            ) : feePreviewError ? (
              <div className="space-y-2">
                <p className="text-xs text-destructive">
                  Failed to load fee preview: {(feePreviewError as Error).message}
                </p>
                <button type="button" onClick={() => refetchFee()} className="text-xs underline text-primary">Retry</button>
              </div>
            ) : !feePreview?.matched ? (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-1">
                <p className="text-xs font-medium text-warning-foreground">
                  No fee profile for <span className="font-mono">{selectedProvider}</span> / {currency}.
                </p>
                <p className="text-xs text-muted-foreground">
                  Submission is disabled. Add one in <span className="font-medium">Enki → Fee Engine</span>.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-mono text-foreground">{feePreview.amount.toFixed(2)} {currency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">% Fee ({Number(feePreview.profile.percentage_fee)}%)</span>
                  <span className="font-mono text-foreground">{feePreview.percentageAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fixed Fee</span>
                  <span className="font-mono text-foreground">{feePreview.fixedAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">Total Fee</span>
                  <span className="font-mono font-semibold text-destructive">−{feePreview.totalFee.toFixed(2)} {currency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Net to Merchant</span>
                  <span className="font-mono font-semibold text-primary">{feePreview.net.toFixed(2)} {currency}</span>
                </div>
                <p className="text-[10px] text-muted-foreground pt-1">
                  Settles in {feePreview.profile.settlement_days}d · Chargeback ${Number(feePreview.profile.chargeback_fee)} · Refund ${Number(feePreview.profile.refund_fee)}
                </p>
              </div>
            )}
          </div>

          {/* Fraud Risk Indicator */}
          {fraudResult && (
            <div className={`rounded-xl border p-5 shadow-card ${
              fraudResult.level === 'low' ? 'border-success/30 bg-success/5' :
              fraudResult.level === 'medium' ? 'border-warning/30 bg-warning/5' :
              'border-destructive/30 bg-destructive/5'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {fraudResult.level === 'low' ? (
                  <ShieldCheck className="h-4 w-4 text-success" />
                ) : fraudResult.level === 'medium' ? (
                  <ShieldAlert className="h-4 w-4 text-warning" />
                ) : (
                  <ShieldX className="h-4 w-4 text-destructive" />
                )}
                <h3 className="font-heading text-sm font-semibold text-foreground">Fraud Score</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-lg font-bold">{fraudResult.total_score}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Velocity</span>
                  <span className="text-xs font-mono">{fraudResult.velocity_score}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Device</span>
                  <span className="text-xs font-mono">{fraudResult.device_score}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Geo/IP</span>
                  <span className="text-xs font-mono">{fraudResult.geo_score}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Action</span>
                  <Badge variant={fraudResult.action === 'allow' ? 'outline' : 'destructive'} className="text-xs capitalize">
                    {fraudResult.action}
                  </Badge>
                </div>
                {fraudResult.factors.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Risk Factors:</p>
                    <div className="flex flex-wrap gap-1">
                      {fraudResult.factors.map((f, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{f.replace(/_/g, ' ')}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3DS is handled natively by ShieldHub at processor level */}
    </AppLayout>
  );
}
