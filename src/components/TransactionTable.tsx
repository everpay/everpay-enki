import { useState } from 'react';
import { Transaction } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, getStatusVariant } from '@/lib/format';
import { TransactionDetailDrawer } from './TransactionDetailDrawer';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

function getUIAvatarUrl(email: string | undefined | null, size = 32): string {
  if (!email) return `https://ui-avatars.com/api/?name=?&size=${size}&background=6366f1&color=fff&font-size=0.4`;
  const name = email.split('@')[0].replace(/[._-]/g, '+');
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=6366f1&color=fff&font-size=0.4&rounded=true`;
}

const BRAND_LOGOS: Record<string, string> = {
  visa: '/logos/visa.svg',
  mastercard: '/logos/mastercard.svg',
  amex: '/logos/american-express.svg',
  'american express': '/logos/american-express.svg',
  discover: '/logos/discover.svg',
  jcb: '/logos/jcb.svg',
  unionpay: '/logos/unionpay.svg',
  apple_pay: '/logos/apple-pay.svg',
  google_pay: '/logos/google-pay.svg',
  paypal: '/logos/paypal.svg',
  klarna: '/logos/klarna.svg',
  ideal: '/logos/ideal.svg',
  bancontact: '/logos/bancontact.svg',
  alipay: '/logos/alipay.svg',
};

function getCardBrand(first6: string): string {
  if (!first6 || first6.includes('•')) return 'unknown';
  if (first6.startsWith('4')) return 'visa';
  if (first6.startsWith('5') || (first6.startsWith('2') && parseInt(first6.slice(0, 4)) >= 2221 && parseInt(first6.slice(0, 4)) <= 2720)) return 'mastercard';
  if (first6.startsWith('34') || first6.startsWith('37')) return 'amex';
  if (first6.startsWith('6')) return 'discover';
  return 'unknown';
}

function getPaymentMethodInfo(tx: Transaction): { logoSrc?: string; label: string } {
  const meta = (tx as any).metadata || {};
  const method = meta.payment_method || meta.paymentMethod || '';
  const brand = (meta.card_brand || meta.cardBrand || '').toLowerCase();

  if (method === 'apple_pay') return { logoSrc: BRAND_LOGOS.apple_pay, label: 'Apple Pay' };
  if (method === 'google_pay') return { logoSrc: BRAND_LOGOS.google_pay, label: 'Google Pay' };
  if (method === 'paypal') return { logoSrc: BRAND_LOGOS.paypal, label: 'PayPal' };
  if (method === 'klarna') return { logoSrc: BRAND_LOGOS.klarna, label: 'Klarna' };
  if (method === 'ideal') return { logoSrc: BRAND_LOGOS.ideal, label: 'iDEAL' };
  if (method === 'mobile_money' || method === 'mpesa') return { label: 'Mobile Money' };
  if (method === 'bank_transfer' || method === 'sepa' || method === 'pix' || method === 'spei') return { label: method.toUpperCase() };
  if (method === 'wallet') return { label: 'Wallet' };

  // Card brand from metadata
  if (brand && BRAND_LOGOS[brand]) return { logoSrc: BRAND_LOGOS[brand], label: brand.charAt(0).toUpperCase() + brand.slice(1) };

  // BIN detection
  const cardFirst6 = meta.cardFirst6 || meta.card_first6 || '';
  if (cardFirst6) {
    const detected = getCardBrand(cardFirst6);
    if (detected !== 'unknown') return { logoSrc: BRAND_LOGOS[detected], label: detected.charAt(0).toUpperCase() + detected.slice(1) };
    return { label: 'Card' };
  }

  // Infer from provider
  if (tx.provider === 'lipad') return { label: 'Mobile Money' };
  if (tx.provider === 'facilitapay') return { label: 'Local Payment' };
  return { label: 'Card' };
}

interface TransactionTableProps {
  transactions: Transaction[];
  compact?: boolean;
}

export function TransactionTable({ transactions, compact = false }: TransactionTableProps) {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = compact ? 10 : 20;
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paged = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Method</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Currency</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Provider</th>
              {!compact && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Card</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">FX</th>
                </>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.map((tx) => {
              const cardFirst6 = (tx as any).metadata?.cardFirst6 || (tx as any).metadata?.card_first6 || '';
              const cardLast4 = (tx as any).metadata?.cardLast4 || (tx as any).metadata?.card_last4 || '';
              const brand = getCardBrand(cardFirst6);
              const pmInfo = getPaymentMethodInfo(tx);
              const avatarUrl = getUIAvatarUrl(tx.customer_email);
              const initials = tx.customer_email ? tx.customer_email.slice(0, 2).toUpperCase() : '?';

              return (
                <tr
                  key={tx.id}
                  className="transition-colors hover:bg-muted/30 cursor-pointer"
                  onClick={() => setSelectedTx(tx)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground">{tx.id.slice(0, 8)}…</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={avatarUrl} alt={tx.customer_email || 'Customer'} />
                        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground truncate max-w-[140px]">
                        {tx.customer_email || <span className="text-muted-foreground">—</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {formatCurrency(tx.amount, tx.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {pmInfo.logoSrc ? (
                        <img src={pmInfo.logoSrc} alt={pmInfo.label} className="h-5 w-auto rounded-sm" />
                      ) : null}
                      <span className="text-xs text-muted-foreground capitalize">{pmInfo.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="font-mono text-[10px]">{tx.currency}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusVariant(tx.status)}>{tx.status}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant="provider">{tx.provider}</Badge>
                  </td>
                  {!compact && (
                    <>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {cardFirst6 ? (
                          <div className="flex items-center gap-1.5">
                            {brand !== 'unknown' && BRAND_LOGOS[brand] && (
                              <img src={BRAND_LOGOS[brand]} alt={brand} className="h-4 w-auto rounded-sm" />
                            )}
                            <span className="font-mono text-xs">{cardFirst6} •••• {cardLast4}</span>
                          </div>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate hidden lg:table-cell">
                        {tx.description || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {tx.fx_rate ? (
                          <span>
                            {tx.fx_rate} → {formatCurrency(tx.settlement_amount || 0, tx.settlement_currency || 'USD')}
                          </span>
                        ) : '—'}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                    {formatDate(tx.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedTx(tx); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, transactions.length)} of {transactions.length}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <TransactionDetailDrawer
        transaction={selectedTx}
        open={!!selectedTx}
        onOpenChange={(open) => !open && setSelectedTx(null)}
      />
    </>
  );
}
