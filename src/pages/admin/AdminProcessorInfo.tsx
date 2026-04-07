import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Server, CreditCard, Banknote, Shield, ExternalLink, Building2, Landmark, Wallet, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// ─── Types ───────────────────────────────────────────────────
interface FeeRow {
  id: string;
  method: string;
  fee: string;
  extra?: string;
  markupType: 'percentage' | 'fixed';
  markupValue: number;
}

interface ProcessorConfig {
  id: string;
  name: string;
  displayName: string;
  status: 'live' | 'active' | 'payouts-only' | 'referral';
  statusLabel: string;
  description: string;
  regions: string[];
  currencies: string[];
  apiEndpoint?: string;
  docsUrl?: string;
  authMethod?: string;
  settlementTerms: string;
  rollingReserve: string;
  contractEntity?: string;
  icon: React.ReactNode;
  endpoints: { method: string; path: string; desc: string; status: 'live' | 'disabled' }[];
  fees: FeeRow[];
}

// ─── Processor Data ───────────────────────────────────────────
const processors: ProcessorConfig[] = [
  {
    id: 'shieldhub',
    name: 'shieldhub',
    displayName: 'ShieldHub (CBCG)',
    status: 'live',
    statusLabel: 'Live — Primary Card Processor',
    description: 'Global credit/debit card processing via CBCG/ShieldHub. Visa & Mastercard. 2D & 3DS flows.',
    regions: ['US', 'MX', 'Global'],
    currencies: ['USD'],
    apiEndpoint: 'pgw.shieldhubpay.com',
    contractEntity: 'Corporate Business Consulting Group (CBCG), Panama',
    authMethod: 'Client ID + API Secret',
    settlementTerms: 'T+7 (Weekly) — SWIFT at cost (1.5%) or Crypto (USDT/USDC). Min settlement $10,000',
    rollingReserve: '10% held for 180 days',
    icon: <Shield className="h-5 w-5 text-primary" />,
    endpoints: [
      { method: 'POST', path: '/api/v2/payments', desc: 'Process card payment', status: 'live' },
      { method: 'POST', path: '/api/v2/payments/3ds', desc: '3DS authentication', status: 'live' },
      { method: 'GET', path: '/api/v2/payments/:id', desc: 'Query payment status', status: 'live' },
    ],
    fees: [
      { id: 'sh-mdr', method: 'Card MDR (2DS & 3DS)', fee: '6.50%', markupType: 'percentage', markupValue: 0 },
      { id: 'sh-gw', method: 'Approved Gateway Fee', fee: '$0.30 / tx', markupType: 'fixed', markupValue: 0 },
      { id: 'sh-gwdec', method: 'Declined Gateway Fee', fee: '$0.00', markupType: 'fixed', markupValue: 0 },
      { id: 'sh-refund', method: 'Refund Fee', fee: '$12.00 / refund', markupType: 'fixed', markupValue: 0 },
      { id: 'sh-cb', method: 'Chargeback Fee', fee: '$60.00', markupType: 'fixed', markupValue: 0 },
      { id: 'sh-settle-swift', method: 'Settlement — SWIFT', fee: '1.5%', markupType: 'percentage', markupValue: 0 },
      { id: 'sh-settle-crypto', method: 'Settlement — Crypto', fee: 'At cost', markupType: 'percentage', markupValue: 0 },
      { id: 'sh-velocity', method: 'Card Velocity Limit', fee: '3 per card/day', markupType: 'fixed', markupValue: 0 },
      { id: 'sh-txlimit', method: 'Transaction Limits', fee: '$5.00 – $1,000.00', markupType: 'fixed', markupValue: 0 },
      { id: 'sh-cbpenalty', method: 'CB Penalty (>1% rate)', fee: '+1% on processing rate', markupType: 'percentage', markupValue: 0 },
    ],
  },
  {
    id: 'mondo',
    name: 'mondo',
    displayName: 'Mondo (GetMondo)',
    status: 'live',
    statusLabel: 'Live — EU/UK Card Processing',
    description: 'European card processing via Mondax Technology. Visa, Mastercard, SEPA, Open Banking, Virtual IBAN.',
    regions: ['EU', 'UK'],
    currencies: ['EUR', 'GBP'],
    apiEndpoint: 'server-to-server.getmondo.co',
    docsUrl: 'https://getmondo.co',
    contractEntity: 'Mondax Technology Sp Z OO, Poland (KRS0000965698)',
    authMethod: 'Account ID + Gateway Secret Key',
    settlementTerms: 'T+5 initial, then Weekly. Currency conversion at market + 1.0% settlement fee.',
    rollingReserve: '10% for 180 days (reducible to 5% after 6 months clean processing)',
    icon: <Globe className="h-5 w-5 text-blue-500" />,
    endpoints: [
      { method: 'POST', path: '/payment/create/', desc: 'Create payment session', status: 'live' },
      { method: 'POST', path: '/payment/status/', desc: 'Check payment status', status: 'live' },
      { method: 'POST', path: '/payment/refund/', desc: 'Process refund', status: 'live' },
    ],
    fees: [
      { id: 'mo-eu-tx-fixed', method: 'Card Transaction (EU) — Fixed', fee: '€0.40 / tx', markupType: 'fixed', markupValue: 0 },
      { id: 'mo-eu-tx-pct', method: 'Card Transaction (EU) — %', fee: 'Negotiated %', markupType: 'percentage', markupValue: 0 },
      { id: 'mo-noneu-tx-fixed', method: 'Card Transaction (Non-EU) — Fixed', fee: '€0.40 / tx', markupType: 'fixed', markupValue: 0 },
      { id: 'mo-noneu-tx-pct', method: 'Card Transaction (Non-EU) — %', fee: 'Negotiated %', markupType: 'percentage', markupValue: 0 },
      { id: 'mo-refund', method: 'Refund Fee', fee: '€1.00', markupType: 'fixed', markupValue: 0 },
      { id: 'mo-cb', method: 'Chargeback Fee', fee: '€50.00', markupType: 'fixed', markupValue: 0 },
      { id: 'mo-sepa-in', method: 'SEPA Pay-In', fee: 'Negotiated %', markupType: 'percentage', markupValue: 0 },
      { id: 'mo-sepa-out', method: 'SEPA Pay-Out', fee: 'Negotiated %', markupType: 'percentage', markupValue: 0 },
      { id: 'mo-ob', method: 'Open Banking', fee: 'Negotiated % + €0.00 fixed', markupType: 'percentage', markupValue: 0 },
      { id: 'mo-ob-refund', method: 'Open Banking Refund', fee: '€1.00', markupType: 'fixed', markupValue: 0 },
      { id: 'mo-iban-setup', method: 'Virtual IBAN — Setup', fee: '€200 one-time', markupType: 'fixed', markupValue: 0 },
      { id: 'mo-iban-monthly', method: 'Virtual IBAN — Monthly', fee: '€100 / month', markupType: 'fixed', markupValue: 0 },
      { id: 'mo-settle-fx', method: 'FX Settlement Fee', fee: '1.0%', markupType: 'percentage', markupValue: 0 },
    ],
  },
  {
    id: 'moneto',
    name: 'moneto',
    displayName: 'Moneto',
    status: 'referral',
    statusLabel: 'Active — Referral Partner (Canada)',
    description: 'Canadian payout services, digital wallet, and payment processing. Referral partnership with revenue split.',
    regions: ['CA'],
    currencies: ['CAD', 'USD'],
    docsUrl: 'https://moneto.ca',
    contractEntity: '14705203 Canada Inc o/a Moneto, Montreal QC',
    authMethod: 'Partner API',
    settlementTerms: 'Per Moneto Client Agreement. Revenue split 50/50 on added fees.',
    rollingReserve: 'Per client agreement',
    icon: <Wallet className="h-5 w-5 text-violet-500" />,
    endpoints: [
      { method: 'POST', path: '/api/wallet/create', desc: 'Create wallet', status: 'live' },
      { method: 'POST', path: '/api/wallet/transfer', desc: 'Transfer funds', status: 'live' },
    ],
    fees: [
      { id: 'mn-swift-in', method: 'SWIFT In', fee: '$30 + 0.4%', markupType: 'percentage', markupValue: 0 },
      { id: 'mn-swift-out', method: 'SWIFT Out', fee: '$30 + 0.4%', markupType: 'percentage', markupValue: 0 },
      { id: 'mn-ach-in', method: 'ACH In', fee: '$0.35 + 0.2%', markupType: 'percentage', markupValue: 0 },
      { id: 'mn-ach-out', method: 'ACH Out', fee: '$0.35 + 0.2%', markupType: 'percentage', markupValue: 0 },
      { id: 'mn-fed-in', method: 'Fedwire In', fee: '$20 + 0.2%', markupType: 'percentage', markupValue: 0 },
      { id: 'mn-fed-out', method: 'Fedwire Out', fee: '$20 + 0.2%', markupType: 'percentage', markupValue: 0 },
      { id: 'mn-sepa-in', method: 'SEPA In', fee: '€4.50 + 0.2%', markupType: 'percentage', markupValue: 0 },
      { id: 'mn-sepa-out', method: 'SEPA Out', fee: '€4.50 + 0.2%', markupType: 'percentage', markupValue: 0 },
      { id: 'mn-maint', method: 'Account Maintenance', fee: '$1,000 / month', markupType: 'fixed', markupValue: 0 },
      { id: 'mn-onboard', method: 'Onboarding Fee', fee: '$2,500 one-time', markupType: 'fixed', markupValue: 0 },
      { id: 'mn-fx', method: 'FX Conversions', fee: '1.00%', markupType: 'percentage', markupValue: 0 },
      { id: 'mn-stable', method: 'Stablecoin Exchange', fee: '1.00%', markupType: 'percentage', markupValue: 0 },
      { id: 'mn-mdr-3m', method: 'Card MDR ($0–3M)', fee: '5.85%', markupType: 'percentage', markupValue: 0 },
      { id: 'mn-mdr-5m', method: 'Card MDR ($3–5M)', fee: '5.65%', markupType: 'percentage', markupValue: 0 },
      { id: 'mn-mdr-5m+', method: 'Card MDR ($5M+)', fee: '5.50%', markupType: 'percentage', markupValue: 0 },
      { id: 'mn-tx-fee', method: 'Transaction Fee', fee: '$0.30 / tx', markupType: 'fixed', markupValue: 0 },
      { id: 'mn-cb', method: 'Chargeback Fee', fee: '$45.00', markupType: 'fixed', markupValue: 0 },
      { id: 'mn-refund', method: 'Refund Fee', fee: '$20.00', markupType: 'fixed', markupValue: 0 },
      { id: 'mn-3ds', method: '3DS per Transaction', fee: '$0.40', markupType: 'fixed', markupValue: 0 },
    ],
  },
  {
    id: 'makapay',
    name: 'makapay',
    displayName: 'MakaPay',
    status: 'live',
    statusLabel: 'Live — Bangladesh',
    description: 'Bangladesh payment processing. SSLCommerz, SurjoPay, bKash, Nagad. Everpay acts as Provider.',
    regions: ['BD'],
    currencies: ['USD'],
    apiEndpoint: 'makapp.xyz/api/v1',
    contractEntity: 'Makapp Bangladesh (Merchant) — Everpay Corporation (Provider)',
    authMethod: 'API Key + Secret',
    settlementTerms: 'T+2 (Weekly, 2 payments). SWIFT free. Crypto 1.25% at cost. Min settlement $5,000.',
    rollingReserve: 'None',
    icon: <Building2 className="h-5 w-5 text-teal-500" />,
    endpoints: [
      { method: 'POST', path: '/api/v1/initiate', desc: 'Initiate payment', status: 'live' },
      { method: 'POST', path: '/api/v1/verify', desc: 'Verify payment', status: 'live' },
    ],
    fees: [
      { id: 'mk-mdr', method: 'Card MDR (2DS & 3DS)', fee: '8.00%', markupType: 'percentage', markupValue: 0 },
      { id: 'mk-gw', method: 'Approved Gateway Fee', fee: '$0.30 / tx', markupType: 'fixed', markupValue: 0 },
      { id: 'mk-gwdec', method: 'Declined Gateway Fee', fee: '$0.00', markupType: 'fixed', markupValue: 0 },
      { id: 'mk-refund', method: 'Refund Fee', fee: '$12.00', markupType: 'fixed', markupValue: 0 },
      { id: 'mk-cb', method: 'Chargeback Fee', fee: '$60.00', markupType: 'fixed', markupValue: 0 },
      { id: 'mk-settle-swift', method: 'Settlement — SWIFT', fee: 'Free', markupType: 'fixed', markupValue: 0 },
      { id: 'mk-settle-crypto', method: 'Settlement — Crypto', fee: '1.25% at cost', markupType: 'percentage', markupValue: 0 },
      { id: 'mk-velocity', method: 'Card Velocity', fee: '3 per card/day', markupType: 'fixed', markupValue: 0 },
      { id: 'mk-txlimit', method: 'Transaction Limits', fee: '$5.00 – $1,000.00', markupType: 'fixed', markupValue: 0 },
      { id: 'mk-cbpenalty', method: 'CB Penalty (>1.5% rate)', fee: '+1% on processing rate', markupType: 'percentage', markupValue: 0 },
    ],
  },
  {
    id: 'pacopay',
    name: 'pacopay',
    displayName: 'PacoPay',
    status: 'payouts-only',
    statusLabel: 'Live — Payouts (USD)',
    description: 'Card processing, APMs, LATAM local payments, and Payout to Card. Currently enabled for USD payouts only.',
    regions: ['Worldwide', 'LATAM', 'EU', 'KZ', 'AZ'],
    currencies: ['EUR', 'USD', 'UYU', 'CLP', 'ARS', 'MXN', 'KZT', 'AZN'],
    apiEndpoint: 'gateway.paco-pay.com',
    docsUrl: 'https://docs.paco-pay.com',
    authMethod: 'Basic Auth (Shop ID + Secret)',
    settlementTerms: 'T+3 to T+7 — USDC/USDT via crypto. Min $10,000.',
    rollingReserve: '5% for 180 days (Card); 10% for 180 days (LATAM)',
    icon: <Server className="h-5 w-5 text-orange-500" />,
    endpoints: [
      { method: 'POST', path: '/ctp/api/checkouts', desc: 'Create checkout token', status: 'disabled' },
      { method: 'POST', path: '/transactions/payments', desc: 'Process card / APM payment', status: 'disabled' },
      { method: 'POST', path: '/transactions/payouts', desc: 'Payout to card (USD)', status: 'live' },
      { method: 'GET', path: '/transactions/:uid', desc: 'Query transaction status', status: 'live' },
    ],
    fees: [
      // Card
      { id: 'pp-eur-ftd-mcvisa', method: 'Card EUR FTD (MC+Visa)', fee: '11.5% + €0.60', markupType: 'percentage', markupValue: 0 },
      { id: 'pp-eur-ftd-mc', method: 'Card EUR FTD (MC only)', fee: '8.3% + €0.30', markupType: 'percentage', markupValue: 0 },
      { id: 'pp-eur-trust-mc', method: 'Card EUR Trusted (MC)', fee: '6% + €0.30', extra: 'Payout: 2%', markupType: 'percentage', markupValue: 0 },
      { id: 'pp-usd-kz', method: 'Card USD Kazakhstan', fee: '8% + $0.50', markupType: 'percentage', markupValue: 0 },
      { id: 'pp-azn', method: 'Card AZN Azerbaijan', fee: '15% + ₼0.70', markupType: 'percentage', markupValue: 0 },
      // APM
      { id: 'pp-apple-ftd', method: 'Apple/Google Pay FTD', fee: '8.3% + €0.30', markupType: 'percentage', markupValue: 0 },
      { id: 'pp-apple-trust', method: 'Apple/Google Pay Trusted', fee: '8% + €0.30', markupType: 'percentage', markupValue: 0 },
      { id: 'pp-mbway', method: 'MbWay (Portugal)', fee: '8.5% + €0.25', markupType: 'percentage', markupValue: 0 },
      { id: 'pp-openbank', method: 'Open Banking (EU)', fee: '5% / 4.5%', markupType: 'percentage', markupValue: 0 },
      // LATAM
      { id: 'pp-uyu', method: 'Uruguay (UYU)', fee: '4% + $2', extra: 'Payout: 3.5% + $2', markupType: 'percentage', markupValue: 0 },
      { id: 'pp-clp', method: 'Chile (CLP)', fee: '3.5% + $3', extra: 'Payout: 3.5% + $2', markupType: 'percentage', markupValue: 0 },
      { id: 'pp-ars', method: 'Argentina (ARS)', fee: '3.5% + $3', extra: 'Payout: 3.5% + $2', markupType: 'percentage', markupValue: 0 },
      { id: 'pp-mxn', method: 'Mexico SPEI (MXN)', fee: '3.5% + $1.50', extra: 'Payout: 3.5% + $2', markupType: 'percentage', markupValue: 0 },
      // Payouts
      { id: 'pp-po-eur-mc', method: 'Payout EUR (MC)', fee: '2% USDT', markupType: 'percentage', markupValue: 0 },
      { id: 'pp-po-eur-revolut', method: 'Payout EUR (Revolut MC/Visa)', fee: '2.1% + €0.40', markupType: 'percentage', markupValue: 0 },
      // General
      { id: 'pp-cb', method: 'Chargeback', fee: '€50–€100', markupType: 'fixed', markupValue: 0 },
      { id: 'pp-refund', method: 'Refund', fee: '€1–€6', markupType: 'fixed', markupValue: 0 },
      { id: 'pp-settle', method: 'Settlement Fee', fee: '1–1.5%', markupType: 'percentage', markupValue: 0 },
    ],
  },
  {
    id: 'paygate10',
    name: 'paygate10',
    displayName: 'Paygate10',
    status: 'live',
    statusLabel: 'Live — India, Pakistan, LATAM',
    description: 'Regional payment processing for India (UPI, NB), Pakistan (JazzCash, EasyPaisa), Argentina, Egypt, Mexico.',
    regions: ['IN', 'PK', 'AR', 'EG', 'MX'],
    currencies: ['USD', 'PKR', 'MXN'],
    authMethod: 'API Key + MID',
    settlementTerms: 'T+5 — Wire/Crypto',
    rollingReserve: 'Varies by region',
    icon: <Globe className="h-5 w-5 text-amber-500" />,
    endpoints: [
      { method: 'POST', path: '/api/payment/initiate', desc: 'Initiate payment', status: 'live' },
      { method: 'GET', path: '/api/payment/status', desc: 'Check status', status: 'live' },
    ],
    fees: [
      { id: 'pg-upi', method: 'UPI (India)', fee: 'Per agreement', markupType: 'percentage', markupValue: 0 },
      { id: 'pg-jc', method: 'JazzCash (Pakistan)', fee: 'Per agreement', markupType: 'percentage', markupValue: 0 },
      { id: 'pg-ep', method: 'EasyPaisa (Pakistan)', fee: 'Per agreement', markupType: 'percentage', markupValue: 0 },
      { id: 'pg-spei', method: 'SPEI (Mexico)', fee: 'Per agreement', markupType: 'percentage', markupValue: 0 },
    ],
  },
  {
    id: 'ofa',
    name: 'ofa',
    displayName: 'OFA Pay',
    status: 'live',
    statusLabel: 'Live — Asia-Pacific',
    description: 'Asia-Pacific payment rails. Alipay, VietQR, MOMO, QRIS, GCash, Maya, UPI. Crypto payouts (TRC/ERC).',
    regions: ['CN', 'VN', 'TH', 'ID', 'MY', 'PH', 'JP', 'KR', 'HK', 'AU'],
    currencies: ['USD', 'CNY', 'VND', 'IDR', 'PHP'],
    apiEndpoint: 'www.jzc899.com',
    authMethod: 'API Key + IP Whitelist',
    settlementTerms: 'Per agreement — 2-step Google Authenticator required',
    rollingReserve: 'Per agreement',
    icon: <Globe className="h-5 w-5 text-rose-500" />,
    endpoints: [
      { method: 'POST', path: '/api/pay', desc: 'Create payment', status: 'live' },
      { method: 'POST', path: '/api/payout', desc: 'Create payout', status: 'live' },
    ],
    fees: [
      { id: 'ofa-alipay', method: 'Alipay (CNY)', fee: 'Per agreement', markupType: 'percentage', markupValue: 0 },
      { id: 'ofa-vietqr', method: 'VietQR (VND)', fee: 'Per agreement', markupType: 'percentage', markupValue: 0 },
      { id: 'ofa-qris', method: 'QRIS (IDR)', fee: 'Per agreement', markupType: 'percentage', markupValue: 0 },
      { id: 'ofa-gcash', method: 'GCash (PHP)', fee: 'Per agreement', markupType: 'percentage', markupValue: 0 },
      { id: 'ofa-crypto', method: 'Crypto Payout (TRC/ERC)', fee: 'Per agreement', markupType: 'percentage', markupValue: 0 },
    ],
  },
  {
    id: 'lipad',
    name: 'lipad',
    displayName: 'Lipad.io',
    status: 'live',
    statusLabel: 'Live — Africa',
    description: 'African mobile money & bank transfer processing across 13 countries. M-Pesa, MTN, Airtel, Orange, Vodacom, Tigo, Halotel, TNM, Free Money.',
    regions: ['KE', 'UG', 'TZ', 'ZM', 'MW', 'SN', 'CI', 'CM', 'RW', 'DRC', 'BJ', 'GH', 'ZA', 'NG'],
    currencies: ['KES', 'UGX', 'TZS', 'ZMW', 'MWK', 'XOF', 'XAF', 'RWF', 'CDF', 'GHS', 'ZAR', 'NGN', 'USD'],
    apiEndpoint: 'api.lipad.io',
    docsUrl: 'https://developer.lipad.io',
    contractEntity: 'Lipad Africa (MMO Network — Everpay Reseller Agreement)',
    authMethod: 'API Key',
    settlementTerms: 'Per agreement',
    rollingReserve: 'Per agreement',
    icon: <Globe className="h-5 w-5 text-yellow-600" />,
    endpoints: [
      { method: 'POST', path: '/v1/checkout', desc: 'Create checkout', status: 'live' },
      { method: 'GET', path: '/v1/status/:id', desc: 'Check status', status: 'live' },
    ],
    fees: [
      // Kenya
      { id: 'li-ke-mpesa-paybill', method: '🇰🇪 Safaricom M-Pesa Paybill', fee: '2.75%', markupType: 'percentage', markupValue: 0 },
      { id: 'li-ke-mpesa-till', method: '🇰🇪 Safaricom M-Pesa Till', fee: '2.75%', markupType: 'percentage', markupValue: 0 },
      { id: 'li-ke-airtel', method: '🇰🇪 Airtel Money KE', fee: '2.75%', markupType: 'percentage', markupValue: 0 },
      // Zambia
      { id: 'li-zm-mtn', method: '🇿🇲 MTN Money ZM', fee: '3.00%', markupType: 'percentage', markupValue: 0 },
      { id: 'li-zm-airtel', method: '🇿🇲 Airtel Money ZM', fee: '3.00%', markupType: 'percentage', markupValue: 0 },
      // Uganda
      { id: 'li-ug-airtel', method: '🇺🇬 Airtel Money UG', fee: '3.00%', markupType: 'percentage', markupValue: 0 },
      { id: 'li-ug-mtn', method: '🇺🇬 MTN UG', fee: '3.00%', markupType: 'percentage', markupValue: 0 },
      // Tanzania
      { id: 'li-tz-airtel', method: '🇹🇿 Airtel TZ', fee: '3.00%', markupType: 'percentage', markupValue: 0 },
      { id: 'li-tz-tigo', method: '🇹🇿 Tigo TZ', fee: '3.00%', markupType: 'percentage', markupValue: 0 },
      { id: 'li-tz-vodacom', method: '🇹🇿 Vodacom M-Pesa TZ', fee: '3.00%', markupType: 'percentage', markupValue: 0 },
      { id: 'li-tz-halotel', method: '🇹🇿 Halotel TZ', fee: '3.00%', markupType: 'percentage', markupValue: 0 },
      // Malawi
      { id: 'li-mw-tnm', method: '🇲🇼 TNM Malawi', fee: '3.25%', markupType: 'percentage', markupValue: 0 },
      { id: 'li-mw-airtel', method: '🇲🇼 Airtel Malawi', fee: '3.25%', markupType: 'percentage', markupValue: 0 },
      // Senegal
      { id: 'li-sn-orange', method: '🇸🇳 Orange Money SN', fee: '3.25%', markupType: 'percentage', markupValue: 0 },
      { id: 'li-sn-free', method: '🇸🇳 Free Money SN', fee: '3.25%', markupType: 'percentage', markupValue: 0 },
      // Côte d'Ivoire
      { id: 'li-ci-mtn', method: '🇨🇮 MTN CI', fee: '3.25%', markupType: 'percentage', markupValue: 0 },
      // Cameroon
      { id: 'li-cm-mtn', method: '🇨🇲 MTN Cameroon', fee: '3.25%', markupType: 'percentage', markupValue: 0 },
      { id: 'li-cm-orange', method: '🇨🇲 Orange Money CM', fee: '3.25%', markupType: 'percentage', markupValue: 0 },
      // Rwanda
      { id: 'li-rw-mtn', method: '🇷🇼 MTN Rwanda', fee: '4.25%', markupType: 'percentage', markupValue: 0 },
      { id: 'li-rw-airtel', method: '🇷🇼 Airtel Rwanda', fee: '4.25%', markupType: 'percentage', markupValue: 0 },
      // DRC
      { id: 'li-cd-airtel', method: '🇨🇩 Airtel DRC', fee: '4.00%', markupType: 'percentage', markupValue: 0 },
      { id: 'li-cd-orange', method: '🇨🇩 Orange DRC', fee: '4.00%', markupType: 'percentage', markupValue: 0 },
      { id: 'li-cd-vodacom', method: '🇨🇩 Vodacom DRC', fee: '4.00%', markupType: 'percentage', markupValue: 0 },
      // Benin
      { id: 'li-bj-mtn', method: '🇧🇯 MTN Benin', fee: '3.75%', markupType: 'percentage', markupValue: 0 },
    ],
  },
  {
    id: 'payok',
    name: 'payok',
    displayName: 'PayOK',
    status: 'live',
    statusLabel: 'Live — Turkey',
    description: 'Turkish payment processing. Card and Bank Transfer.',
    regions: ['TR'],
    currencies: ['USD', 'TRY'],
    authMethod: 'API Key',
    settlementTerms: 'Per agreement',
    rollingReserve: 'Per agreement',
    icon: <Landmark className="h-5 w-5 text-cyan-500" />,
    endpoints: [
      { method: 'POST', path: '/api/payment', desc: 'Process payment', status: 'live' },
    ],
    fees: [
      { id: 'pk-card', method: 'Card (Turkey)', fee: 'Per agreement', markupType: 'percentage', markupValue: 0 },
      { id: 'pk-bank', method: 'Bank Transfer', fee: 'Per agreement', markupType: 'percentage', markupValue: 0 },
    ],
  },
  {
    id: 'plaid',
    name: 'plaid',
    displayName: 'Plaid',
    status: 'active',
    statusLabel: 'Active — Banking Data & Identity',
    description: 'Financial data connectivity via Plaid API. Account verification, identity, balance checks, transaction history.',
    regions: ['US', 'CA', 'UK', 'EU'],
    currencies: ['USD', 'CAD', 'GBP', 'EUR'],
    docsUrl: 'https://plaid.com/docs',
    contractEntity: 'Plaid Inc., San Francisco CA (MSA + Partnership Agreement)',
    authMethod: 'Client ID + Secret',
    settlementTerms: 'N/A — Data service',
    rollingReserve: 'N/A',
    icon: <Landmark className="h-5 w-5 text-indigo-500" />,
    endpoints: [
      { method: 'POST', path: '/link/token/create', desc: 'Create Link token', status: 'live' },
      { method: 'POST', path: '/auth/get', desc: 'Get account & routing', status: 'live' },
      { method: 'POST', path: '/identity/get', desc: 'Get account identity', status: 'live' },
      { method: 'POST', path: '/transactions/get', desc: 'Get transactions', status: 'live' },
    ],
    fees: [
      { id: 'pl-auth', method: 'Auth (per connection)', fee: 'Per Plaid Order', markupType: 'fixed', markupValue: 0 },
      { id: 'pl-identity', method: 'Identity (per check)', fee: 'Per Plaid Order', markupType: 'fixed', markupValue: 0 },
      { id: 'pl-transactions', method: 'Transactions (per item)', fee: 'Per Plaid Order', markupType: 'fixed', markupValue: 0 },
    ],
  },
  {
    id: 'prometeo',
    name: 'prometeo',
    displayName: 'Prometeo',
    status: 'active',
    statusLabel: 'Active — LATAM Open Banking',
    description: 'Open Banking API for Latin America. Bank redirects, payment initiation, account verification, and bank data across 40+ banks in 9 LATAM countries.',
    regions: ['MX', 'CO', 'BR', 'CL', 'PE', 'UY', 'EC', 'AR', 'PA'],
    currencies: ['MXN', 'COP', 'BRL', 'CLP', 'PEN', 'UYU', 'USD', 'ARS'],
    apiEndpoint: 'https://payment.prometeoapi.net/api/v1',
    docsUrl: 'https://docs.prometeoapi.com',
    contractEntity: 'Prometeo S.A., Montevideo, Uruguay',
    authMethod: 'API Key + Widget ID',
    settlementTerms: 'T+1 to T+3 depending on country',
    rollingReserve: 'Per agreement',
    icon: <Globe className="h-5 w-5 text-emerald-500" />,
    endpoints: [
      { method: 'POST', path: '/api/v1/payment-intent/', desc: 'Create payment intent', status: 'live' },
      { method: 'GET', path: '/api/v1/payment-intent/:id/', desc: 'Get payment intent status', status: 'live' },
      { method: 'POST', path: '/login/', desc: 'Login to bank provider', status: 'live' },
      { method: 'GET', path: '/provider/', desc: 'List available bank providers', status: 'live' },
      { method: 'GET', path: '/account/', desc: 'List bank accounts', status: 'live' },
      { method: 'POST', path: '/transfer/preprocess/', desc: 'Pre-process transfer', status: 'live' },
      { method: 'POST', path: '/transfer/confirm/', desc: 'Confirm transfer', status: 'live' },
    ],
    fees: [
      { id: 'pm-mx-redirect', method: '🇲🇽 Mexico — Bank Redirect', fee: '1.5% + $3 MXN', markupType: 'percentage', markupValue: 0 },
      { id: 'pm-co-redirect', method: '🇨🇴 Colombia — PSE Redirect', fee: '1.8% + $800 COP', markupType: 'percentage', markupValue: 0 },
      { id: 'pm-br-redirect', method: '🇧🇷 Brazil — Open Finance', fee: '1.2%', markupType: 'percentage', markupValue: 0 },
      { id: 'pm-cl-redirect', method: '🇨🇱 Chile — Bank Redirect', fee: '1.5%', markupType: 'percentage', markupValue: 0 },
      { id: 'pm-pe-redirect', method: '🇵🇪 Peru — Bank Redirect', fee: '1.8%', markupType: 'percentage', markupValue: 0 },
      { id: 'pm-uy-redirect', method: '🇺🇾 Uruguay — Bank Redirect', fee: '1.5%', markupType: 'percentage', markupValue: 0 },
      { id: 'pm-ar-redirect', method: '🇦🇷 Argentina — Bank Transfer', fee: '2.0%', markupType: 'percentage', markupValue: 0 },
      { id: 'pm-ec-redirect', method: '🇪🇨 Ecuador — Bank Redirect', fee: '1.8%', markupType: 'percentage', markupValue: 0 },
      { id: 'pm-pa-redirect', method: '🇵🇦 Panama — Bank Redirect', fee: '1.5%', markupType: 'percentage', markupValue: 0 },
      { id: 'pm-data', method: 'Banking Data (per query)', fee: 'Per agreement', markupType: 'fixed', markupValue: 0 },
    ],
  },
];

