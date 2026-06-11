import { Currency, Provider } from './types';

interface ProviderConfig {
  name: string;
  displayName: string;
  supportedCurrencies: Currency[];
  regions: string[];
  methods: string[];
}

export const providerConfigs: Record<Provider, ProviderConfig> = {
  mondo: {
    name: 'mondo',
    displayName: 'Mondo',
    supportedCurrencies: ['EUR', 'GBP'],
    regions: ['EU', 'UK'],
    methods: ['SEPA', 'Faster Payments', 'SEPA Direct Debit', 'Card'],
  },
  stripe: {
    name: 'stripe',
    displayName: 'Stripe',
    supportedCurrencies: ['USD'],
    regions: ['US'],
    methods: ['Card', 'ACH'],
  },
  shieldhub: {
    name: 'shieldhub',
    displayName: 'ShieldHub',
    supportedCurrencies: ['USD', 'BRL', 'MXN', 'COP'],
    regions: ['US', 'GLOBAL'],
    methods: ['Card', 'ACH', 'PIX', 'Boleto'],
  },
  moneto: {
    name: 'moneto',
    displayName: 'Moneto',
    supportedCurrencies: ['CAD'],
    regions: ['CA'],
    methods: ['Wallet', 'Bank Transfer'],
  },
  paygate10: {
    name: 'paygate10',
    displayName: 'Paygate10',
    supportedCurrencies: ['USD', 'BRL', 'MXN', 'COP', 'PKR'],
    regions: ['IN', 'PK', 'AR', 'EG', 'MX', 'BR', 'CO'],
    methods: ['UPI', 'NB', 'LBT', 'Bank Deposit', 'SPEI', 'Cash', 'Bank Transfer', 'Wallet', 'UPIQRCode', 'JazzCash', 'EasyPaisa', 'PIX', 'Boleto', 'PSE'],
  },
  ofa: {
    name: 'ofa',
    displayName: 'OFA Pay',
    supportedCurrencies: ['USD', 'BRL', 'MXN'],
    regions: ['CN', 'VN', 'TH', 'ID', 'MY', 'PH', 'JP', 'KR', 'HK', 'AU'],
    methods: ['P2P', 'P2C', 'P2PN', 'P2PO', 'QP', 'CRYPTO', 'Bank Transfer'],
  },
  makapay: {
    name: 'makapay',
    displayName: 'MakaPay',
    supportedCurrencies: ['USD'],
    regions: ['BD'],
    methods: ['SSLCommerz', 'SurjoPay', 'bKash', 'Nagad'],
  },
  payok: {
    name: 'payok',
    displayName: 'PayOK',
    supportedCurrencies: ['USD'],
    regions: ['TR'],
    methods: ['Card', 'Bank Transfer'],
  },
  lipad: {
    name: 'lipad',
    displayName: 'Lipad.io',
    supportedCurrencies: ['USD'],
    regions: ['KE', 'TZ', 'UG', 'GH', 'ZA', 'RW', 'ET', 'NG', 'CI', 'SN', 'CM'],
    methods: ['M-Pesa', 'Mobile Money', 'Bank Transfer', 'Card', 'Airtel Money'],
  },
  matrix: {
    name: 'matrix',
    displayName: 'Matrix Pay',
    supportedCurrencies: ['EUR', 'USD'],
    regions: ['GLOBAL'],
    methods: ['Card', 'Checkout HPP', 'Crypto'],
  },
  dcbank: {
    name: 'dcbank',
    displayName: 'DC Bank',
    supportedCurrencies: ['CAD'],
    regions: ['CA'],
    methods: ['Interac e-Transfer', 'EFT', 'VISA Direct', 'Bill Payment'],
  },
  prometeo: {
    name: 'prometeo',
    displayName: 'Prometeo',
    supportedCurrencies: ['BRL', 'MXN', 'COP'],
    regions: ['MX', 'CO', 'BR', 'CL', 'PE', 'UY', 'EC', 'AR', 'PA'],
    methods: ['Bank Redirect', 'SPEI', 'PSE', 'Open Finance', 'Bank Transfer'],
  },
  plgin: {
    name: 'plgin',
    displayName: 'Plgin (Plugg & Co)',
    supportedCurrencies: ['USD', 'EUR'],
    regions: ['GLOBAL'],
    methods: ['Card', 'CreditCard'],
  },
  circoflows: {
    name: 'circoflows',
    displayName: 'Circoflows',
    supportedCurrencies: ['USD', 'EUR'],
    regions: ['GLOBAL'],
    methods: ['Card', 'Hosted Card Page', '3DS'],
  },
  valenspay: {
    name: 'valenspay',
    displayName: 'ValensPay PG6',
    supportedCurrencies: ['USD', 'EUR'],
    regions: ['GLOBAL'],
    methods: ['Card', 'Bank Transfer', 'APM'],
  },
};


