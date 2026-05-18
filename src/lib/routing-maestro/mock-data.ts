export interface Processor {
  id: string;
  name: string;
  enabled: boolean;
  successRate: number;
  volume: number;
  failureRate: number;
  latency: number;
  monthlyCap: number;
  currentVolume: number;
}
export interface Merchant {
  id: string;
  name: string;
  industry: string;
  status: 'active' | 'inactive';
  overrideEnabled: boolean;
}
export interface RoutingRule {
  id: string;
  name: string;
  priority: number;
  enabled: boolean;
  conditions: { field: string; operator: string; value: string }[];
  action: string;
  actionTarget: string;
  scope: 'global' | 'merchant';
  merchantId?: string;
}
export interface MerchantProcessor {
  processorId: string;
  processorName: string;
  priority: number;
  weight: number;
  enabled: boolean;
  monthlyCap: number;
  currentVolume: number;
}
export const processors: Processor[] = [
  { id: 'stripe', name: 'Stripe', enabled: true, successRate: 97.2, volume: 1245000, failureRate: 2.8, latency: 230, monthlyCap: 5000000, currentVolume: 1245000 },
  { id: 'adyen', name: 'Adyen', enabled: true, successRate: 95.8, volume: 890000, failureRate: 4.2, latency: 310, monthlyCap: 3000000, currentVolume: 890000 },
  { id: 'checkout', name: 'Checkout.com', enabled: true, successRate: 94.1, volume: 560000, failureRate: 5.9, latency: 280, monthlyCap: 2000000, currentVolume: 560000 },
  { id: 'braintree', name: 'Braintree', enabled: false, successRate: 91.5, volume: 120000, failureRate: 8.5, latency: 450, monthlyCap: 1000000, currentVolume: 120000 },
  { id: 'worldpay', name: 'Worldpay', enabled: true, successRate: 93.4, volume: 340000, failureRate: 6.6, latency: 360, monthlyCap: 2500000, currentVolume: 340000 },
];
export const merchants: Merchant[] = [
  { id: 'm1', name: 'TechCorp Inc.', industry: 'SaaS', status: 'active', overrideEnabled: false },
  { id: 'm2', name: 'ShopMax Global', industry: 'E-commerce', status: 'active', overrideEnabled: true },
  { id: 'm3', name: 'GameVault Studios', industry: 'Gaming', status: 'active', overrideEnabled: false },
  { id: 'm4', name: 'FinanceHub Ltd.', industry: 'Financial Services', status: 'active', overrideEnabled: false },
  { id: 'm5', name: 'TravelEase Co.', industry: 'Travel', status: 'inactive', overrideEnabled: false },
];
export const merchantProcessors: Record<string, MerchantProcessor[]> = {
  m1: [
    { processorId: 'stripe', processorName: 'Stripe', priority: 1, weight: 60, enabled: true, monthlyCap: 500000, currentVolume: 320000 },
    { processorId: 'adyen', processorName: 'Adyen', priority: 2, weight: 30, enabled: true, monthlyCap: 300000, currentVolume: 180000 },
    { processorId: 'checkout', processorName: 'Checkout.com', priority: 3, weight: 10, enabled: true, monthlyCap: 200000, currentVolume: 45000 },
  ],
  m2: [
    { processorId: 'adyen', processorName: 'Adyen', priority: 1, weight: 50, enabled: true, monthlyCap: 400000, currentVolume: 280000 },
    { processorId: 'stripe', processorName: 'Stripe', priority: 2, weight: 35, enabled: true, monthlyCap: 350000, currentVolume: 200000 },
    { processorId: 'worldpay', processorName: 'Worldpay', priority: 3, weight: 15, enabled: true, monthlyCap: 150000, currentVolume: 60000 },
  ],
  m3: [
    { processorId: 'stripe', processorName: 'Stripe', priority: 1, weight: 70, enabled: true, monthlyCap: 200000, currentVolume: 140000 },
    { processorId: 'checkout', processorName: 'Checkout.com', priority: 2, weight: 30, enabled: true, monthlyCap: 100000, currentVolume: 30000 },
  ],
  m4: [
    { processorId: 'adyen', processorName: 'Adyen', priority: 1, weight: 45, enabled: true, monthlyCap: 600000, currentVolume: 270000 },
    { processorId: 'stripe', processorName: 'Stripe', priority: 2, weight: 35, enabled: true, monthlyCap: 400000, currentVolume: 220000 },
    { processorId: 'worldpay', processorName: 'Worldpay', priority: 3, weight: 20, enabled: true, monthlyCap: 200000, currentVolume: 80000 },
  ],
  m5: [
    { processorId: 'checkout', processorName: 'Checkout.com', priority: 1, weight: 100, enabled: true, monthlyCap: 50000, currentVolume: 10000 },
  ],
};
export const routingRules: RoutingRule[] = [
  { id: 'r1', name: 'High-value to Stripe', priority: 1, enabled: true, conditions: [{ field: 'amount', operator: '>', value: '10000' }], action: 'route_to', actionTarget: 'Stripe', scope: 'global' },
  { id: 'r2', name: 'EUR to Adyen', priority: 2, enabled: true, conditions: [{ field: 'currency', operator: '=', value: 'EUR' }], action: 'route_to', actionTarget: 'Adyen', scope: 'global' },
  { id: 'r3', name: 'Block high-risk countries', priority: 3, enabled: true, conditions: [{ field: 'country', operator: 'in', value: 'NK,IR,SY' }], action: 'block', actionTarget: '', scope: 'global' },
  { id: 'r4', name: 'BIN range premium', priority: 4, enabled: false, conditions: [{ field: 'bin_range', operator: 'range', value: '400000-499999' }], action: 'route_to', actionTarget: 'Checkout.com', scope: 'global' },
];
export const performanceHistory = [
  { date: 'Jan', stripe: 96.5, adyen: 95.1, checkout: 93.8, worldpay: 92.1 },
  { date: 'Feb', stripe: 97.1, adyen: 95.5, checkout: 94.2, worldpay: 93.0 },
  { date: 'Mar', stripe: 96.8, adyen: 96.0, checkout: 93.5, worldpay: 93.4 },
  { date: 'Apr', stripe: 97.5, adyen: 95.8, checkout: 94.8, worldpay: 92.8 },
  { date: 'May', stripe: 97.0, adyen: 96.2, checkout: 94.1, worldpay: 93.6 },
  { date: 'Jun', stripe: 97.2, adyen: 95.8, checkout: 94.1, worldpay: 93.4 },
];
