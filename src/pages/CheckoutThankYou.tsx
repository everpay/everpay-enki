import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutThankYou() {
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency') || 'USD';
  const transactionId = searchParams.get('transaction_id');
  const reference = searchParams.get('ref');

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-card text-center space-y-5">
        <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <h1 className="font-heading text-3xl text-foreground">Thank you for your payment</h1>
        <p className="text-muted-foreground">
          Your transaction was successful{amount ? ` for ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount))}` : ''}.
        </p>
        {(transactionId || reference) && (
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground space-y-1">
            {transactionId && <p>Transaction: <span className="font-mono text-foreground">{transactionId}</span></p>}
            {reference && <p>Reference: <span className="font-mono text-foreground">{reference}</span></p>}
          </div>
        )}
        <Button asChild className="rounded-full">
          <Link to="/">
            Continue <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    </main>
  );
}