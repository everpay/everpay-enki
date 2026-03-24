// Country-based payment routing configuration
// Maps countries to their supported payment methods, currencies, and providers

export interface CountryPaymentConfig {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  provider: string;
  paymentMethods: string[];
}

export const COUNTRY_PAYMENT_CONFIGS: CountryPaymentConfig[] = [
  // Paygate10 countries
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', currencySymbol: '₹', provider: 'paygate10', paymentMethods: ['UPI', 'NB', 'UPIQRCode', 'Bank Transfer', 'Wallet'] },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', currencySymbol: 'R$', provider: 'facilitapay', paymentMethods: ['PIX', 'Boleto', 'Bank Transfer'] },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', currency: 'ARS', currencySymbol: '$', provider: 'paygate10', paymentMethods: ['Bank Transfer', 'Cash'] },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', currencySymbol: '₦', provider: 'paygate10', paymentMethods: ['Bank Transfer', 'Bank Deposit'] },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', currency: 'EGP', currencySymbol: 'E£', provider: 'paygate10', paymentMethods: ['Bank Transfer', 'Cash'] },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN', currencySymbol: '$', provider: 'paygate10', paymentMethods: ['SPEI', 'Cash', 'Bank Transfer'] },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', currencySymbol: 'R', provider: 'paygate10', paymentMethods: ['Bank Transfer', 'Cash'] },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES', currencySymbol: 'KSh', provider: 'paygate10', paymentMethods: ['Bank Transfer', 'Wallet'] },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', currency: 'PKR', currencySymbol: '₨', provider: 'paygate10', paymentMethods: ['JazzCash', 'EasyPaisa', 'Bank Transfer'] },
  
  // OFA countries
  { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY', currencySymbol: '¥', provider: 'ofa', paymentMethods: ['P2P', 'P2C', 'QP', 'Bank Transfer'] },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', currency: 'VND', currencySymbol: '₫', provider: 'ofa', paymentMethods: ['P2P', 'P2C', 'Bank Transfer'] },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', currency: 'THB', currencySymbol: '฿', provider: 'ofa', paymentMethods: ['P2P', 'P2C', 'QP', 'Bank Transfer'] },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', currency: 'IDR', currencySymbol: 'Rp', provider: 'ofa', paymentMethods: ['P2P', 'P2C', 'Bank Transfer'] },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', currency: 'MYR', currencySymbol: 'RM', provider: 'ofa', paymentMethods: ['P2P', 'P2C', 'Bank Transfer'] },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', currency: 'PHP', currencySymbol: '₱', provider: 'ofa', paymentMethods: ['P2P', 'P2C', 'Bank Transfer'] },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', currencySymbol: '¥', provider: 'ofa', paymentMethods: ['P2P', 'Bank Transfer'] },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: 'KRW', currencySymbol: '₩', provider: 'ofa', paymentMethods: ['P2P', 'Bank Transfer'] },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', currency: 'USD', currencySymbol: '$', provider: 'makapay', paymentMethods: ['SSLCommerz', 'SurjoPay', 'bKash', 'Nagad'] },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', currency: 'HKD', currencySymbol: 'HK$', provider: 'ofa', paymentMethods: ['P2P', 'P2C', 'Bank Transfer'] },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', currencySymbol: 'A$', provider: 'ofa', paymentMethods: ['P2P', 'Bank Transfer'] },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', currency: 'TWD', currencySymbol: 'NT$', provider: 'ofa', paymentMethods: ['P2P', 'Bank Transfer'] },
  
  // Mondo countries (EU/UK)
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', currencySymbol: '£', provider: 'mondo', paymentMethods: ['Card', 'Faster Payments', 'Open Banking'] },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', currencySymbol: '€', provider: 'mondo', paymentMethods: ['Card', 'SEPA', 'Open Banking'] },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', currencySymbol: '€', provider: 'mondo', paymentMethods: ['Card', 'SEPA', 'Open Banking'] },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR', currencySymbol: '€', provider: 'mondo', paymentMethods: ['Card', 'SEPA'] },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR', currencySymbol: '€', provider: 'mondo', paymentMethods: ['Card', 'SEPA'] },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: 'EUR', currencySymbol: '€', provider: 'mondo', paymentMethods: ['Card', 'SEPA', 'iDEAL'] },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', currency: 'EUR', currencySymbol: '€', provider: 'mondo', paymentMethods: ['Card', 'SEPA', 'Bancontact'] },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', currency: 'EUR', currencySymbol: '€', provider: 'mondo', paymentMethods: ['Card', 'SEPA'] },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', currency: 'EUR', currencySymbol: '€', provider: 'mondo', paymentMethods: ['Card', 'SEPA'] },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', currency: 'EUR', currencySymbol: '€', provider: 'mondo', paymentMethods: ['Card', 'SEPA'] },
  
  // ShieldHub countries (US/Global)
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', currencySymbol: '$', provider: 'shieldhub', paymentMethods: ['Card', 'ACH'] },
  
  // Moneto (Canada)
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', currencySymbol: 'C$', provider: 'moneto', paymentMethods: ['Wallet', 'Bank Transfer'] },
  
  // FacilitaPay (LATAM)
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', currency: 'COP', currencySymbol: '$', provider: 'facilitapay', paymentMethods: ['PSE', 'Bank Transfer'] },
  
  // PayOK (Turkey)
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', currency: 'TRY', currencySymbol: '₺', provider: 'payok', paymentMethods: ['Card', 'Bank Transfer'] },
];

export function getConfigForCountry(code: string): CountryPaymentConfig | undefined {
  return COUNTRY_PAYMENT_CONFIGS.find(c => c.code === code);
}

export function getAllSupportedCurrencies(): { code: string; name: string; symbol: string }[] {
  const seen = new Set<string>();
  const currencies: { code: string; name: string; symbol: string }[] = [];
  for (const config of COUNTRY_PAYMENT_CONFIGS) {
    if (!seen.has(config.currency)) {
      seen.add(config.currency);
      currencies.push({ code: config.currency, name: config.currency, symbol: config.currencySymbol });
    }
  }
  return currencies.sort((a, b) => a.code.localeCompare(b.code));
}
