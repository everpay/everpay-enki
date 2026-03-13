import { useState, useMemo } from 'react';
import { Transaction } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, getStatusVariant } from '@/lib/format';
import { TransactionDetailDrawer } from './TransactionDetailDrawer';
import { enrichWithTapix } from '@/lib/tapix';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  compact?: boolean;
}

function getCardBrand(first6: string): string {
  if (!first6 || first6.includes('•')) return 'Unknown';
  if (first6.startsWith('4')) return 'Visa';
  if (first6.startsWith('5') || (first6.startsWith('2') && parseInt(first6.slice(0, 4)) >= 2221 && parseInt(first6.slice(0, 4)) <= 2720)) return 'Mastercard';
  if (first6.startsWith('34') || first6.startsWith('37')) return 'Amex';
  if (first6.startsWith('6')) return 'Discover';
  return 'Unknown';
}

function CardBrandBadge({ brand }: { brand: string }) {
  const colors: Record<string, string> = {
    Visa: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    Mastercard: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    Amex: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    Discover: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  };
  return <Badge variant="outline" className={`text-[10px] ${colors[brand] || ''}`}>{brand}</Badge>;
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
              // Card BIN detection from description or provider_ref
              const cardFirst6 = (tx as any).metadata?.cardFirst6 || (tx as any).metadata?.card_first6 || '';
              const cardLast4 = (tx as any).metadata?.cardLast4 || (tx as any).metadata?.card_last4 || '';
              const brand = getCardBrand(cardFirst6);

              return (
                <tr
                  key={tx.id}
                  className="transition-colors hover:bg-muted/30 cursor-pointer"
                  onClick={() => setSelectedTx(tx)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground">{tx.id.slice(0, 8)}…</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {tx.customer_email || <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {formatCurrency(tx.amount, tx.currency)}
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
                          <div className="flex flex-col">
                            <span className="font-mono text-xs">{cardFirst6} •••• {cardLast4}</span>
                            <CardBrandBadge brand={brand} />
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
