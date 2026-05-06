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
import { METHOD_LOGOS, getMethodLogo } from '@/lib/payment-method-logos';

function getProviderBadgeStyle(provider: string): string {
  const p = (provider || '').toLowerCase();
  if (p.includes('facilita')) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
  if (p === 'mondo') return 'bg-indigo-100 text-indigo-700 border-indigo-300';
  if (p === 'shieldhub') return 'bg-blue-100 text-blue-700 border-blue-300';
  if (p === 'paygate10') return 'bg-amber-100 text-amber-700 border-amber-300';
  if (p === 'makapay') return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300';
  if (p === 'elektropay') return 'bg-teal-100 text-teal-700 border-teal-300';
  if (p === 'lipad') return 'bg-rose-100 text-rose-700 border-rose-300';
  return 'bg-muted text-muted-foreground border-border';
}

function ProviderRoutingBadge({ tx }: { tx: Transaction }) {
  const meta = (tx as any).metadata || {};
  const provider = tx.provider || 'unknown';
  const fellBack = meta.routing_fallback === true || meta.fallback_provider || meta.cascaded_from;
  const cls = getProviderBadgeStyle(provider);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`text-[10px] gap-1 ${cls}`}>
          <span className="capitalize">{provider}</span>
          {fellBack && <span className="rounded-sm bg-amber-200 px-1 text-amber-800">fallback</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-xs">
        <div>Routed via <b>{provider}</b></div>
        {meta.cascaded_from && <div>Cascaded from {meta.cascaded_from}</div>}
        {meta.fallback_provider && <div>Fallback: {meta.fallback_provider}</div>}
        {meta.routing_decision_id && <div className="font-mono text-[10px]">decision: {String(meta.routing_decision_id).slice(0, 8)}…</div>}
      </TooltipContent>
    </Tooltip>
  );
}

const BRAND_LOGOS = METHOD_LOGOS;

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

  // Check explicit method first via centralized registry
  if (method) {
    const logo = getMethodLogo(method);
    if (logo) {
      const label = method.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      return { logoSrc: logo, label };
    }
  }

  // Known method strings
  if (method === 'mobile_money' || method === 'mpesa') return { logoSrc: getMethodLogo('mpesa'), label: 'M-Pesa' };
  if (method === 'bank_transfer' || method === 'sepa' || method === 'pix' || method === 'spei') return { label: method.toUpperCase() };
  if (method === 'wallet') return { label: 'Wallet' };

  if (brand && BRAND_LOGOS[brand]) return { logoSrc: BRAND_LOGOS[brand], label: brand.charAt(0).toUpperCase() + brand.slice(1) };

  const cardFirst6 = meta.cardFirst6 || meta.card_first6 || '';
  if (cardFirst6) {
    const detected = getCardBrand(cardFirst6);
    if (detected !== 'unknown') return { logoSrc: BRAND_LOGOS[detected], label: detected.charAt(0).toUpperCase() + detected.slice(1) };
    return { label: 'Card' };
  }

  // Provider-based fallbacks with logos
  if (tx.provider === 'makapay') return { logoSrc: getMethodLogo('bkash'), label: 'Mobile Wallet' };
  if (tx.provider === 'lipad') return { logoSrc: getMethodLogo('mpesa'), label: 'Mobile Money' };
  if (tx.provider === 'paygate10') {
    // Check for known PK wallets
    const providerMethod = meta.provider_method || '';
    if (providerMethod.toLowerCase().includes('jazz')) return { logoSrc: getMethodLogo('jazzcash'), label: 'JazzCash' };
    if (providerMethod.toLowerCase().includes('easy')) return { logoSrc: getMethodLogo('easypaisa'), label: 'EasyPaisa' };
    return { label: 'Local Payment' };
  }
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
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Provider</th>
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

                    {/* Provider routing */}
                    <td className="px-3 py-2.5"><ProviderRoutingBadge tx={tx} /></td>

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
