import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

async function callMatrix(action: string, params: Record<string, any> = {}, sandbox = true) {
  const { data, error } = await supabase.functions.invoke('matrix-process', {
    body: { action, sandbox, ...params },
  });
  if (error) throw new Error(error.message || 'Matrix API error');
  return data;
}

// ── Core Payment Mutations ──
export function useMatrixCustomerToken() {
  return useMutation({
    mutationFn: (params: { id: string; details?: Record<string, string>; labels?: string[] }) =>
      callMatrix('customer_token', params),
    onError: (e: Error) => toast.error(`Customer token failed: ${e.message}`),
  });
}

export function useMatrixPay() {
  return useMutation({
    mutationFn: (params: {
      reference: string; order_id: string; order_description: string;
      token: string; amount: number; currency: string;
      result_url?: string; subscribe?: boolean;
      allow_currency_convert?: boolean; forced_convert?: boolean;
      allow_cascading_after_3ds?: boolean;
    }) => callMatrix('pay', params),
    onError: (e: Error) => toast.error(`Payment failed: ${e.message}`),
  });
}

export function useMatrixCheckout() {
  return useMutation({
    mutationFn: (params: {
      reference: string; order_id: string; order_description: string;
      amount: number; currency: string;
      result_url: string; success_url: string; error_url: string;
      language?: string; customer_token?: string;
      allow_currency_convert?: boolean; forced_convert?: boolean;
      allow_cascading_after_3ds?: boolean; callback_url?: string;
    }) => callMatrix('checkout', params),
    onError: (e: Error) => toast.error(`Checkout failed: ${e.message}`),
  });
}

export function useMatrixRefund() {
  return useMutation({
    mutationFn: (params: {
      reference: string; order_id: string; order_description: string;
      parent_transaction_id: string; amount?: number;
    }) => callMatrix('refund', params),
    onError: (e: Error) => toast.error(`Refund failed: ${e.message}`),
  });
}

export function useMatrixPayout() {
  return useMutation({
    mutationFn: (params: {
      reference: string; order_id: string; order_description: string;
      token: string; amount: number; currency: string;
      allow_currency_convert?: boolean; forced_convert?: boolean;
    }) => callMatrix('payout', params),
    onError: (e: Error) => toast.error(`Payout failed: ${e.message}`),
  });
}

// ── Transaction Status ──
export function useMatrixTransactionStatus() {
  return useMutation({
    mutationFn: (params: { order_id?: string; transaction_id?: string }) =>
      callMatrix('status', params),
  });
}

export function useMatrixOrderStatus() {
  return useMutation({
    mutationFn: (params: { order_id: string }) => callMatrix('order_status', params),
  });
}

// ── Cascading ──
export function useMatrixCascade() {
  return useMutation({
    mutationFn: (params: { transaction_id: string }) => callMatrix('cascade', params),
  });
}

export function useMatrixCascadeReject() {
  return useMutation({
    mutationFn: (params: { transaction_id: string }) => callMatrix('cascade_reject', params),
  });
}

// ── H2H (Host-to-Host) ──
export function useMatrixH2HPayment() {
  return useMutation({
    mutationFn: (params: {
      order_id: string; order_description: string;
      amount: number; currency: string;
      cc_number: string; exp_month: number; exp_year: number; card_cvv: string;
      customer_id?: string; customer_ip: string;
      allow_currency_convert?: boolean; forced_convert?: boolean;
      customer_labels?: string[]; callback_url?: string; extra_params?: Record<string, string>;
    }) => callMatrix('h2h_payment', params),
    onError: (e: Error) => toast.error(`H2H payment failed: ${e.message}`),
  });
}

export function useMatrixH2HPayout() {
  return useMutation({
    mutationFn: (params: {
      order_id: string; order_description: string;
      amount: number; currency: string;
      cc_number: string; exp_month: number; exp_year: number; card_cvv: string;
      customer_id?: string; customer_ip: string;
    }) => callMatrix('h2h_payout', params),
    onError: (e: Error) => toast.error(`H2H payout failed: ${e.message}`),
  });
}

export function useMatrixH2PP2PInit() {
  return useMutation({
    mutationFn: (params: {
      order_id: string; order_description: string;
      amount: number; currency: string;
      customer_ip: string; customer_id?: string;
      callback_url?: string; result_url?: string;
    }) => callMatrix('h2h_p2p_init', params),
  });
}

export function useMatrixH2HAPM() {
  return useMutation({
    mutationFn: (params: Record<string, any>) => callMatrix('h2h_apm', params),
  });
}

// ── Subscription Plans ──
export function useMatrixPlanCreate() {
  return useMutation({
    mutationFn: (params: {
      name: string; description?: string;
      billing_period: { kind: string; value: number };
      retries: Array<{ kind: string; value: number }>;
      prices: Array<{ currency: string; value: number }>;
      default_price_currency: string;
      end_after_period?: { kind: string; value: number };
    }) => callMatrix('plan_create', params),
    onSuccess: () => toast.success('Plan created'),
    onError: (e: Error) => toast.error(`Plan creation failed: ${e.message}`),
  });
}

