import { useState } from 'react';
import { Transaction } from '@/lib/types';
import { useProviderEvents } from '@/hooks/useProviderEvents';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, getStatusVariant } from '@/lib/format';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Clock, Zap, CreditCard, Mail, FileText, Hash, RefreshCw, Shield, Wifi, Monitor, Smartphone, Globe, Building2, Wallet, RotateCcw } from 'lucide-react';
import { CardBrandBadge } from '@/components/CardBrandBadge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TransactionDetailDrawerProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getCardBrandFromBin(first6: string): string | null {
  if (!first6) return null;
  if (first6.startsWith('4')) return 'visa';
  if (first6.startsWith('5') || (first6.startsWith('2') && parseInt(first6.slice(0, 4)) >= 2221 && parseInt(first6.slice(0, 4)) <= 2720)) return 'mastercard';
  if (first6.startsWith('34') || first6.startsWith('37')) return 'amex';
  if (first6.startsWith('6')) return 'discover';
  return null;
}

type PaymentMethodType = 'card' | 'bank' | 'wallet' | 'unknown';

function detectPaymentMethodType(tx: Transaction, metadata: Record<string, any>): PaymentMethodType {
  const provider = tx.provider?.toLowerCase() || '';
  const paymentMethod = metadata?.payment_method_type || metadata?.payment_type || '';

  if (['apple_pay', 'google_pay', 'paypal', 'apple pay', 'google pay'].some(w => paymentMethod.toLowerCase().includes(w) || provider.includes(w))) return 'wallet';
  if (['ach', 'sepa', 'pix', 'boleto', 'open_banking', 'bank_transfer', 'wire'].some(w => paymentMethod.toLowerCase().includes(w) || provider.includes(w))) return 'bank';
  if (metadata?.card_first6 || metadata?.cardFirst6 || metadata?.card_brand || metadata?.card_last4 || metadata?.cardLast4) return 'card';
  return 'card'; // default to card for most providers
}

function usePaymentMethod(transactionId: string | null, customerId?: string) {
  return useQuery({
    queryKey: ['payment-method-detail', transactionId],
    enabled: !!transactionId,
    queryFn: async () => {
      // Try to find payment method linked to this transaction's customer
      if (!customerId) return null;
      const { data } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_default', { ascending: false })
        .limit(1);
      return data?.[0] || null;
    },
  });
}

