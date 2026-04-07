import { useState, useMemo } from 'react';
import { Transaction } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/format';
import { getTransactionStatusInfo } from '@/lib/transaction-status';
import { TransactionDetailDrawer } from './TransactionDetailDrawer';
import { ChevronLeft, ChevronRight, Eye, Zap, CreditCard } from 'lucide-react';
import { useTapixCache, getEnrichmentSummary } from '@/hooks/useTapixEnrichment';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', CA: '🇨🇦', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', BR: '🇧🇷', MX: '🇲🇽',
  IN: '🇮🇳', PK: '🇵🇰', BD: '🇧🇩', NG: '🇳🇬', KE: '🇰🇪', ZA: '🇿🇦', EG: '🇪🇬',
  JP: '🇯🇵', CN: '🇨🇳', AU: '🇦🇺', HK: '🇭🇰', KR: '🇰🇷', TH: '🇹🇭', VN: '🇻🇳',
  ID: '🇮🇩', MY: '🇲🇾', PH: '🇵🇭', CO: '🇨🇴', AR: '🇦🇷', UA: '🇺🇦', PL: '🇵🇱',
  LB: '🇱🇧', NL: '🇳🇱', IT: '🇮🇹', ES: '🇪🇸', SE: '🇸🇪', CH: '🇨🇭', AT: '🇦🇹',
  BE: '🇧🇪', PT: '🇵🇹', IE: '🇮🇪', SG: '🇸🇬', NZ: '🇳🇿', AE: '🇦🇪', SA: '🇸🇦',
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

  if (brand && BRAND_LOGOS[brand]) return { logoSrc: BRAND_LOGOS[brand], label: brand.charAt(0).toUpperCase() + brand.slice(1) };

  const cardFirst6 = meta.cardFirst6 || meta.card_first6 || '';
  if (cardFirst6) {
    const detected = getCardBrand(cardFirst6);
    if (detected !== 'unknown') return { logoSrc: BRAND_LOGOS[detected], label: detected.charAt(0).toUpperCase() + detected.slice(1) };
    return { label: 'Card' };
  }

  if (tx.provider === 'lipad') return { label: 'Mobile Money' };
  if (tx.provider === 'paygate10') return { label: 'Local Payment' };
  return { label: 'Card' };
}

function getTransactionType(tx: Transaction): string {
  const meta = (tx as any).metadata || {};
  return meta.transaction_type || meta.type || (tx as any).type || 'payment';
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

  const visibleIds = useMemo(() => paged.map(tx => tx.id), [paged]);
  const { data: enrichmentCache = {} } = useTapixCache(visibleIds);

  return (
    <>
      <TooltipProvider>
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tx ID</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Method</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cards & APM IDs</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Customer IP</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Created</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map((tx) => {
                const meta = (tx as any).metadata || {};
                const cardFirst6 = meta.cardFirst6 || meta.card_first6 || '';
                const cardLast4 = meta.cardLast4 || meta.card_last4 || '';
                const pmInfo = getPaymentMethodInfo(tx);
                const txType = getTransactionType(tx);
                const cardCountry = meta.card_country || meta.cardCountry || '';
                const customerIp = meta.customer_ip || meta.ip_address || meta.customerIp || '';
                const ipCountry = meta.ip_country || meta.ipCountry || '';
                const statusInfo = getTransactionStatusInfo(tx.status, meta);
                const enrichment = getEnrichmentSummary(enrichmentCache[tx.id]);

                return (
                  <tr
                    key={tx.id}
                    className="transition-colors hover:bg-muted/30 cursor-pointer"
                    onClick={() => setSelectedTx(tx)}
                  >
                    {/* Tx ID */}
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-xs text-primary hover:underline">{tx.id.slice(0, 12)}…</span>
                    </td>

                    {/* Method - card brand icon */}
                    <td className="px-3 py-2.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center w-10 h-6">
                            {pmInfo.logoSrc ? (
                              <img src={pmInfo.logoSrc} alt={pmInfo.label} className="h-5 w-auto" />
                            ) : (
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{pmInfo.label}</TooltipContent>
                      </Tooltip>
                    </td>

                    {/* Amount */}
                    <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">
                      {formatCurrency(tx.amount, tx.currency)}
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-muted-foreground capitalize">{txType}</span>
                    </td>

                    {/* Cards & APM IDs - show card number with country flag */}
                    <td className="px-3 py-2.5">
                      {cardFirst6 ? (
                        <div className="space-y-0.5">
                          <span className="font-mono text-xs text-primary">
                            {cardFirst6} •••• {cardLast4}
                          </span>
                          {cardCountry && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs">{COUNTRY_FLAGS[cardCountry] || '🌍'}</span>
                              <span className="text-[10px] text-muted-foreground">{cardCountry}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Customer IP */}
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      {customerIp ? (
                        <div className="space-y-0.5">
                          <span className="font-mono text-xs text-foreground">{customerIp}</span>
                          {ipCountry && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs">{COUNTRY_FLAGS[ipCountry] || '🌍'}</span>
                              <span className="text-[10px] text-muted-foreground">{ipCountry}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Created */}
                    <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap hidden md:table-cell">
                      {formatDate(tx.created_at)}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </TooltipTrigger>
                        {statusInfo.reason && (
                          <TooltipContent side="bottom" className="max-w-[280px]">
                            <p className="text-xs">{statusInfo.reason}</p>
                            {statusInfo.responseCode && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">Code: {statusInfo.responseCode}</p>
                            )}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSelectedTx(tx); }}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TooltipProvider>

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
