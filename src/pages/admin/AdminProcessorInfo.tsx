import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Server, CreditCard, Banknote, Shield, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface FeeRow {
  id: string;
  currency: string;
  geo: string;
  trafficType: string;
  brands: string;
  depositFee: string;
  payoutFee: string;
  minDeposit: string;
  maxDeposit: string;
  chargebackFee: string;
  refundFee: string;
  rollingReserve: string;
  settlementCurrency: string;
  settlementPeriod: string;
  settlementFee: string;
  // Markup fields
  markupType: 'percentage' | 'fixed';
  markupValue: number;
}

const pacopayCardFees: FeeRow[] = [
  { id: 'eur-ftd-mc-visa', currency: 'EUR', geo: 'Worldwide', trafficType: 'FTD', brands: 'Mastercard, Visa', depositFee: '11.5% + €0.60', payoutFee: '—', minDeposit: '€10', maxDeposit: '€9,000', chargebackFee: '€50', refundFee: '€5', rollingReserve: '5%, 180 days', settlementCurrency: 'USDC', settlementPeriod: 'T+3', settlementFee: '1.5%', markupType: 'percentage', markupValue: 0 },
  { id: 'eur-ftd-mc', currency: 'EUR', geo: 'Worldwide', trafficType: 'FTD', brands: 'Mastercard', depositFee: '8.3% + €0.30', payoutFee: '—', minDeposit: '€1', maxDeposit: '€1,000', chargebackFee: '€65–80', refundFee: '€6', rollingReserve: '5%, 180 days', settlementCurrency: 'USDC', settlementPeriod: 'T+3', settlementFee: '1.5%', markupType: 'percentage', markupValue: 0 },
  { id: 'eur-trusted-mc', currency: 'EUR', geo: 'Worldwide', trafficType: 'Trusted', brands: 'Mastercard', depositFee: '6% + €0.30', payoutFee: '2%', minDeposit: '€1', maxDeposit: '€1,000', chargebackFee: '€50', refundFee: '€5', rollingReserve: '5%, 180 days', settlementCurrency: 'USDT', settlementPeriod: 'T+7', settlementFee: '1.5%', markupType: 'percentage', markupValue: 0 },
  { id: 'usd-trusted-kz', currency: 'USD', geo: 'Kazakhstan', trafficType: 'Trusted', brands: 'Mastercard, Visa', depositFee: '8% + $0.50', payoutFee: '—', minDeposit: '$10', maxDeposit: '$2,500', chargebackFee: '€75', refundFee: '€5', rollingReserve: '5%, 180 days', settlementCurrency: 'USDC', settlementPeriod: 'T+3', settlementFee: '1.5%', markupType: 'percentage', markupValue: 0 },
  { id: 'azn-trusted', currency: 'AZN (EUR)', geo: 'Azerbaijan', trafficType: 'Trusted', brands: 'Mastercard, Visa', depositFee: '15% + ₼0.70', payoutFee: '—', minDeposit: '₼18', maxDeposit: '₼16,980', chargebackFee: '$100', refundFee: '€6', rollingReserve: '5%, 180 days', settlementCurrency: 'USDC', settlementPeriod: 'T+3', settlementFee: '1.5%', markupType: 'percentage', markupValue: 0 },
];