export function useMatrixPlanUpdate() {
  return useMutation({
    mutationFn: (params: Record<string, any>) => callMatrix('plan_update', params),
    onSuccess: () => toast.success('Plan updated'),
  });
}

export function useMatrixPlanDeactivate() {
  return useMutation({
    mutationFn: (params: { id: string; cancel_subscription_payments: boolean }) =>
      callMatrix('plan_deactivate', params),
    onSuccess: () => toast.success('Plan deactivated'),
  });
}

export function useMatrixPlanDetails() {
  return useMutation({
    mutationFn: (params: { id: string }) => callMatrix('plan_details', params),
  });
}

// ── Subscriptions ──
export function useMatrixSubscriptionInit() {
  return useMutation({
    mutationFn: (params: {
      plan_id: string; currency: string; payment_token: string; order_id: string;
      result_url?: string; description?: string;
      allow_currency_convert?: boolean; force_currency_convert?: boolean;
      disable_cascading_after_3ds?: boolean;
    }) => callMatrix('subscription_init', params),
    onError: (e: Error) => toast.error(`Subscription init failed: ${e.message}`),
  });
}

export function useMatrixSubscriptionHPP() {
  return useMutation({
    mutationFn: (params: {
      plan_id: string; order_id: string; currency: string;
      success_url: string; error_url: string;
      customer_token?: string; description?: string;
    }) => callMatrix('subscription_hpp', params),
  });
}

export function useMatrixSubscriptionDetails() {
  return useMutation({
    mutationFn: (params: { subscription_id: string }) => callMatrix('subscription_details', params),
  });
}

export function useMatrixSubscriptionList() {
  return useMutation({
    mutationFn: (params: { customer_token: string }) => callMatrix('subscription_list', params),
  });
}

export function useMatrixSubscriptionCancel() {
  return useMutation({
    mutationFn: (params: { subscription_ids: string[]; reason: string }) =>
      callMatrix('subscription_cancel', params),
    onSuccess: () => toast.success('Subscription(s) cancelled'),
  });
}

export function useMatrixSubscriptionTokenPay() {
  return useMutation({
    mutationFn: (params: {
      reference: string; order_id: string; order_description: string;
      subscription_id: string; amount: number; currency: string;
    }) => callMatrix('subscription_token_pay', params),
  });
}

// ── Oneclick ──
export function useMatrixOneclickCreate() {
  return useMutation({
    mutationFn: (params: {
      reference: string; order_id: string; order_description: string;
      amount: number; currency: string;
      result_url?: string; success_url?: string; error_url?: string;
      customer_token?: string; oneclick_token?: string;
      allow_currency_convert?: boolean; forced_convert?: boolean;
      check_all_routes?: boolean; allow_cascading_after_3ds?: boolean;
    }) => callMatrix('oneclick_create', params),
    onError: (e: Error) => toast.error(`Oneclick init failed: ${e.message}`),
  });
}

export function useMatrixOneclickPay() {
  return useMutation({
    mutationFn: (params: {
      reference: string; order_id: string; order_description: string;
      amount: number; currency: string; oneclick_token: string;
      allow_currency_convert?: boolean; forced_convert?: boolean;
    }) => callMatrix('oneclick_pay', params),
    onError: (e: Error) => toast.error(`Oneclick pay failed: ${e.message}`),
  });
}

export function useMatrixCheckoutOneclickPay() {
  return useMutation({
    mutationFn: (params: {
      reference: string; order_id: string; order_description: string;
      amount: number; currency: string; oneclick_token: string;
      result_url?: string; success_url?: string; error_url?: string;
    }) => callMatrix('checkout_oneclick_pay', params),
  });
}

// ── Project & MID Queries ──
export function useMatrixProjectDetails() {
  return useQuery({
    queryKey: ['matrix-project-details'],
    queryFn: () => callMatrix('project_details', { api_key: 'current' }),
    staleTime: 60_000,
  });
}

export function useMatrixMIDDetails(mid?: string) {
  return useQuery({
    queryKey: ['matrix-mid-details', mid],
    queryFn: () => callMatrix('mid_details', { mid }),
    enabled: !!mid,
    staleTime: 60_000,
  });
}

export function useMatrixMIDBalance(mid?: string) {
  return useQuery({
    queryKey: ['matrix-mid-balance', mid],
    queryFn: () => callMatrix('mid_balance', { mid }),
    enabled: !!mid,
    staleTime: 30_000,
  });
}

export function useMatrixAggregatedBalance() {
  return useQuery({
    queryKey: ['matrix-aggregated-balance'],
    queryFn: () => callMatrix('aggregated_mid_balance', { mid: 'AG-0000000000' }),
    staleTime: 30_000,
  });
}

export function useMatrixExternalMIDDetails(id?: string) {
  return useQuery({
    queryKey: ['matrix-external-mid', id],
    queryFn: () => callMatrix('external_mid_details', { id }),
    enabled: !!id,
    staleTime: 60_000,
  });
}
