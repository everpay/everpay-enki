import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SystemStats {
  totalUsers: number;
  totalMerchants: number;
  totalTransactions: number;
  totalVolume: number;
  totalRefunds: number;
  totalDisputes: number;
  totalChargebacks: number;
  refundAmount: number;
  disputeAmount: number;
  cryptoCommissionRevenue: number;
  cryptoFlatFeeRevenue: number;
  cryptoTotalFees: number;
  cryptoPaymentCount: number;
}

export function useAdminDashboardData() {
  return useQuery({
    queryKey: ['admin-dashboard-data'],
    queryFn: async (): Promise<SystemStats> => {
      const [profilesRes, merchantsRes, txnsRes, refundsRes, disputesRes, cryptoRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('merchants').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('id, amount, status').limit(1000),
        supabase.from('refunds').select('id, amount, status').limit(1000),
        supabase.from('disputes').select('id, amount, status').limit(1000),
        supabase.from('elektropay_payments' as any).select('commission_amount, flat_fee, total_fees, status').limit(1000),
      ]);

      const txns = txnsRes.data || [];
      const refunds = refundsRes.data || [];
      const disputes = disputesRes.data || [];
      const cryptoPayments = (cryptoRes.data || []) as any[];

      const completedTxns = txns.filter(t => t.status === 'completed');
      const totalVolume = completedTxns.reduce((s, t) => s + Number(t.amount), 0);
      const refundAmount = refunds.reduce((s, r) => s + Number(r.amount), 0);
      const disputeAmount = disputes.reduce((s, d) => s + Number(d.amount), 0);

      const cryptoCommissionRevenue = cryptoPayments.reduce((s, p) => s + Number(p.commission_amount || 0), 0);
      const cryptoFlatFeeRevenue = cryptoPayments.reduce((s, p) => s + Number(p.flat_fee || 0), 0);
      const cryptoTotalFees = cryptoPayments.reduce((s, p) => s + Number(p.total_fees || 0), 0);

      return {
        totalUsers: profilesRes.count || 0,
        totalMerchants: merchantsRes.count || 0,
        totalTransactions: txns.length,
        totalVolume,
        totalRefunds: refunds.length,
        totalDisputes: disputes.length,
        totalChargebacks: disputes.filter(d => d.status === 'chargeback' || d.status === 'open').length,
        refundAmount,
        disputeAmount,
        cryptoCommissionRevenue,
        cryptoFlatFeeRevenue,
        cryptoTotalFees,
        cryptoPaymentCount: cryptoPayments.length,
      };
    },
    staleTime: 30_000,
  });
}
