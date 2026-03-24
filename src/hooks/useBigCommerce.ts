import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BCStore {
  id: string;
  store_hash: string;
  shop_domain: string;
  active: boolean;
  installed_at: string;
  scope: string;
  access_token?: string;
  webhook_registered?: boolean;
  uninstalled?: boolean;
  token_updated_at?: string;
}

interface BCConfig {
  id?: string;
  store_id: string;
  merchant_id?: string;
  everpay_public_key?: string;
  everpay_secret_encrypted?: string;
  test_mode: boolean;
  checkout_script_enabled: boolean;
  button_text: string;
  button_bg_color: string;
  button_text_color: string;
  header_text: string;
}

interface BCOrder {
  id: string;
  bc_order_id: string;
  amount: number;
  currency: string;
  status: string;
  transaction_id?: string;
  created_at: string;
}

interface BCWebhookLog {
  id: string;
  source: string;
  event_type: string;
  payload: any;
  processed: boolean;
  created_at: string;
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

  const getConfig = async (storeId: string): Promise<BCConfig | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('bigcommerce-oauth', {
        body: { action: 'get_config', store_id: storeId },
      });
      if (error) throw error;
      return data?.config || null;
    } catch (error) {
      console.error('Error getting BC config:', error);
      return null;
    }
  };

  const saveConfig = async (config: Partial<BCConfig> & { store_id: string }) => {
    try {
      const { data, error } = await supabase.functions.invoke('bigcommerce-oauth', {
        body: { action: 'save_config', ...config },
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving BC config:', error);
      throw error;
    }
  };

  const getOrders = async (storeId: string): Promise<BCOrder[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('bigcommerce-oauth', {
        body: { action: 'get_orders', store_id: storeId },
      });
      if (error) throw error;
      return data?.orders || [];
    } catch (error) {
      console.error('Error getting BC orders:', error);
      return [];
    }
  };

  const getWebhookLogs = async (storeId: string): Promise<BCWebhookLog[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('bigcommerce-oauth', {
        body: { action: 'get_webhook_logs', store_id: storeId },
      });
      if (error) throw error;
      return data?.logs || [];
    } catch (error) {
      console.error('Error getting BC webhook logs:', error);
      return [];
    }
  };

  const registerWebhooks = async (storeHash: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('bigcommerce-oauth', {
        body: { action: 'register_webhooks', store_hash: storeHash },
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error registering webhooks:', error);
      throw error;
    }
  };

  const refreshToken = async (storeHash: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('bigcommerce-oauth', {
        body: { action: 'refresh_token', store_hash: storeHash },
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error refreshing token:', error);
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

  return {
    stores,
    isLoading,
    listStores,
    connectStore,
    getConfig,
    saveConfig,
    getOrders,
    getWebhookLogs,
    registerWebhooks,
    refreshToken,
    processCheckout,
  };
}
