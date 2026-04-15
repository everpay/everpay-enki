import { useQuery } from '@tanstack/react-query';
import { extSelect, externalProxy } from '@/hooks/useExternalData';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, eachDayOfInterval, subDays } from 'date-fns';

interface MonthlyData { month: string; revenue: number; refunds: number; chargebacks: number; count: number; }
interface DailyData { date: string; volume: number; count: number; }

interface TransactionAnalytics {
  monthlyData: MonthlyData[];
  dailyData: DailyData[];
  totalRevenue: number;
  totalTransactions: number;
  totalRefunds: number;
  totalChargebacks: number;
  totalUsers: number;
  chargebackAmount: number;
  refundAmount: number;
}

export function useAdminTransactionAnalytics() {
  return useQuery({
    queryKey: ['admin-transaction-analytics'],
    queryFn: async (): Promise<TransactionAnalytics> => {
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 6);
      const thirtyDaysAgo = subDays(now, 30);

      const [allTxnsRes, refundsRes, disputesRes, usersRes] = await Promise.allSettled([
        extSelect('transactions', { select: 'id, amount, status, created_at', order: { column: 'created_at', ascending: true }, limit: 5000 }),
        extSelect('refunds', { select: 'id, amount, status, created_at', limit: 5000 }),
        extSelect('disputes', { select: 'id, amount, status, created_at', limit: 5000 }),
        externalProxy({ action: 'list_users' }),
      ]);

      const allTxns = allTxnsRes.status === 'fulfilled' ? allTxnsRes.value : [];
      const refunds = refundsRes.status === 'fulfilled' ? refundsRes.value : [];
      const disputes = disputesRes.status === 'fulfilled' ? disputesRes.value : [];
      const users = usersRes.status === 'fulfilled' ? (usersRes.value.data || []) : [];
      const txns = allTxns.filter((t: any) => t.status === 'completed');

      const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });
      const monthlyData: MonthlyData[] = months.map((month: Date) => {
        const ms = startOfMonth(month); const me = endOfMonth(month);
        const mTxns = txns.filter((t: any) => { const d = new Date(t.created_at); return d >= ms && d <= me; });
        const mRefunds = refunds.filter((r: any) => { const d = new Date(r.created_at); return d >= ms && d <= me; });
        const mDisputes = disputes.filter((d2: any) => { const d = new Date(d2.created_at); return d >= ms && d <= me; });
        return {
          month: format(month, 'MMM'),
          revenue: mTxns.reduce((s: number, t: any) => s + Number(t.amount), 0),
          refunds: mRefunds.reduce((s: number, r: any) => s + Number(r.amount), 0),
          chargebacks: mDisputes.reduce((s: number, d2: any) => s + Number(d2.amount), 0),
          count: mTxns.length,
        };
      });

      const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
      const dailyData: DailyData[] = days.map((day: Date) => {
        const ds = new Date(day); ds.setHours(0, 0, 0, 0);
        const de = new Date(day); de.setHours(23, 59, 59, 999);
        const dTxns = txns.filter((t: any) => { const d = new Date(t.created_at); return d >= ds && d <= de; });
        return { date: format(day, 'MMM d'), volume: dTxns.reduce((s: number, t: any) => s + Number(t.amount), 0), count: dTxns.length };
      });

      return {
        monthlyData, dailyData,
        totalRevenue: txns.reduce((s: number, t: any) => s + Number(t.amount), 0),
        totalTransactions: allTxns.length,
        totalRefunds: refunds.length,
        totalChargebacks: disputes.length,
        totalUsers: users.length,
        chargebackAmount: disputes.reduce((s: number, d2: any) => s + Number(d2.amount), 0),
        refundAmount: refunds.reduce((s: number, r: any) => s + Number(r.amount), 0),
      };
    },
    staleTime: 60_000,
  });
}
