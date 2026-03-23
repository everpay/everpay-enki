/**
 * Everpay API Configuration
 * 
 * Base URL: https://api.everpayinc.com
 * Checkout URL: https://checkout.everpayinc.com
 * 
 * These are configurable via environment/secrets for live mode.
 * In simulation mode, all calls route through Supabase edge functions.
 */

export const EVERPAY_CONFIG = {
  API_BASE_URL: 'https://api.everpayinc.com',
  CHECKOUT_URL: 'https://checkout.everpayinc.com',
  PAY_URL: 'https://pay.everpayinc.com',
  VERSION: 'v1',
} as const;

/**
 * 3DS2 Authentication States
 */
export type ThreeDSStatus = 'succeeded' | 'requires_action' | 'failed' | 'pending';

export interface ThreeDSResult {
  status: ThreeDSStatus;
  redirect_url?: string;
  transaction_id?: string;
}

/**
 * Multi-PSP Routing Logic
 * Risk-based → Country-based → Amount-based fallback
 */
export function resolveProvider(params: {
  riskScore?: number;
  country?: string;
  amount: number;
  currency: string;
}): string {
  const { riskScore = 0, country, amount, currency } = params;

  // Risk-based routing
  if (riskScore > 80) return 'shieldhub'; // High-risk goes to most robust processor
  if (riskScore > 60) return 'mondo';     // Medium-high risk to EU processor

  // Country-based routing
  if (country) {
    const countryMap: Record<string, string> = {
      US: 'shieldhub', CA: 'moneto',
      GB: 'mondo', DE: 'mondo', FR: 'mondo', NL: 'mondo',
      IN: 'paygate10', PK: 'paygate10', BR: 'paygate10', MX: 'paygate10', NG: 'paygate10',
      CN: 'ofa', VN: 'ofa', TH: 'ofa', JP: 'ofa', KR: 'ofa',
      CO: 'facilitapay',
      TR: 'payok',
    };
    if (countryMap[country]) return countryMap[country];
  }

  // Amount-based routing
  if (amount > 5000) return 'shieldhub'; // High-value to most reliable
  if (amount > 1000) return 'mondo';

  // Currency fallback
  if (['EUR', 'GBP'].includes(currency)) return 'mondo';
  if (['INR', 'BRL', 'MXN'].includes(currency)) return 'paygate10';
  if (['CNY', 'VND', 'THB', 'JPY'].includes(currency)) return 'ofa';

  return 'shieldhub';
}

/**
 * Shopify Draft Order Integration
 */
export interface ShopifyDraftOrderParams {
  store_id: string;
  line_items: Array<{
    title: string;
    price: string;
    quantity: number;
    variant_id?: string;
  }>;
  customer?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  currency?: string;
  note?: string;
  return_url?: string;
}

/**
 * ML Fraud Prediction Features
 */
export interface FraudFeatures {
  amount: number;
  currency: string;
  card_bin?: string;
  customer_email?: string;
  device_id?: string;
  ip_address?: string;
  billing_country?: string;
  card_country?: string;
  is_proxy?: boolean;
  attempt_count?: number;
}

/**
 * BIN Intelligence Result
 */
export interface BINResult {
  bin: string;
  brand: string;
  type: 'credit' | 'debit' | 'prepaid' | 'virtual' | 'unknown';
  country: string;
  issuer: string;
  risk_level: string;
  risk_score: number;
}
