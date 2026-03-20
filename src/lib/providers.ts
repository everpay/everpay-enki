import { Currency, Provider } from './types';

interface ProviderConfig {
  name: string;
  displayName: string;
  supportedCurrencies: Currency[];
  regions: string[];
  methods: string[];
}

export const providerConfigs: Record<Provider, ProviderConfig> = {
  facilitapay: {
    name: 'facilitapay',
    displayName: 'FacilitaPay',
    supportedCurrencies: ['BRL', 'MXN', 'COP'],
    regions: ['BR', 'MX', 'CO'],
    methods: ['PIX', 'Boleto', 'SPEI', 'PSE'],
  },
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
    regions: ['IN', 'PK', 'BR', 'AR', 'NG', 'EG', 'MX', 'ZA', 'KE'],
    methods: ['UPI', 'NB', 'PIX', 'LBT', 'Bank Deposit', 'SPEI', 'Cash', 'Bank Transfer', 'Wallet', 'UPIQRCode', 'JazzCash', 'EasyPaisa'],
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
  IN: 'paygate10', PK: 'paygate10', NG: 'paygate10', EG: 'paygate10', ZA: 'paygate10', KE: 'paygate10',
  AR: 'paygate10',
  // OFA: Asia-Pacific
  CN: 'ofa', VN: 'ofa', TH: 'ofa', ID: 'ofa', MY: 'ofa', PH: 'ofa',
  JP: 'ofa', KR: 'ofa', HK: 'ofa', AU: 'ofa', TW: 'ofa',
  // Bangladesh: MakaPay
  BD: 'makapay',
  // Turkey: PayOK
  TR: 'payok',
  // LATAM shared: PG10 primary, FacilitaPay fallback
  BR: 'paygate10', MX: 'paygate10', CO: 'facilitapay',
};

// Currency → provider fallback
const currencyProviderMap: Record<string, Provider> = {
  USD: 'shieldhub',
  EUR: 'mondo',
  GBP: 'mondo',
  CAD: 'moneto',
  BRL: 'paygate10',
  MXN: 'paygate10',
  COP: 'facilitapay',
  INR: 'paygate10',
  NGN: 'paygate10',
  EGP: 'paygate10',
  ZAR: 'paygate10',
  KES: 'paygate10',
  ARS: 'paygate10',
  PKR: 'paygate10',
  CNY: 'ofa',
  VND: 'ofa',
  THB: 'ofa',
  IDR: 'ofa',
  MYR: 'ofa',
  PHP: 'ofa',
  JPY: 'ofa',
  KRW: 'ofa',
  BDT: 'makapay',
  TRY: 'payok',
  HKD: 'ofa',
  AUD: 'ofa',
};

export function resolveProvider(currency: Currency, region?: string): Provider {
  // Country takes priority
  if (region && countryProviderMap[region]) {
    return countryProviderMap[region];
  }
  // Then currency
  if (currencyProviderMap[currency]) {
    return currencyProviderMap[currency] as Provider;
  }
  // EU/UK currencies
  if (['EUR', 'GBP'].includes(currency)) return 'mondo';
  // Default
  return 'shieldhub';
}

export function getProviderColor(provider: Provider): string {
  switch (provider) {
    case 'facilitapay': return 'hsl(var(--chart-4))';
    case 'mondo': return 'hsl(var(--chart-3))';
    case 'stripe': return 'hsl(var(--chart-1))';
    case 'shieldhub': return 'hsl(var(--chart-2))';
    case 'moneto': return 'hsl(var(--chart-5))';
    case 'paygate10': return 'hsl(25 95% 53%)';
    case 'ofa': return 'hsl(340 75% 55%)';
    case 'makapay': return 'hsl(160 70% 45%)';
    case 'payok': return 'hsl(200 80% 50%)';
    default: return 'hsl(var(--chart-1))';
  }
}

// Get payment methods available for a country
export function getPaymentMethodsForCountry(countryCode: string): string[] {
  const provider = countryProviderMap[countryCode];
  if (!provider) return ['Card'];
  return providerConfigs[provider]?.methods || ['Card'];
}

// Get provider for a country
export function getProviderForCountry(countryCode: string): Provider | null {
  return countryProviderMap[countryCode] || null;
}
