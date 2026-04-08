/**
 * Centralized payment method logo & metadata registry.
 * Used across transaction tables, detail drawers, and payment methods page.
 */

export interface PaymentMethodMeta {
  name: string;
  logo: string;
  description: string;
  provider: string;
  type: 'card' | 'bank' | 'wallet' | 'mobile_money';
  region?: string;
}

/** Logo paths keyed by normalised method slug */
export const METHOD_LOGOS: Record<string, string> = {
  // Card brands
  visa: '/logos/visa.svg',
  mastercard: '/logos/mastercard.svg',
  amex: '/logos/american-express.svg',
  'american express': '/logos/american-express.svg',
  'american-express': '/logos/american-express.svg',
  discover: '/logos/discover.svg',
  jcb: '/logos/jcb.svg',
  unionpay: '/logos/unionpay.svg',

  // Digital wallets
  apple_pay: '/logos/apple-pay.svg',
  'apple pay': '/logos/apple-pay.svg',
  google_pay: '/logos/google-pay.svg',
  'google pay': '/logos/google-pay.svg',
  paypal: '/logos/paypal.svg',
  klarna: '/logos/klarna.svg',

  // EU bank methods
  ideal: '/logos/ideal.svg',
  bancontact: '/logos/bancontact.svg',
  alipay: '/logos/alipay.svg',

  // Pakistan wallets
  jazzcash: '/logos/methods/jazzcash.svg',
  easypaisa: '/logos/methods/easypaisa.svg',
  ncash: '/logos/methods/ncash.svg',

  // Bangladesh wallets
  bkash: '/logos/methods/bkash.svg',
  nagad: '/logos/methods/nagad.svg',

  // African mobile money
  mpesa: '/logos/methods/mpesa.svg',
  'm-pesa': '/logos/methods/mpesa.svg',
  'mobile_money': '/logos/methods/mpesa.svg',

  // Crypto
  crypto: '/logos/crypto.svg',
};

/** Rich metadata for payment methods used on Payment Methods page & integrations */
export const PAYMENT_METHOD_CATALOG: PaymentMethodMeta[] = [
  // Cards
  { name: 'Visa', logo: METHOD_LOGOS.visa, description: 'Accept Visa debit and credit cards worldwide', provider: 'shieldhub', type: 'card' },
  { name: 'Mastercard', logo: METHOD_LOGOS.mastercard, description: 'Accept Mastercard debit and credit cards worldwide', provider: 'shieldhub', type: 'card' },
  { name: 'Amex', logo: METHOD_LOGOS.amex, description: 'American Express premium card processing', provider: 'shieldhub', type: 'card' },
  { name: 'Discover', logo: METHOD_LOGOS.discover, description: 'Discover Network card processing', provider: 'shieldhub', type: 'card' },
  { name: 'JCB', logo: METHOD_LOGOS.jcb, description: 'JCB international card payments', provider: 'shieldhub', type: 'card' },
  { name: 'UnionPay', logo: METHOD_LOGOS.unionpay, description: 'China UnionPay card acceptance', provider: 'shieldhub', type: 'card' },

  // Bank / Open Banking
  { name: 'ACH', logo: '', description: 'US bank-to-bank transfers via ACH network', provider: 'plaid', type: 'bank', region: 'US' },
  { name: 'SEPA', logo: '', description: 'Single Euro Payments Area bank transfers', provider: 'mondo', type: 'bank', region: 'EU' },
  { name: 'Open Banking', logo: '', description: 'PSD2-compliant open banking payments', provider: 'mondo', type: 'bank', region: 'EU/UK' },
  { name: 'PIX', logo: '', description: 'Brazilian instant payment system by Central Bank', provider: 'paygate10', type: 'bank', region: 'BR' },
  { name: 'Boleto', logo: '', description: 'Brazilian bank slip payment method', provider: 'paygate10', type: 'bank', region: 'BR' },
  { name: 'SPEI', logo: '', description: 'Mexican interbank electronic payment system', provider: 'paygate10', type: 'bank', region: 'MX' },
  { name: 'PSE', logo: '', description: 'Colombian online bank redirect payments', provider: 'paygate10', type: 'bank', region: 'CO' },
  { name: 'Prometeo', logo: '', description: 'Open finance and bank redirect across Latin America', provider: 'prometeo', type: 'bank', region: 'LATAM' },
  { name: 'Interac e-Transfer', logo: '', description: 'Canadian domestic e-Transfer network', provider: 'dcbank', type: 'bank', region: 'CA' },

  // Digital Wallets
  { name: 'Apple Pay', logo: METHOD_LOGOS.apple_pay, description: 'Contactless payments via Apple devices', provider: 'matrix', type: 'wallet' },
  { name: 'Google Pay', logo: METHOD_LOGOS.google_pay, description: 'Contactless payments via Android devices', provider: 'matrix', type: 'wallet' },
  { name: 'PayPal', logo: METHOD_LOGOS.paypal, description: 'PayPal wallet-based online payments', provider: 'paypal', type: 'wallet' },

  // Pakistan wallets (PG10)
  { name: 'JazzCash', logo: METHOD_LOGOS.jazzcash, description: 'Pakistan's leading mobile wallet by Jazz (80k+ agents). Send/receive money, pay bills, shop online.', provider: 'paygate10', type: 'wallet', region: 'PK' },
  { name: 'EasyPaisa', logo: METHOD_LOGOS.easypaisa, description: 'Pakistan's pioneer digital bank by Telenor. Mobile account, money transfer, bill payments.', provider: 'paygate10', type: 'wallet', region: 'PK' },
  { name: 'NCash', logo: METHOD_LOGOS.ncash, description: 'Pakistan mobile wallet for cash-in, cash-out, and bill payments.', provider: 'paygate10', type: 'wallet', region: 'PK' },

  // Bangladesh wallets (Makapay)
  { name: 'bKash', logo: METHOD_LOGOS.bkash, description: 'Bangladesh's largest mobile financial service (80M+ users). Cash-in, cash-out, send money, payments.', provider: 'makapay', type: 'wallet', region: 'BD' },
  { name: 'Nagad', logo: METHOD_LOGOS.nagad, description: 'Bangladesh digital financial service by Bangladesh Post Office. Secure cash-in, cash-out, send money, mobile recharge.', provider: 'makapay', type: 'wallet', region: 'BD' },

  // African mobile money
  { name: 'M-Pesa', logo: METHOD_LOGOS.mpesa, description: 'East Africa's leading mobile money platform (Kenya, Tanzania, Uganda).', provider: 'lipad', type: 'mobile_money', region: 'KE/TZ/UG' },
  { name: 'Mobile Money', logo: METHOD_LOGOS.mobile_money, description: 'Pan-African mobile money across 11+ countries including Airtel Money.', provider: 'lipad', type: 'mobile_money', region: 'Africa' },
];

/**
 * Resolve a logo path for a given payment method string (case-insensitive).
 */
export function getMethodLogo(method: string): string | undefined {
  if (!method) return undefined;
  const key = method.toLowerCase().replace(/[\s-]+/g, '_');
  if (METHOD_LOGOS[key]) return METHOD_LOGOS[key];
  // try with original casing variants
  const altKey = method.toLowerCase().replace(/[\s_]+/g, '-');
  if (METHOD_LOGOS[altKey]) return METHOD_LOGOS[altKey];
  const simpleKey = method.toLowerCase().replace(/[\s_-]+/g, '');
  // search through keys
  for (const [k, v] of Object.entries(METHOD_LOGOS)) {
    if (k.replace(/[\s_-]+/g, '') === simpleKey) return v;
  }
  return undefined;
}
