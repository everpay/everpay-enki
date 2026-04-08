import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Order {
  id: string;
  order_number: string;
  merchant_id: string;
  customer_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  status: string;
  currency: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_intent_id: string | null;
  invoice_id: string | null;
  transaction_id: string | null;
  payment_method: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!merchant) throw new Error('Merchant not found');

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Order[];
    },
  });
}

export function useOrderCount() {
  return useQuery({
    queryKey: ['order-count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!merchant) return 0;

      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id);

      return count || 0;
    },
  });
}
