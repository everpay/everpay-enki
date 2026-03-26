import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Real-time order status tracking via Supabase Realtime.
 * Listens for postgres_changes on the transactions table filtered by provider_ref (Shopify order ID).
 */
export function useOrderStatus(orderId: string | null) {
  const [status, setStatus] = useState<string>('pending');
  const [transactionId, setTransactionId] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    // Initial fetch
    const fetchInitial = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('id, status')
        .or(`provider_ref.eq.shopify_draft_${orderId},provider_ref.eq.${orderId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setStatus(data.status || 'pending');
        setTransactionId(data.id);
      }
    };

    fetchInitial();

    // Real-time subscription
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          const newRow = payload.new as any;
          // Match by provider_ref containing the order ID
          if (
            newRow.provider_ref?.includes(orderId) ||
            newRow.id === transactionId
          ) {
            setStatus(newRow.status || 'pending');
            setTransactionId(newRow.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, transactionId]);

  return { status, transactionId };
}
