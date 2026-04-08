import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useElektropayWallets() {
  return useQuery({
    queryKey: ['elektropay-wallets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: merchant } = await supabase
        .from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('Merchant not found');

      const { data, error } = await supabase
        .from('elektropay_wallets' as any)
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useElektropayPayments() {
  return useQuery({
    queryKey: ['elektropay-payments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: merchant } = await supabase
        .from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('Merchant not found');

      const { data, error } = await supabase
        .from('elektropay_payments' as any)
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useElektropayWithdrawals() {
  return useQuery({
    queryKey: ['elektropay-withdrawals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: merchant } = await supabase
        .from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('Merchant not found');

      const { data, error } = await supabase
        .from('elektropay_withdrawals' as any)
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSyncElektropayBalances() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('elektropay-proxy', {
        body: { action: 'sync_balances' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elektropay-wallets'] });
      toast.success('Wallet balances synced');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateCryptoPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      amount: number;
      fiat_currency: string;
      crypto_currency: string;
      customer_email: string;
      customer_name?: string;
      description?: string;
      success_url?: string;
      cancel_url?: string;
      transaction_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('elektropay-proxy', {
        body: { action: 'create_payment', ...params },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elektropay-payments'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateCryptoWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      amount: number;
      asset_id: string;
      address: string;
      withdraw_asset_id?: string;
      payer_email?: string;
      payer_name?: string;
      description?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('elektropay-proxy', {
        body: { action: 'create_withdrawal', ...params },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elektropay-wallets', 'elektropay-withdrawals'] });
      toast.success('Withdrawal initiated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useProvisionCryptoWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { asset_id: string; payer_email: string; payer_name: string }) => {
      const { data, error } = await supabase.functions.invoke('elektropay-proxy', {
        body: { action: 'dedicate_address', ...params },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elektropay-wallets'] });
      toast.success('Crypto wallet provisioned');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useConvertCrypto() {
  return useMutation({
    mutationFn: async (params: { from_amount: number; from_asset_id: string; asset_id: string }) => {
      const { data, error } = await supabase.functions.invoke('elektropay-proxy', {
        body: { action: 'convert', ...params },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCryptoDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      crypto_currency: string;
      payer_email?: string;
      payer_name?: string;
      description?: string;
      timeout?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('elektropay-proxy', {
        body: { action: 'create_deposit', ...params },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elektropay-wallets', 'elektropay-payments'] });
      toast.success('Deposit address created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useElektropayDeposits() {
  return useQuery({
    queryKey: ['elektropay-deposits'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: merchant } = await supabase
        .from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('Merchant not found');

      const { data, error } = await supabase
        .from('elektropay_payments' as any)
        .select('*')
        .eq('merchant_id', merchant.id)
        .eq('payment_type', 'DEPOSIT')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