const pacopayApmFees: FeeRow[] = [
  { id: 'apm-apple-ftd', currency: 'EUR', geo: 'Worldwide', trafficType: 'FTD', brands: 'Apple Pay, Google Pay', depositFee: '8.3% + €0.30', payoutFee: '—', minDeposit: '€1', maxDeposit: '€1,000', chargebackFee: '€65', refundFee: '€6', rollingReserve: '5%, 180 days', settlementCurrency: 'USDT', settlementPeriod: 'T+7', settlementFee: '1.5%', markupType: 'percentage', markupValue: 0 },
  { id: 'apm-apple-trust', currency: 'EUR', geo: 'Worldwide', trafficType: 'Trusted', brands: 'Apple Pay, Google Pay', depositFee: '8% + €0.30', payoutFee: '—', minDeposit: '€6', maxDeposit: '€1,000', chargebackFee: '€65', refundFee: '€6', rollingReserve: '5%, 180 days', settlementCurrency: 'USDT', settlementPeriod: 'T+7', settlementFee: '1.5%', markupType: 'percentage', markupValue: 0 },
  { id: 'apm-mbway-ftd', currency: 'EUR', geo: 'Portugal', trafficType: 'FTD', brands: 'MbWay', depositFee: '8.5% + €0.25', payoutFee: '—', minDeposit: '€1', maxDeposit: '€5,000', chargebackFee: '—', refundFee: '€1', rollingReserve: '—', settlementCurrency: 'EUR (fiat)', settlementPeriod: 'T+1', settlementFee: '—', markupType: 'percentage', markupValue: 0 },
  { id: 'apm-openbank', currency: 'EUR', geo: 'EU', trafficType: 'FTD', brands: 'Open Banking', depositFee: '5% / 4.5%', payoutFee: '—', minDeposit: '€5', maxDeposit: '€15,000', chargebackFee: '—', refundFee: '€50', rollingReserve: '—', settlementCurrency: 'USDT', settlementPeriod: 'T+2', settlementFee: '1%', markupType: 'percentage', markupValue: 0 },
];

const pacopayLatamFees: FeeRow[] = [
  { id: 'latam-uyu', currency: 'UYU', geo: 'Uruguay', trafficType: 'FTD', brands: 'Bank Transfer, RedPagos', depositFee: '4% + $2', payoutFee: '3.5% + $2', minDeposit: '$10', maxDeposit: '$5,000', chargebackFee: '$30', refundFee: '$2 + 2.5%', rollingReserve: '10%, 180 days', settlementCurrency: 'USDT', settlementPeriod: 'T+3', settlementFee: '1%', markupType: 'percentage', markupValue: 0 },
  { id: 'latam-clp', currency: 'CLP', geo: 'Chile', trafficType: 'FTD', brands: 'Bank Transfer, Cash', depositFee: '3.5% + $3', payoutFee: '3.5% + $2', minDeposit: '$10', maxDeposit: '$5,000', chargebackFee: '—', refundFee: '$3 + 2%', rollingReserve: '10%, 180 days', settlementCurrency: 'USDT', settlementPeriod: 'T+3', settlementFee: '1%', markupType: 'percentage', markupValue: 0 },
  { id: 'latam-ars', currency: 'ARS', geo: 'Argentina', trafficType: 'FTD', brands: 'Bank Transfer, APM Wallets', depositFee: '3.5% + $3', payoutFee: '3.5% + $2', minDeposit: '$10', maxDeposit: '$5,000', chargebackFee: '$30', refundFee: '$3 + 2%', rollingReserve: '10%, 180 days', settlementCurrency: 'USDT', settlementPeriod: 'T+3', settlementFee: '1%', markupType: 'percentage', markupValue: 0 },
  { id: 'latam-mxn', currency: 'MXN', geo: 'Mexico', trafficType: 'FTD', brands: 'SPEI', depositFee: '3.5% + $1.50', payoutFee: '3.5% + $2', minDeposit: '$10', maxDeposit: '$5,000', chargebackFee: '$30', refundFee: '$1.50 + 2%', rollingReserve: '10%, 180 days', settlementCurrency: 'USDT', settlementPeriod: 'T+3', settlementFee: '1%', markupType: 'percentage', markupValue: 0 },
];

const pacopayPayoutFees = [
  { id: 'po-kzt', currency: 'KZT', geo: 'Kazakhstan', brands: 'Mastercard, Visa', topUpFee: 'USDT, 3%, manual', payoutFee: '0%', minPayout: '₸30,000', maxPayout: '₸300,000', dailyLimit: 'n/a', monthlyLimit: 'n/a' },
  { id: 'po-eur-mc', currency: 'EUR', geo: 'Worldwide', brands: 'Mastercard', topUpFee: '1%', payoutFee: 'USDT 2%', minPayout: '€1', maxPayout: '€1,000', dailyLimit: '—', monthlyLimit: '€5,000' },
  { id: 'po-eur-revolut', currency: 'EUR', geo: 'Worldwide', brands: 'Mastercard, Visa (Revolut)', topUpFee: 'USDC, 2.5%', payoutFee: '2.1% + €0.40', minPayout: '€1', maxPayout: '€1,000', dailyLimit: '€30,000', monthlyLimit: '€420,000' },
];

