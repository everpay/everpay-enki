import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface PaymentPollingOptions {
  transactionId: string | null;
  enabled?: boolean;
  intervalMs?: number;
  maxAttempts?: number;
  onComplete?: (status: string) => void;
  onFailed?: (status: string) => void;
}

interface PollingState {
  isPolling: boolean;
  currentStatus: string | null;
  attempts: number;
}

export function usePaymentPolling({
  transactionId,
  enabled = true,
  intervalMs = 3000,
  maxAttempts = 40, // ~2 minutes at 3s intervals
  onComplete,
  onFailed,
}: PaymentPollingOptions): PollingState & { startPolling: (txId: string) => void; stopPolling: () => void } {
  const [isPolling, setIsPolling] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const txIdRef = useRef<string | null>(transactionId);
  const queryClient = useQueryClient();

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const checkStatus = useCallback(async (txId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { transaction_id: txId },
      });

      if (error) {
        console.error('Polling error:', error);
        return null;
      }

      const status = data?.status;
      setCurrentStatus(status);

      if (status === 'completed') {
        stopPolling();
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        toast.success('Payment completed!', {
          description: `Transaction ${txId.slice(0, 8)} confirmed.`,
        });
        onComplete?.(status);
      } else if (status === 'failed') {
        stopPolling();
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        toast.error('Payment failed', {
          description: `Transaction ${txId.slice(0, 8)} was declined.`,
        });
        onFailed?.(status);
      }

      return status;
    } catch (err) {
      console.error('Polling check failed:', err);
      return null;
    }
  }, [stopPolling, queryClient, onComplete, onFailed]);

  const startPolling = useCallback((txId: string) => {
    txIdRef.current = txId;
    setAttempts(0);
    setIsPolling(true);
    setCurrentStatus('pending');

    // Immediate first check
    checkStatus(txId);

    intervalRef.current = setInterval(() => {
      setAttempts((prev) => {
        const next = prev + 1;
        if (next >= maxAttempts) {
          stopPolling();
          toast.warning('Status check timed out', {
            description: 'The transaction is still processing. Check the Transactions page for updates.',
          });
          return next;
        }
        checkStatus(txId);
        return next;
      });
    }, intervalMs);
  }, [checkStatus, intervalMs, maxAttempts, stopPolling]);

  // Auto-start when transactionId changes and enabled
  useEffect(() => {
    if (transactionId && enabled && !isPolling) {
      startPolling(transactionId);
    }
  }, [transactionId, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { isPolling, currentStatus, attempts, startPolling, stopPolling };
}
