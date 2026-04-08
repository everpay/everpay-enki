/**
 * Centralized payment method logo & metadata registry.
 * Used across transaction tables, detail drawers, payment methods page, and integrations.
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
  sepa: '/logos/methods/sepa.png',
  'sepa direct debit': '/logos/methods/sepa.png',

  // Bank transfer methods
  ach: '/logos/methods/ach.png',
  pix: '/logos/methods/pix.png',
  spei: '/logos/methods/spei.png',
  boleto: '/logos/boleto.jpg',
  interac: '/logos/methods/interac.png',
  'interac e-transfer': '/logos/methods/interac.png',
  'interac_e_transfer': '/logos/methods/interac.png',

  // Pakistan wallets
  jazzcash: '/logos/methods/jazzcash.png',
  easypaisa: '/logos/methods/easypaisa.png',
  ncash: '/logos/methods/ncash.svg',

  // India
  upi: '/logos/methods/upi.png',
  'upi qr': '/logos/methods/upi.png',
  upiqrcode: '/logos/methods/upi.png',

  // Bangladesh wallets
  bkash: '/logos/methods/bkash.png',
  nagad: '/logos/methods/nagad.png',
  sslcommerz: '/logos/methods/sslcommerz.png',
  surjopay: '/logos/methods/surjopay.png',

  // African mobile money
  mpesa: '/logos/methods/mpesa.png',
  'm-pesa': '/logos/methods/mpesa.png',
  mobile_money: '/logos/methods/mpesa.png',
  'airtel money': '/logos/methods/airtel-money.png',
  'airtel_money': '/logos/methods/airtel-money.png',

  // Crypto
  crypto: '/logos/crypto.svg',

  // Integration / processor logos
  shopify: '/logos/integrations/shopify.png',
  bigcommerce: '/logos/integrations/bigcommerce.png',
  stripe: '/logos/stripe.jpg',
  shieldhub: '/logos/integrations/shieldhub.png',
  mondo: '/logos/integrations/mondo.png',
  paygate10: '/logos/integrations/paygate10.png',
  makapay: '/logos/integrations/makapay.png',
  lipad: '/logos/integrations/lipad.png',
  ofa: '/logos/integrations/ofa.png',
  moneto: '/logos/integrations/moneto.png',
  dcbank: '/logos/integrations/dcbank.png',
  matrix: '/logos/integrations/matrix.png',
  prometeo: '/logos/integrations/prometeo.png',
  payok: '/logos/integrations/payok.png',
  pacopay: '/logos/integrations/pacopay.png',
  plaid: '/logos/integrations/plaid.png',
  chargeflow: '/logos/integrations/chargeflow.png',
  tapix: '/logos/integrations/tapix.png',
  wise: '/logos/integrations/wise.png',
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
  { name: 'ACH', logo: METHOD_LOGOS.ach, description: 'US bank-to-bank transfers via ACH network', provider: 'plaid', type: 'bank', region: 'US' },
  { name: 'SEPA', logo: METHOD_LOGOS.sepa, description: 'Single Euro Payments Area bank transfers', provider: 'mondo', type: 'bank', region: 'EU' },
  { name: 'Open Banking', logo: METHOD_LOGOS.mondo, description: 'PSD2-compliant open banking payments', provider: 'mondo', type: 'bank', region: 'EU/UK' },
  { name: 'PIX', logo: METHOD_LOGOS.pix, description: 'Brazilian instant payment system by Central Bank', provider: 'paygate10', type: 'bank', region: 'BR' },
  { name: 'Boleto', logo: METHOD_LOGOS.boleto, description: 'Brazilian bank slip payment method', provider: 'paygate10', type: 'bank', region: 'BR' },
  { name: 'SPEI', logo: METHOD_LOGOS.spei, description: 'Mexican interbank electronic payment system', provider: 'paygate10', type: 'bank', region: 'MX' },
  { name: 'PSE', logo: METHOD_LOGOS.prometeo, description: 'Colombian online bank redirect payments', provider: 'paygate10', type: 'bank', region: 'CO' },
  { name: 'Prometeo', logo: METHOD_LOGOS.prometeo, description: 'Open finance and bank redirect across Latin America', provider: 'prometeo', type: 'bank', region: 'LATAM' },
  { name: 'Interac e-Transfer', logo: METHOD_LOGOS.interac, description: 'Canadian domestic e-Transfer network', provider: 'dcbank', type: 'bank', region: 'CA' },

  // Digital Wallets
  { name: 'Apple Pay', logo: METHOD_LOGOS.apple_pay, description: 'Contactless payments via Apple devices', provider: 'matrix', type: 'wallet' },
  { name: 'Google Pay', logo: METHOD_LOGOS.google_pay, description: 'Contactless payments via Android devices', provider: 'matrix', type: 'wallet' },
  { name: 'PayPal', logo: METHOD_LOGOS.paypal, description: 'PayPal wallet-based online payments', provider: 'paypal', type: 'wallet' },

  // Pakistan wallets (PG10)
  { name: 'JazzCash', logo: METHOD_LOGOS.jazzcash, description: 'Pakistan leading mobile wallet by Jazz (80k+ agents). Send/receive money, pay bills, shop online.', provider: 'paygate10', type: 'wallet', region: 'PK' },
  { name: 'EasyPaisa', logo: METHOD_LOGOS.easypaisa, description: 'Pakistan pioneer digital bank by Telenor. Mobile account, money transfer, bill payments.', provider: 'paygate10', type: 'wallet', region: 'PK' },
  { name: 'NCash', logo: METHOD_LOGOS.ncash, description: 'Pakistan mobile wallet for cash-in, cash-out, and bill payments.', provider: 'paygate10', type: 'wallet', region: 'PK' },
  { name: 'UPI', logo: METHOD_LOGOS.upi, description: 'Unified Payments Interface for instant bank-to-bank transfers in India.', provider: 'paygate10', type: 'wallet', region: 'IN' },

  // Bangladesh wallets (Makapay)
  { name: 'bKash', logo: METHOD_LOGOS.bkash, description: 'Bangladesh largest mobile financial service (80M+ users). Cash-in, cash-out, send money, payments.', provider: 'makapay', type: 'wallet', region: 'BD' },
  { name: 'Nagad', logo: METHOD_LOGOS.nagad, description: 'Bangladesh digital financial service by Post Office. Secure cash-in, cash-out, send money, mobile recharge.', provider: 'makapay', type: 'wallet', region: 'BD' },
  { name: 'SSLCommerz', logo: METHOD_LOGOS.sslcommerz, description: 'Leading Bangladesh payment gateway supporting 30+ payment methods.', provider: 'makapay', type: 'wallet', region: 'BD' },
  { name: 'SurjoPay', logo: METHOD_LOGOS.surjopay, description: 'Bangladesh payment gateway for online and mobile payments.', provider: 'makapay', type: 'wallet', region: 'BD' },

  // African mobile money
  { name: 'M-Pesa', logo: METHOD_LOGOS.mpesa, description: 'East Africa leading mobile money platform (Kenya, Tanzania, Uganda).', provider: 'lipad', type: 'mobile_money', region: 'KE/TZ/UG' },
  { name: 'Airtel Money', logo: METHOD_LOGOS['airtel money'], description: 'Airtel mobile money service across Africa.', provider: 'lipad', type: 'mobile_money', region: 'Africa' },
  { name: 'Mobile Money', logo: METHOD_LOGOS.mobile_money, description: 'Pan-African mobile money across 11+ countries.', provider: 'lipad', type: 'mobile_money', region: 'Africa' },
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

/**
 * Get integration/provider logo by provider key.
 */
export function getProviderLogo(provider: string): string | undefined {
  if (!provider) return undefined;
  const key = provider.toLowerCase();
  return METHOD_LOGOS[key] || undefined;
}
