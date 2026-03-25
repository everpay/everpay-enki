import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutDeclined() {
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency') || 'USD';
  const transactionId = searchParams.get('transaction_id');

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-card text-center space-y-5">
        <div className="mx-auto h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="font-heading text-3xl text-foreground">Payment declined</h1>
        <p className="text-muted-foreground">
          We couldn't complete this payment{amount ? ` of ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount))}` : ''}. Please retry with another method.
        </p>
        {transactionId && (
          <p className="text-sm text-muted-foreground">Transaction: <span className="font-mono text-foreground">{transactionId}</span></p>
        )}
        <Button asChild className="rounded-full">
          <Link to="/checkout">
            <RefreshCw className="h-4 w-4" /> Try again
          </Link>
        </Button>
      </section>
    </main>
  );
}