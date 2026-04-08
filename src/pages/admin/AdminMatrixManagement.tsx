import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  useMatrixProjectDetails,
  useMatrixMIDDetails,
  useMatrixMIDBalance,
  useMatrixAggregatedBalance,
  useMatrixPlanCreate,
  useMatrixPlanDetails,
  useMatrixOneclickCreate,
  useMatrixOneclickPay,
  useMatrixTransactionStatus,
  useMatrixPayout,
} from '@/hooks/useMatrixAPI';
import { CreditCard, Wallet, BarChart3, Layers, Zap, RefreshCw, Search, Send } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n / 100);

export default function AdminMatrixManagement() {
  const { data: projectData, isLoading: projectLoading } = useMatrixProjectDetails();
  const { data: aggBalance, isLoading: aggLoading } = useMatrixAggregatedBalance();

  const [selectedMid, setSelectedMid] = useState('TZ-0000000001');
  const { data: midDetails } = useMatrixMIDDetails(selectedMid);
  const { data: midBalance } = useMatrixMIDBalance(selectedMid);

  const [txLookupId, setTxLookupId] = useState('');
  const txStatus = useMatrixTransactionStatus();

  const [payoutForm, setPayoutForm] = useState({
    reference: '', order_id: '', order_description: '', token: '', amount: '', currency: 'EUR',
  });
  const payoutMutation = useMatrixPayout();

  const [oneclickToken, setOneclickToken] = useState('');
  const oneclickCreate = useMatrixOneclickCreate();
  const oneclickPay = useMatrixOneclickPay();

  const planCreate = useMatrixPlanCreate();
  const planDetails = useMatrixPlanDetails();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matrix Partners</h1>
          <p className="text-muted-foreground">Full API management — MIDs, payouts, oneclick, subscriptions</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="mids">MID Details</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="oneclick">Oneclick</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="lookup">Tx Lookup</TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> Project Info</CardTitle>
                </CardHeader>
                <CardContent>
                  {projectLoading ? <Skeleton className="h-24" /> : (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Project ID</span><span className="font-mono">{projectData?.project?.id || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{projectData?.project?.name || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><Badge variant="outline">{projectData?.project?.mode || 'test'}</Badge></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge>{projectData?.project?.status || 'active'}</Badge></div>
                      {projectData?.simulation && <Badge variant="secondary" className="mt-2">Simulation Mode</Badge>}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Aggregated Balances</CardTitle>
                </CardHeader>
                <CardContent>
                  {aggLoading ? <Skeleton className="h-24" /> : (
                    <div className="space-y-3">
                      {aggBalance?.balances?.map((b: any) => (
                        <div key={b.mid} className="flex justify-between items-center border-b pb-2 last:border-0">
                          <div>
                            <span className="font-mono text-sm">{b.mid}</span>
                            <span className="text-xs text-muted-foreground ml-2">{b.currency}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{fmt(b.available)}</div>
                            <div className="text-xs text-muted-foreground">Pending: {fmt(b.pending)}</div>
                          </div>
                        </div>
                      ))}
                      {aggBalance?.total && (
                        <div className="pt-2 border-t">
                          <span className="text-sm font-medium">Totals: </span>
                          {Object.entries(aggBalance.total).map(([cur, val]) => (
                            <Badge key={cur} variant="outline" className="ml-1">{cur}: {fmt(val as number)}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* MID list from project */}
            <Card>
              <CardHeader><CardTitle>Merchant IDs (MIDs)</CardTitle><CardDescription>Click to view details</CardDescription></CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {(projectData?.project?.mids || []).map((m: any) => (
                    <Button
                      key={m.mid}
                      variant={selectedMid === m.mid ? 'default' : 'outline'}
                      className="h-auto py-3 flex flex-col items-start"
                      onClick={() => setSelectedMid(m.mid)}
                    >
                      <span className="font-mono text-xs">{m.mid}</span>
                      <span className="text-xs text-muted-foreground">{m.provider} • {m.currency}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── MID Details ── */}
          <TabsContent value="mids" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> MID: {selectedMid}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {midDetails?.mid && (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground">Provider</span><span>{midDetails.mid.provider}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Currency</span><Badge variant="outline">{midDetails.mid.currency}</Badge></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Descriptor</span><span className="font-mono text-xs">{midDetails.mid.descriptor}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge>{midDetails.mid.status}</Badge></div>
                      <div className="pt-2">
                        <span className="text-muted-foreground text-xs">Payment Methods: </span>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {midDetails.mid.payment_methods?.map((pm: string) => (
                            <Badge key={pm} variant="secondary" className="text-xs">{pm}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2">
                        <span className="text-muted-foreground text-xs">Features: </span>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {midDetails.mid.features && Object.entries(midDetails.mid.features).map(([k, v]) => (
                            <Badge key={k} variant={v ? 'default' : 'secondary'} className="text-xs">{k}</Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> Balance</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {midBalance?.balance && (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground">Available</span><span className="font-semibold text-primary">{fmt(midBalance.balance.available)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Pending</span><span>{fmt(midBalance.balance.pending)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Reserved</span><span>{fmt(midBalance.balance.reserved)}</span></div>
                      <div className="flex justify-between border-t pt-2"><span className="font-medium">Total</span><span className="font-bold">{fmt(midBalance.balance.total)}</span></div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Payouts ── */}
          <TabsContent value="payouts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Initiate Payout</CardTitle>
                <CardDescription>Send money to a customer's card via Matrix</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder="Reference" value={payoutForm.reference} onChange={e => setPayoutForm(p => ({ ...p, reference: e.target.value }))} />
                  <Input placeholder="Order ID" value={payoutForm.order_id} onChange={e => setPayoutForm(p => ({ ...p, order_id: e.target.value }))} />
                  <Input placeholder="Description" value={payoutForm.order_description} onChange={e => setPayoutForm(p => ({ ...p, order_description: e.target.value }))} />
                  <Input placeholder="Card Token" value={payoutForm.token} onChange={e => setPayoutForm(p => ({ ...p, token: e.target.value }))} />
                  <Input placeholder="Amount (minor units)" type="number" value={payoutForm.amount} onChange={e => setPayoutForm(p => ({ ...p, amount: e.target.value }))} />
                  <Input placeholder="Currency (e.g. EUR)" value={payoutForm.currency} onChange={e => setPayoutForm(p => ({ ...p, currency: e.target.value }))} />
                </div>
                <Button
                  className="mt-4"
                  disabled={payoutMutation.isPending}
                  onClick={() => {
                    payoutMutation.mutate({
                      ...payoutForm,
                      amount: parseInt(payoutForm.amount) || 0,
                    }, {
                      onSuccess: (data) => toast.success(`Payout ${data.status}: ${data.status_description || 'OK'}`),
                    });
                  }}
                >
                  {payoutMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Send Payout
                </Button>
                {payoutMutation.data && (
                  <pre className="mt-4 p-3 bg-muted rounded text-xs overflow-auto max-h-48">
                    {JSON.stringify(payoutMutation.data, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Oneclick ── */}
          <TabsContent value="oneclick" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Create Oneclick Token</CardTitle>
                  <CardDescription>Init a oneclick payment flow — returns checkout redirect URL and token</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    disabled={oneclickCreate.isPending}
                    onClick={() => {
                      oneclickCreate.mutate({
                        reference: `ref_${Date.now()}`,
                        order_id: `oc_${Date.now()}`,
                        order_description: 'Oneclick init test',
                        amount: 100,
                        currency: 'EUR',
                        success_url: window.location.origin + '/checkout/thank-you',
                        error_url: window.location.origin + '/checkout/declined',
                      }, {
                        onSuccess: (data) => {
                          if (data.oneclick_token) setOneclickToken(data.oneclick_token);
                          toast.success('Oneclick token created');
                        },
                      });
                    }}
                  >
                    {oneclickCreate.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                    Create Oneclick
                  </Button>
                  {oneclickCreate.data && (
                    <pre className="mt-4 p-3 bg-muted rounded text-xs overflow-auto max-h-48">
                      {JSON.stringify(oneclickCreate.data, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pay with Oneclick Token</CardTitle>
                  <CardDescription>Charge using an existing oneclick token</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Oneclick Token"
                    value={oneclickToken}
                    onChange={e => setOneclickToken(e.target.value)}
                    className="mb-3"
                  />
                  <Button
                    disabled={!oneclickToken || oneclickPay.isPending}
                    onClick={() => {
                      oneclickPay.mutate({
                        reference: `ref_${Date.now()}`,
                        order_id: `ocp_${Date.now()}`,
                        order_description: 'Oneclick pay test',
                        amount: 500,
                        currency: 'EUR',
                        oneclick_token: oneclickToken,
                      });
                    }}
                  >
                    Pay with Oneclick
                  </Button>
                  {oneclickPay.data && (
                    <pre className="mt-4 p-3 bg-muted rounded text-xs overflow-auto max-h-48">
                      {JSON.stringify(oneclickPay.data, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Subscriptions ── */}
          <TabsContent value="subscriptions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Create Billing Plan</CardTitle>
                  <CardDescription>Define a recurring billing plan on Matrix</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    disabled={planCreate.isPending}
                    onClick={() => {
                      planCreate.mutate({
                        name: 'Test Monthly Plan',
                        description: 'Monthly subscription plan',
                        billing_period: { kind: 'MONTHS', value: 1 },
                        retries: [{ kind: 'N_DAY', value: 3 }, { kind: 'N_DAY', value: 7 }],
                        prices: [
                          { currency: 'USD', value: 999 },
                          { currency: 'EUR', value: 899 },
                        ],
                        default_price_currency: 'USD',
                      });
                    }}
                  >
                    Create Sample Plan
                  </Button>
                  {planCreate.data && (
                    <pre className="mt-4 p-3 bg-muted rounded text-xs overflow-auto max-h-48">
                      {JSON.stringify(planCreate.data, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lookup Plan</CardTitle>
                  <CardDescription>Get details for a plan by ID</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input placeholder="Plan ID" id="plan-lookup-id" />
                    <Button
                      disabled={planDetails.isPending}
                      onClick={() => {
                        const id = (document.getElementById('plan-lookup-id') as HTMLInputElement)?.value;
                        if (id) planDetails.mutate({ id });
                      }}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  {planDetails.data && (
                    <pre className="mt-4 p-3 bg-muted rounded text-xs overflow-auto max-h-48">
                      {JSON.stringify(planDetails.data, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Transaction Lookup ── */}
          <TabsContent value="lookup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Transaction Status Lookup</CardTitle>
                <CardDescription>Query Matrix for transaction or order status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Order ID or Transaction ID"
                    value={txLookupId}
                    onChange={e => setTxLookupId(e.target.value)}
                  />
                  <Button
                    disabled={!txLookupId || txStatus.isPending}
                    onClick={() => txStatus.mutate({ order_id: txLookupId })}
                  >
                    {txStatus.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                {txStatus.data && (
                  <pre className="mt-4 p-3 bg-muted rounded text-xs overflow-auto max-h-64">
                    {JSON.stringify(txStatus.data, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