function RefundModal({ transaction, open, onOpenChange }: { transaction: Transaction; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [amount, setAmount] = useState(String(transaction.amount));
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    const refundAmount = parseFloat(amount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (refundAmount > transaction.amount) {
      toast.error('Refund amount cannot exceed transaction amount');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('No merchant found');

      const { error } = await supabase.from('refunds').insert({
        transaction_id: transaction.id,
        merchant_id: merchant.id,
        amount: refundAmount,
        currency: transaction.currency,
        reason,
        provider: transaction.provider,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Refund initiated successfully');
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate refund');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Initiate Refund</DialogTitle>
          <DialogDescription>
            Transaction {transaction.id.slice(0, 8)}... — {formatCurrency(transaction.amount, transaction.currency)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Payment ID</Label>
            <Input value={transaction.id} readOnly className="font-mono text-xs bg-muted" />
          </div>
          <div>
            <Label>Refund Amount ({transaction.currency})</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={transaction.amount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Max: {formatCurrency(transaction.amount, transaction.currency)}
            </p>
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea
              placeholder="Customer requested refund, duplicate charge, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : `Refund ${amount ? formatCurrency(parseFloat(amount) || 0, transaction.currency) : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TransactionDetailDrawer({ transaction, open, onOpenChange }: TransactionDetailDrawerProps) {
  const [refundOpen, setRefundOpen] = useState(false);
  const { data: allEvents = [] } = useProviderEvents();

  // Extract customer_id from metadata for payment method lookup
  const txMetadata = (transaction as any)?.metadata || {};
  const customerId = txMetadata?.customer_id || txMetadata?.customerId || null;
  const { data: paymentMethod } = usePaymentMethod(transaction?.id || null, customerId);

  if (!transaction) return null;

  const relatedEvents = allEvents.filter((e) => e.transaction_id === transaction.id);

  // Extract VGS alias and card brand from enrichment events
  const tapixEvent = relatedEvents.find((e) => e.event_type === 'enrichment.completed');
  const vaultEvent = relatedEvents.find((e) => e.event_type === 'vault.completed');

  const vgsAlias = (vaultEvent?.payload as any)?.vgs_alias || (tapixEvent?.payload as any)?.vgs_alias || null;
  const eventCardBrand = (tapixEvent?.payload as any)?.card_brand || (vaultEvent?.payload as any)?.card_brand || null;
  const eventCardLast4 = (tapixEvent?.payload as any)?.card_last4 || (vaultEvent?.payload as any)?.card_last4 || null;

  // Merge from all sources: metadata > events > payment_methods table
  const cardFirst6 = txMetadata.cardFirst6 || txMetadata.card_first6 || '';
  const cardLast4 = txMetadata.cardLast4 || txMetadata.card_last4 || eventCardLast4 || paymentMethod?.card_last4 || '';
  const cardBrand = txMetadata.card_brand || eventCardBrand || paymentMethod?.card_brand || getCardBrandFromBin(cardFirst6);
  const expMonth = paymentMethod?.exp_month || txMetadata.exp_month || null;
  const expYear = paymentMethod?.exp_year || txMetadata.exp_year || null;
  const deviceInfo = txMetadata.device_info || null;

  // Detect payment method type
  const methodType = detectPaymentMethodType(transaction, txMetadata);

  // Tapix enrichment data
  const tapixData = (tapixEvent?.payload as any) || {};
  const enrichedMerchant = tapixData.merchant_name || tapixData.store || null;
  const enrichedCategory = tapixData.category || null;
  const enrichedLocation = tapixData.location || null;

  // Bank details from metadata
  const bankName = txMetadata.bank_name || txMetadata.institution_name || null;
  const bankAccountLast4 = txMetadata.account_last4 || txMetadata.bank_last4 || null;
  const bankType = txMetadata.bank_method || txMetadata.payment_rail || null;

  // Wallet details
  const walletType = txMetadata.wallet_type || txMetadata.payment_method_type || null;

  const PaymentMethodIcon = methodType === 'bank' ? Building2 : methodType === 'wallet' ? Wallet : CreditCard;
  const methodLabel = methodType === 'bank' ? 'Bank Payment' : methodType === 'wallet' ? 'Digital Wallet' : 'Card Payment';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] bg-card border-border overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-heading text-foreground flex items-center gap-2">
            <PaymentMethodIcon className="h-5 w-5 text-primary" />
            Transaction Details
          </SheetTitle>
          <SheetDescription>
            <span className="font-mono text-xs">{transaction.id}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Amount & Status */}
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-heading text-2xl font-bold text-foreground">
                {formatCurrency(transaction.amount, transaction.currency)}
              </span>
              <Badge variant={getStatusVariant(transaction.status)} className="text-xs">
                {transaction.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(transaction.created_at)}
            </div>
          </div>

          {/* Refund Button */}
          {(transaction.status === 'completed' || transaction.status === 'settled') && (
            <Button
              variant="outline"
              className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => setRefundOpen(true)}
            >
              <RotateCcw className="h-4 w-4" />
              Initiate Refund
            </Button>
          )}

          {/* Refund Modal */}
          {refundOpen && transaction && (
            <RefundModal transaction={transaction} open={refundOpen} onOpenChange={setRefundOpen} />
          )}

          {/* Payment Method Section */}
          <div className="space-y-3">
            <h4 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
              <PaymentMethodIcon className="h-4 w-4 text-primary" />
              {methodLabel}
            </h4>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              {/* Card display */}
              {methodType === 'card' && (cardBrand || cardLast4 || cardFirst6) && (
                <div className="flex justify-center">
                  <CardBrandBadge
                    brand={cardBrand}
                    last4={cardLast4}
                    first4={cardFirst6?.slice(0, 4)}
                    expMonth={expMonth}
                    expYear={expYear}
                  />
                </div>
              )}

              {/* Bank payment display */}
              {methodType === 'bank' && (
                <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                  <Building2 className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {bankName || 'Bank Transfer'}
                      {bankAccountLast4 && <span className="font-mono ml-1">••••{bankAccountLast4}</span>}
                    </p>
                    {bankType && <p className="text-xs text-muted-foreground uppercase">{bankType}</p>}
                  </div>
                </div>
              )}

              {/* Wallet display */}
              {methodType === 'wallet' && (
                <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                  {walletType?.toLowerCase().includes('apple') ? (
                    <img src="/logos/apple-pay.svg" alt="Apple Pay" className="h-6 w-auto" />
                  ) : walletType?.toLowerCase().includes('google') ? (
                    <img src="/logos/google-pay.svg" alt="Google Pay" className="h-6 w-auto" />
                  ) : walletType?.toLowerCase().includes('paypal') ? (
                    <img src="/logos/paypal.svg" alt="PayPal" className="h-6 w-auto" />
                  ) : (
                    <Wallet className="h-6 w-6 text-primary" />
                  )}
                  <p className="font-medium text-sm text-foreground capitalize">
                    {walletType?.replace(/_/g, ' ') || 'Digital Wallet'}
                  </p>
                </div>
              )}

              {/* Fallback card display when no specific data */}
              {methodType === 'card' && !cardBrand && !cardLast4 && !cardFirst6 && (
                <div className="flex items-center justify-center gap-3 text-muted-foreground py-2">
                  <CreditCard className="h-5 w-5" />
                  <span className="text-sm">Card details not available</span>
                </div>
              )}

              {/* VGS Alias */}
              {vgsAlias && (
                <DetailRow icon={Shield} label="VGS Alias" value={
                  <span className="font-mono text-[10px] text-primary break-all">{vgsAlias}</span>
                } />
              )}
            </div>
          </div>

          {/* Tapix Enrichment */}
          {(enrichedMerchant || enrichedCategory || enrichedLocation) && (
            <div className="space-y-3">
              <h4 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Enrichment Data
              </h4>
              <div className="rounded-lg border border-border bg-background p-4 space-y-2">
                {enrichedMerchant && <DetailRow icon={FileText} label="Merchant" value={enrichedMerchant} />}
                {enrichedCategory && <DetailRow icon={Hash} label="Category" value={enrichedCategory} />}
                {enrichedLocation && (
                  <DetailRow icon={Globe} label="Location" value={
                    [enrichedLocation.city, enrichedLocation.state, enrichedLocation.country].filter(Boolean).join(', ')
                  } />
                )}
              </div>
            </div>
          )}

          {/* Device Info Section */}
          {deviceInfo && (
            <div className="space-y-3">
              <h4 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                {deviceInfo.device_type === 'mobile' ? <Smartphone className="h-4 w-4 text-primary" /> : <Monitor className="h-4 w-4 text-primary" />}
                Device Information
              </h4>
              <div className="rounded-lg border border-border bg-background p-4 space-y-2">
                {deviceInfo.browser && <DetailRow icon={Globe} label="Browser" value={`${deviceInfo.browser} ${deviceInfo.browser_version || ''}`} />}
                {deviceInfo.os && <DetailRow icon={Monitor} label="OS" value={deviceInfo.os} />}
                {deviceInfo.ip_address && <DetailRow icon={Wifi} label="IP Address" value={<span className="font-mono text-xs">{deviceInfo.ip_address}</span>} />}
                {deviceInfo.screen_resolution && <DetailRow icon={Monitor} label="Screen" value={deviceInfo.screen_resolution} />}
                {deviceInfo.timezone && <DetailRow icon={Clock} label="Timezone" value={deviceInfo.timezone} />}
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="space-y-3">
            <h4 className="font-heading text-sm font-semibold text-foreground">Details</h4>
            <div className="grid gap-2">
              <DetailRow icon={Hash} label="Provider" value={
                <Badge variant="provider">{transaction.provider}</Badge>
              } />
              {transaction.customer_email && (
                <DetailRow icon={Mail} label="Customer" value={transaction.customer_email} />
              )}
              {transaction.description && (
                <DetailRow icon={FileText} label="Description" value={transaction.description} />
              )}
              {transaction.provider_ref && (
                <DetailRow icon={Wifi} label="Provider Ref" value={
                  <span className="font-mono text-xs">{transaction.provider_ref}</span>
                } />
              )}
              {transaction.idempotency_key && (
                <DetailRow icon={RefreshCw} label="Idempotency Key" value={
                  <span className="font-mono text-xs break-all">{transaction.idempotency_key}</span>
                } />
              )}
            </div>
          </div>

          {/* FX Details */}
          {transaction.fx_rate && (
            <div className="space-y-3">
              <h4 className="font-heading text-sm font-semibold text-foreground">FX Conversion</h4>
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{transaction.currency}</p>
                    <p className="font-heading font-bold text-foreground">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <span className="text-[10px] text-muted-foreground mt-1">Rate: {transaction.fx_rate}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{transaction.settlement_currency}</p>
                    <p className="font-heading font-bold text-foreground">
                      {formatCurrency(transaction.settlement_amount || 0, transaction.settlement_currency || 'USD')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ledger Entries */}
          <div className="space-y-3">
            <h4 className="font-heading text-sm font-semibold text-foreground">Ledger Entries</h4>
            <div className="rounded-lg border border-border bg-background divide-y divide-border">
              <LedgerRow type="debit" account={`${transaction.currency} Receivable`} amount={formatCurrency(transaction.amount, transaction.currency)} />
              <LedgerRow type="credit" account={`${transaction.currency} Revenue`} amount={formatCurrency(transaction.amount, transaction.currency)} />
              {transaction.fx_rate && transaction.settlement_amount && (
                <>
                  <LedgerRow type="debit" account={`${transaction.settlement_currency} Settlement`} amount={formatCurrency(transaction.settlement_amount, transaction.settlement_currency || 'USD')} />
                  <LedgerRow type="credit" account="FX Conversion" amount={formatCurrency(transaction.settlement_amount, transaction.settlement_currency || 'USD')} />
                </>
              )}
            </div>
          </div>

          {/* Event Timeline */}
          {relatedEvents.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-heading text-sm font-semibold text-foreground">Event Timeline</h4>
              <div className="space-y-2">
                {relatedEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 flex-shrink-0">
                      <Zap className="h-3 w-3 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{event.event_type}</span>
                        <Badge variant="provider" className="text-[10px]">{event.provider}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(event.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-2 text-xs text-muted-foreground border-t border-border pt-4">
            <div className="flex justify-between">
              <span>Created</span>
              <span>{formatDate(transaction.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>Last updated</span>
              <span>{formatDate(transaction.updated_at)}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

function LedgerRow({ type, account, amount }: { type: 'debit' | 'credit'; account: string; amount: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-mono uppercase font-bold ${type === 'debit' ? 'text-destructive' : 'text-success'}`}>
          {type === 'debit' ? 'DR' : 'CR'}
        </span>
        <span className="text-sm text-muted-foreground">{account}</span>
      </div>
      <span className="text-sm font-medium text-foreground">{amount}</span>
    </div>
  );
}
