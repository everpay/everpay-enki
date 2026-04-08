import { supabase } from '@/integrations/supabase/client';

const FASTAPI_BASE = import.meta.env.VITE_FASTAPI_URL || '';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

async function fastapiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers = await getAuthHeaders();

  // If no FastAPI URL configured, fall back to Supabase edge functions
  const baseUrl = FASTAPI_BASE || `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
  const url = `${baseUrl}${path}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `FastAPI error ${res.status}`);
  }

  return res.json();
}

// ─── Payment Operations ────────────────────────────────
export interface ChargeRequest {
  merchant_id: string;
  amount: number;
  currency: string;
  customer_email?: string;
  description?: string;
  idempotency_key?: string;
}

export interface ChargeResponse {
  id: string;
  status: string;
  provider: string;
  amount: number;
  currency: string;
}

export const fastapi = {
  payments: {
    charge: (data: ChargeRequest) =>
      fastapiRequest<ChargeResponse>('POST', '/payments/charge', data),
    refund: (data: { transaction_id: string; amount?: number; reason?: string }) =>
      fastapiRequest<{ id: string; status: string }>('POST', '/payments/refund', data),
  },

  payouts: {
    create: (data: { merchant_id: string; amount: number; currency: string; destination: string }) =>
      fastapiRequest<{ id: string; status: string }>('POST', '/payouts/create', data),
  },

  merchants: {
    summary: (merchantId: string) =>
      fastapiRequest<{
        id: string;
        name: string;
        total_balance: number;
        pending_balance: number;
        transaction_count: number;
        success_rate: number;
      }>('GET', `/merchants/${merchantId}/summary`),
  },

  treasury: {
    liquidity: () =>
      fastapiRequest<{
        pools: Array<{ currency: string; balance: number; region: string }>;
        total_usd: number;
        payout_obligations: number;
      }>('GET', '/treasury/liquidity'),
  },

  rateLimits: {
    get: (merchantId: string, endpointType?: string) => {
      const path = endpointType
        ? `/config/rate-limit/${merchantId}/${endpointType}`
        : `/config/rate-limit/${merchantId}`;
      return fastapiRequest<{
        limits: Array<{
          endpoint_type: string;
          requests_per_minute: number;
          burst_limit: number;
          current_usage?: number;
          adaptive_multiplier?: number;
          effective_limit?: number;
        }>;
      }>('GET', path);
    },
    update: (merchantId: string, endpointType: string, data: { requests_per_minute: number; burst_limit: number }) =>
      fastapiRequest<{ success: boolean }>('PUT', `/config/rate-limit/${merchantId}/${endpointType}`, data),
  },

  adaptiveRateLimit: {
    get: (merchantId: string) =>
      fastapiRequest<{
        merchant_id: string;
        risk_score: number;
        adaptive_multiplier: number;
        success_rate: number;
        chargeback_rate: number;
        fraud_score: number;
        velocity_score: number;
        locked: boolean;
      }>('GET', `/adaptive-rate-limit/${merchantId}`),
    update: (merchantId: string, data: { adaptive_multiplier?: number; locked?: boolean }) =>
      fastapiRequest<{ success: boolean }>('PUT', `/adaptive-rate-limit/${merchantId}`, data),
  },
};
