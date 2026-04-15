import { useQuery } from '@tanstack/react-query';
import { extSelect, externalProxy } from '@/hooks/useExternalData';

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
      const [usersRes, merchantsRes, txns, refunds, disputes, cryptoPayments] = await Promise.all([
        externalProxy({ action: 'list_users' }),
        externalProxy({ action: 'list_merchants_full' }),
        extSelect('transactions', { select: 'id, amount, status', limit: 5000 }),
        extSelect('refunds', { select: 'id, amount, status', limit: 5000 }),
        extSelect('disputes', { select: 'id, amount, status', limit: 5000 }),
        extSelect('elektropay_payments', { select: 'commission_amount, flat_fee, total_fees, status', limit: 5000 }),
      ]);

      const users = usersRes.data || [];
      const merchants = merchantsRes.data || [];

      const completedTxns = txns.filter((t: any) => t.status === 'completed');
      const totalVolume = completedTxns.reduce((s: number, t: any) => s + Number(t.amount), 0);
      const refundAmount = refunds.reduce((s: number, r: any) => s + Number(r.amount), 0);
      const disputeAmount = disputes.reduce((s: number, d: any) => s + Number(d.amount), 0);

      const cryptoCommissionRevenue = cryptoPayments.reduce((s: number, p: any) => s + Number(p.commission_amount || 0), 0);
      const cryptoFlatFeeRevenue = cryptoPayments.reduce((s: number, p: any) => s + Number(p.flat_fee || 0), 0);
      const cryptoTotalFees = cryptoPayments.reduce((s: number, p: any) => s + Number(p.total_fees || 0), 0);

      return {
        totalUsers: users.length,
        totalMerchants: merchants.length,
        totalTransactions: txns.length,
        totalVolume,
        totalRefunds: refunds.length,
        totalDisputes: disputes.length,
        totalChargebacks: disputes.filter((d: any) => d.status === 'chargeback' || d.status === 'open').length,
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