// ─── Fee Table Component ──────────────────────────────────────
function ProcessorFeeTable({ fees, onMarkupChange }: { fees: FeeRow[]; onMarkupChange: (id: string, type: 'percentage' | 'fixed', value: number) => void }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Method / Fee Type</TableHead>
            <TableHead>Base Rate</TableHead>
            <TableHead>Extra</TableHead>
            <TableHead className="bg-primary/5 border-l border-primary/20">Markup Type</TableHead>
            <TableHead className="bg-primary/5">Markup Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fees.map(fee => (
            <TableRow key={fee.id}>
              <TableCell className="font-medium text-sm">{fee.method}</TableCell>
              <TableCell className="font-mono text-xs">{fee.fee}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{fee.extra || '—'}</TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Processor Card Component ─────────────────────────────────
function ProcessorCard({ processor, feeState, onMarkupChange }: {
  processor: ProcessorConfig;
  feeState: FeeRow[];
  onMarkupChange: (id: string, type: 'percentage' | 'fixed', value: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const statusColor = {
    live: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    active: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'payouts-only': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    referral: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="mb-4">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {processor.icon}
                <div>
                  <CardTitle className="text-lg">{processor.displayName}</CardTitle>
                  <CardDescription className="mt-0.5">{processor.description}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusColor[processor.status]}>{processor.statusLabel}</Badge>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                {processor.apiEndpoint && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">API Endpoint</span>
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{processor.apiEndpoint}</code>
                  </div>
                )}
                {processor.docsUrl && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Documentation</span>
                    <a href={processor.docsUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs flex items-center gap-1 hover:underline">
                      {processor.docsUrl.replace('https://', '')} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {processor.authMethod && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Auth Method</span>
                    <span className="text-xs">{processor.authMethod}</span>
                  </div>
                )}
                {processor.contractEntity && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Contract Entity</span>
                    <span className="text-xs text-right max-w-[250px]">{processor.contractEntity}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Regions</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {processor.regions.map(r => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Currencies</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {processor.currencies.map(c => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
                  </div>
                </div>
                <div className="flex items-start justify-between text-sm">
                  <span className="text-muted-foreground">Settlement</span>
                  <span className="text-xs text-right max-w-[280px]">{processor.settlementTerms}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rolling Reserve</span>
                  <span className="text-xs">{processor.rollingReserve}</span>
                </div>
              </div>
            </div>

            {/* API Endpoints */}
            {processor.endpoints.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">API Endpoints</h4>
                <div className="space-y-1.5">
                  {processor.endpoints.map((ep, i) => (
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
              </div>
            )}

            {/* Fee Schedule */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Fee Schedule & Markup</h4>
              <ProcessorFeeTable fees={feeState} onMarkupChange={onMarkupChange} />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function AdminProcessorInfo() {
  const [feeStates, setFeeStates] = useState<Record<string, FeeRow[]>>(
    Object.fromEntries(processors.map(p => [p.id, [...p.fees]]))
  );

  const updateFee = (processorId: string) =>
    (id: string, type: 'percentage' | 'fixed', value: number) => {
      setFeeStates(prev => ({
        ...prev,
        [processorId]: prev[processorId].map(f =>
          f.id === id ? { ...f, markupType: type, markupValue: value } : f
        ),
      }));
    };

  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = filterStatus === 'all'
    ? processors
    : processors.filter(p => p.status === filterStatus);

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Processor Information</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All payment processors — API endpoints, fees, terms, and markup configuration.
            {' '}<span className="font-mono text-xs text-muted-foreground/60">Edge Functions: https://dhobjuetzkvnkdoqeavy.supabase.co/functions/v1/</span>
          </p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Processors</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="payouts-only">Payouts Only</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card className="p-3">
          <div className="text-2xl font-bold text-foreground">{processors.length}</div>
          <div className="text-xs text-muted-foreground">Total Processors</div>
        </Card>
        <Card className="p-3">
          <div className="text-2xl font-bold text-emerald-600">{processors.filter(p => p.status === 'live').length}</div>
          <div className="text-xs text-muted-foreground">Live</div>
        </Card>
        <Card className="p-3">
          <div className="text-2xl font-bold text-foreground">{new Set(processors.flatMap(p => p.regions)).size}</div>
          <div className="text-xs text-muted-foreground">Regions Covered</div>
        </Card>
        <Card className="p-3">
          <div className="text-2xl font-bold text-foreground">{new Set(processors.flatMap(p => p.currencies)).size}</div>
          <div className="text-xs text-muted-foreground">Currencies</div>
        </Card>
        <Card className="p-3">
          <div className="text-2xl font-bold text-foreground">{processors.reduce((a, p) => a + p.endpoints.length, 0)}</div>
          <div className="text-xs text-muted-foreground">API Endpoints</div>
        </Card>
      </div>

      {/* Processor List */}
      <div className="space-y-0">
        {filtered.map(processor => (
          <ProcessorCard
            key={processor.id}
            processor={processor}
            feeState={feeStates[processor.id]}
            onMarkupChange={updateFee(processor.id)}
          />
        ))}
      </div>
    </AppLayout>
  );
}
