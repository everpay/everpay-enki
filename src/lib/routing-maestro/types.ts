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

export interface MerchantRow {
  id: string;
  name: string;
  industry: string;
  status: 'active' | 'inactive';
  overrideEnabled: boolean;
}

export interface RoutingRuleRow {
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

export interface PerfPoint {
  date: string;
  [processorKey: string]: string | number;
}