// Country → provider mapping for intelligent routing
const countryProviderMap: Record<string, Provider> = {
  // ShieldHub: US/Global card processing
  US: 'shieldhub',
  // Mondo: EU/UK
  GB: 'mondo', DE: 'mondo', FR: 'mondo', ES: 'mondo', IT: 'mondo', NL: 'mondo',
  BE: 'mondo', AT: 'mondo', PT: 'mondo', IE: 'mondo', FI: 'mondo', SE: 'mondo',
  DK: 'mondo', NO: 'mondo', CH: 'mondo', PL: 'mondo', CZ: 'mondo', GR: 'mondo',
  HU: 'mondo', RO: 'mondo', BG: 'mondo', HR: 'mondo', SK: 'mondo', SI: 'mondo',
  LT: 'mondo', LV: 'mondo', EE: 'mondo', LU: 'mondo', MT: 'mondo', CY: 'mondo',
  IS: 'mondo',
  // Moneto: Canada
  CA: 'moneto',
  // Paygate10: India, Pakistan, Brazil, Argentina, Nigeria, Egypt, Mexico, South Africa, Kenya
  IN: 'paygate10', PK: 'paygate10', EG: 'paygate10',
  AR: 'paygate10', BR: 'paygate10', MX: 'paygate10', CO: 'paygate10',
  // Lipad: Africa
  NG: 'lipad', ZA: 'lipad', KE: 'lipad', TZ: 'lipad', UG: 'lipad', GH: 'lipad', RW: 'lipad', ET: 'lipad', CI: 'lipad', SN: 'lipad', CM: 'lipad',
  // OFA: Asia-Pacific
  CN: 'ofa', VN: 'ofa', TH: 'ofa', ID: 'ofa', MY: 'ofa', PH: 'ofa',
  JP: 'ofa', KR: 'ofa', HK: 'ofa', AU: 'ofa', TW: 'ofa',
  // Bangladesh: MakaPay
  BD: 'makapay',
  // Turkey: PayOK
  TR: 'payok',
};

// Currency → provider fallback
const currencyProviderMap: Record<string, Provider> = {
  USD: 'shieldhub',
  EUR: 'mondo',
  GBP: 'mondo',
  CAD: 'moneto',
  BRL: 'paygate10',
  MXN: 'paygate10',
  COP: 'paygate10',
  INR: 'paygate10',
  NGN: 'lipad',
  EGP: 'paygate10',
  ZAR: 'lipad',
  KES: 'lipad',
  ARS: 'paygate10',
  PKR: 'paygate10',
  TZS: 'lipad',
  UGX: 'lipad',
  GHS: 'lipad',
  CNY: 'ofa',
  VND: 'ofa',
  THB: 'ofa',
  IDR: 'ofa',
  MYR: 'ofa',
  PHP: 'ofa',
  JPY: 'ofa',
  KRW: 'ofa',
  TRY: 'payok',
  HKD: 'ofa',
  AUD: 'ofa',
};

export function resolveProvider(currency: Currency, region?: string): Provider {
  if (region && countryProviderMap[region]) {
    return countryProviderMap[region];
  }
  if (currencyProviderMap[currency]) {
    return currencyProviderMap[currency] as Provider;
  }
  if (['EUR', 'GBP'].includes(currency)) return 'mondo';
  return 'shieldhub';
}

export function getProviderColor(provider: Provider): string {
  switch (provider) {
    case 'mondo': return 'hsl(var(--chart-3))';
    case 'stripe': return 'hsl(var(--chart-1))';
    case 'shieldhub': return 'hsl(var(--chart-2))';
    case 'moneto': return 'hsl(var(--chart-5))';
    case 'paygate10': return 'hsl(25 95% 53%)';
    case 'ofa': return 'hsl(340 75% 55%)';
    case 'makapay': return 'hsl(160 70% 45%)';
    case 'payok': return 'hsl(200 80% 50%)';
    case 'lipad': return 'hsl(35 90% 50%)';
    case 'prometeo': return 'hsl(155 65% 42%)';
    case 'matrix': return 'hsl(270 70% 55%)';
    case 'dcbank': return 'hsl(210 85% 45%)';
    case 'plgin': return 'hsl(285 65% 50%)';
    case 'circoflows': return 'hsl(15 80% 55%)';
    case 'valenspay': return 'hsl(195 70% 45%)';
    default: return 'hsl(var(--chart-1))';
  }
}

export function getPaymentMethodsForCountry(countryCode: string): string[] {
  const provider = countryProviderMap[countryCode];
  if (!provider) return ['Card'];
  return providerConfigs[provider]?.methods || ['Card'];
}

export function getProviderForCountry(countryCode: string): Provider | null {
  return countryProviderMap[countryCode] || null;
}
