import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BCStore {
  id: string;
  store_hash: string;
  shop_domain: string;
  active: boolean;
  installed_at: string;
  scope: string;
}

export function useBigCommerce() {
  const [stores, setStores] = useState<BCStore[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const listStores = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bigcommerce-oauth', {
        body: { action: 'list_stores' },
      });
      if (error) throw error;
      setStores(data?.stores || []);
      return data?.stores || [];
    } catch (error) {
      console.error('Error listing BC stores:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const connectStore = async (params: {
    code: string;
    scope: string;
    store_hash: string;
    merchant_id: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('bigcommerce-oauth', {
        body: {
          action: 'oauth_callback',
          code: params.code,
          scope: params.scope,
          context: `stores/${params.store_hash}`,
          store_hash: params.store_hash,
          merchant_id: params.merchant_id,
        },
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error connecting BC store:', error);
      throw error;
    }
  };

  const processCheckout = async (params: {
    store_hash: string;
    order_id: string;
    amount: number;
    currency: string;
    customer_email?: string;
    card_details?: Record<string, string>;
    billing_details?: Record<string, string>;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('bigcommerce-checkout', {
        body: params,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error processing BC checkout:', error);
      throw error;
    }
  };

  return { stores, isLoading, listStores, connectStore, processCheckout };
}