function FeeTable({ fees, onMarkupChange }: { fees: FeeRow[]; onMarkupChange: (id: string, type: 'percentage' | 'fixed', value: number) => void }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Currency</TableHead>
            <TableHead>Geo</TableHead>
            <TableHead>Traffic</TableHead>
            <TableHead>Brands</TableHead>
            <TableHead>Base Deposit Fee</TableHead>
            <TableHead>Payout Fee</TableHead>
            <TableHead className="bg-primary/5 border-l border-primary/20">Markup Type</TableHead>
            <TableHead className="bg-primary/5">Markup Value</TableHead>
            <TableHead>Chargeback</TableHead>
            <TableHead>Refund</TableHead>
            <TableHead>RR / SD</TableHead>
            <TableHead>Settlement</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fees.map(fee => (
            <TableRow key={fee.id}>
              <TableCell><Badge variant="outline">{fee.currency}</Badge></TableCell>
              <TableCell className="text-sm">{fee.geo}</TableCell>
              <TableCell><Badge variant={fee.trafficType === 'FTD' ? 'default' : 'secondary'}>{fee.trafficType}</Badge></TableCell>
              <TableCell className="text-xs max-w-[120px]">{fee.brands}</TableCell>
              <TableCell className="font-mono text-xs">{fee.depositFee}</TableCell>
              <TableCell className="font-mono text-xs">{fee.payoutFee}</TableCell>
              <TableCell className="bg-primary/5 border-l border-primary/20">
                <Select
                  value={fee.markupType}
                  onValueChange={(v) => onMarkupChange(fee.id, v as 'percentage' | 'fixed', fee.markupValue)}
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="bg-primary/5">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fee.markupValue || ''}
                  onChange={(e) => onMarkupChange(fee.id, fee.markupType, parseFloat(e.target.value) || 0)}
                  placeholder={fee.markupType === 'percentage' ? '0.00%' : '0.00'}
                  className="w-20 h-8 text-xs font-mono"
                />
              </TableCell>
              <TableCell className="text-xs">{fee.chargebackFee}</TableCell>
              <TableCell className="text-xs">{fee.refundFee}</TableCell>
              <TableCell className="text-xs">{fee.rollingReserve}</TableCell>
              <TableCell className="text-xs">{fee.settlementCurrency} {fee.settlementPeriod} ({fee.settlementFee})</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminProcessorInfo() {
  const [cardFees, setCardFees] = useState(pacopayCardFees);
  const [apmFees, setApmFees] = useState(pacopayApmFees);
  const [latamFees, setLatamFees] = useState(pacopayLatamFees);

  const updateFee = (setter: React.Dispatch<React.SetStateAction<FeeRow[]>>) =>
    (id: string, type: 'percentage' | 'fixed', value: number) => {
      setter(prev => prev.map(f => f.id === id ? { ...f, markupType: type, markupValue: value } : f));
    };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Processor Information</h1>
        <p className="mt-1 text-sm text-muted-foreground">Processor details, API endpoints, fee schedules, and markup configuration</p>
      </div>

      {/* Processor Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5 text-primary" /> PacoPay</CardTitle>
            <CardDescription>Payment gateway — Card processing, APMs, Payouts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Live — Payouts (USD)</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Gateway API</span>
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">gateway.paco-pay.com</code>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Checkout API</span>
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">payment.paco-pay.com</code>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Auth Method</span>
              <span className="text-xs">Basic Auth (Shop ID + Secret)</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Documentation</span>
              <a href="https://docs.paco-pay.com" target="_blank" rel="noopener noreferrer" className="text-primary text-xs flex items-center gap-1 hover:underline">
                docs.paco-pay.com <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Settlement</span>
              <span className="text-xs">USDC/USDT via crypto — min $10,000</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Business Type</span>
              <Badge variant="outline">iGaming</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> API Endpoints</CardTitle>
            <CardDescription>PacoPay REST API routes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { method: 'POST', path: '/ctp/api/checkouts', desc: 'Create checkout token', status: 'disabled' },
                { method: 'POST', path: '/transactions/payments', desc: 'Process card / APM payment', status: 'disabled' },
                { method: 'POST', path: '/transactions/payouts', desc: 'Payout to card (USD)', status: 'live' },
                { method: 'GET', path: '/transactions/:uid', desc: 'Query transaction status', status: 'live' },
              ].map((ep, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Badge variant="outline" className="font-mono text-[10px] w-12 justify-center">{ep.method}</Badge>
                  <code className="text-xs font-mono flex-1">{ep.path}</code>
                  <span className="text-xs text-muted-foreground">{ep.desc}</span>
                  <Badge variant={ep.status === 'live' ? 'default' : 'secondary'} className="text-[10px]">
                    {ep.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Schedules */}
      <Tabs defaultValue="cards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cards" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Card Fees</TabsTrigger>
          <TabsTrigger value="apm" className="gap-1.5"><Globe className="h-3.5 w-3.5" /> APM Fees</TabsTrigger>
          <TabsTrigger value="latam" className="gap-1.5"><Banknote className="h-3.5 w-3.5" /> LATAM</TabsTrigger>
          <TabsTrigger value="payouts" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Payout Fees</TabsTrigger>
          <TabsTrigger value="crypto" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Crypto</TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          <Card>
            <CardHeader>
              <CardTitle>Card Processing Fees</CardTitle>
              <CardDescription>Visa & Mastercard deposit fees by region and traffic type. Add your markup in the highlighted columns.</CardDescription>
            </CardHeader>
            <CardContent>
              <FeeTable fees={cardFees} onMarkupChange={updateFee(setCardFees)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apm">
          <Card>
            <CardHeader>
              <CardTitle>Alternative Payment Method Fees</CardTitle>
              <CardDescription>Apple Pay, Google Pay, MbWay, Open Banking</CardDescription>
            </CardHeader>
            <CardContent>
              <FeeTable fees={apmFees} onMarkupChange={updateFee(setApmFees)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="latam">
          <Card>
            <CardHeader>
              <CardTitle>LATAM Local Payment Methods</CardTitle>
              <CardDescription>Bank transfers and local payment rails for Latin America</CardDescription>
            </CardHeader>
            <CardContent>
              <FeeTable fees={latamFees} onMarkupChange={updateFee(setLatamFees)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payout to Card Fees</CardTitle>
              <CardDescription>Direct card payout fee structure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Currency</TableHead>
                      <TableHead>Geo</TableHead>
                      <TableHead>Brands</TableHead>
                      <TableHead>Top-Up Fee</TableHead>
                      <TableHead>Payout Fee</TableHead>
                      <TableHead>Min Payout</TableHead>
                      <TableHead>Max Payout</TableHead>
                      <TableHead>Daily Limit</TableHead>
                      <TableHead>Monthly Limit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pacopayPayoutFees.map(pf => (
                      <TableRow key={pf.id}>
                        <TableCell><Badge variant="outline">{pf.currency}</Badge></TableCell>
                        <TableCell className="text-sm">{pf.geo}</TableCell>
                        <TableCell className="text-xs">{pf.brands}</TableCell>
                        <TableCell className="font-mono text-xs">{pf.topUpFee}</TableCell>
                        <TableCell className="font-mono text-xs">{pf.payoutFee}</TableCell>
                        <TableCell className="text-xs">{pf.minPayout}</TableCell>
                        <TableCell className="text-xs">{pf.maxPayout}</TableCell>
                        <TableCell className="text-xs">{pf.dailyLimit}</TableCell>
                        <TableCell className="text-xs">{pf.monthlyLimit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crypto">
          <Card>
            <CardHeader>
              <CardTitle>Crypto Processing Rates</CardTitle>
              <CardDescription>Volume-based crypto processing tiers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Volume Tier</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Minimum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell className="font-mono">$100,000 – $500,000</TableCell><TableCell className="font-mono">1.5%</TableCell><TableCell className="font-mono">2 USDT</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono">$500,000 – $1,000,000</TableCell><TableCell className="font-mono">1.2%</TableCell><TableCell className="font-mono">2 USDT</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono">&gt; $1,000,000</TableCell><TableCell className="font-mono">1.0%</TableCell><TableCell className="font-mono">2 USDT</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono">&gt; $2,000,000</TableCell><TableCell className="font-mono">Individual</TableCell><TableCell className="font-mono">—</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
