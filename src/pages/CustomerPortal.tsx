import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Calendar, DollarSign, AlertCircle, ShoppingBag, FileText, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

function useCustomerData() {
  return useQuery({
    queryKey: ['customer-portal-data'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find customer record by email
      const { data: customer } = await supabase
        .from('customers')
        .select('id, email, first_name, last_name, billing_address')
        .eq('email', user.email!)
        .single();

      if (!customer) return { customer: null, transactions: [], invoices: [], subscription: null, paymentMethods: [] };

      // Fetch all data in parallel
      const [txRes, invRes, subRes, pmRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('customer_email', customer.email).order('created_at', { ascending: false }).limit(50),
        supabase.from('invoices').select('*').eq('customer_email', customer.email).order('created_at', { ascending: false }).limit(50),
        supabase.from('subscriptions').select('*, plan:subscription_plans(name, amount, currency, interval, description), payment_method:payment_methods(card_brand, card_last4, exp_month, exp_year)').eq('customer_id', customer.id).eq('status', 'active').maybeSingle(),
        supabase.from('payment_methods').select('*').eq('customer_id', customer.id),
      ]);

      return {
        customer,
        transactions: txRes.data ?? [],
        invoices: invRes.data ?? [],
        subscription: subRes.data,
        paymentMethods: pmRes.data ?? [],
      };
    },
  });
}

export default function CustomerPortal() {
  const [isCanceling, setIsCanceling] = useState(false);
  const { data, isLoading, refetch } = useCustomerData();

  const handleCancelSubscription = async () => {
    if (!data?.subscription) return;
    setIsCanceling(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled', canceled_at: new Date().toISOString() })
        .eq('id', data.subscription.id);
      if (error) throw error;
      toast.success('Subscription canceled successfully');
      refetch();
    } catch {
      toast.error('Failed to cancel subscription');
    } finally {
      setIsCanceling(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'active' || s === 'completed' || s === 'paid') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (s === 'canceled' || s === 'failed') return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (s === 'pending' || s === 'past_due' || s === 'draft') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-muted text-muted-foreground';
  };

  if (isLoading) {
    return <AppLayout><div className="flex items-center justify-center p-12"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  }

  if (!data?.customer) {
    return (
      <AppLayout>
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Customer Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">View your orders, invoices, and manage your account</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No Account Found</p>
            <p className="text-sm text-muted-foreground">Your email is not associated with any customer account yet.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const { transactions, invoices, subscription, paymentMethods } = data;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Customer Portal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {data.customer.first_name || data.customer.email}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
              <p className="text-xs text-muted-foreground">Invoices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Wallet className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{paymentMethods.length}</p>
              <p className="text-xs text-muted-foreground">Payment Methods</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders" className="gap-1.5"><ShoppingBag className="h-3.5 w-3.5" /> Orders</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Invoices</TabsTrigger>
          <TabsTrigger value="subscription" className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> Subscription</TabsTrigger>
          <TabsTrigger value="payment-methods" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Payment Methods</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader><CardTitle>Order History</CardTitle><CardDescription>Your past transactions and purchases</CardDescription></CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No orders yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx: any) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(tx.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-sm font-medium text-foreground">{tx.description || 'Payment'}</TableCell>
                        <TableCell className="text-sm font-semibold">{formatCurrency(tx.amount, tx.currency)}</TableCell>
                        <TableCell><Badge className={statusColor(tx.status)}>{tx.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader><CardTitle>Invoices</CardTitle><CardDescription>View and download your invoices</CardDescription></CardHeader>
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No invoices yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="text-sm font-medium text-foreground">{inv.invoice_number || inv.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(inv.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-sm font-semibold">{formatCurrency(inv.amount, inv.currency)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{inv.due_date ? format(new Date(inv.due_date), 'MMM d, yyyy') : '—'}</TableCell>
                        <TableCell><Badge className={statusColor(inv.status)}>{inv.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          {!subscription ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">No Active Subscription</p>
                <p className="text-sm text-muted-foreground">You don't have any active subscriptions.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Current Plan</CardTitle>
                  <Badge className={statusColor(subscription.status)}>{subscription.status}</Badge>
                </div>
                <CardDescription>Your active subscription details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">{subscription.plan?.name}</p>
                  {subscription.plan?.description && <p className="text-sm text-muted-foreground mt-1">{subscription.plan.description}</p>}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground"><DollarSign className="h-4 w-4" /><span className="text-sm">Amount</span></div>
                  <span className="text-lg font-semibold">{formatCurrency(subscription.plan?.amount, subscription.plan?.currency as any)} / {subscription.plan?.interval}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /><span className="text-sm">Next Billing</span></div>
                  <span className="font-medium">{format(new Date(subscription.current_period_end), 'MMM d, yyyy')}</span>
                </div>
                {subscription.trial_end && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /><span className="text-sm">Trial Ends</span></div>
                    <span className="font-medium">{format(new Date(subscription.trial_end), 'MMM d, yyyy')}</span>
                  </div>
                )}
                <Separator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" disabled={isCanceling}>Cancel Subscription</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This will cancel your subscription. You'll have access until {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelSubscription} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Cancel Subscription</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment-methods">
          <Card>
            <CardHeader><CardTitle>Payment Methods</CardTitle><CardDescription>Your saved cards and payment methods</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No saved payment methods</div>
              ) : (
                paymentMethods.map((pm: any) => (
                  <div key={pm.id} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{pm.card_brand || 'Card'} •••• {pm.card_last4}</p>
                      <p className="text-sm text-muted-foreground">Expires {pm.exp_month}/{pm.exp_year}</p>
                    </div>
                    {pm.is_default && <Badge variant="outline">Default</Badge>}
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full mt-2">Add Payment Method</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
