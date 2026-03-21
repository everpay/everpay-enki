import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

      const [txnsRes, refundsRes, disputesRes, profilesRes] = await Promise.all([
        supabase.from('transactions').select('id, amount, status, created_at')
          .gte('created_at', sixMonthsAgo.toISOString()).order('created_at', { ascending: true }),
        supabase.from('refunds').select('id, amount, status, created_at')
          .gte('created_at', sixMonthsAgo.toISOString()),
        supabase.from('disputes').select('id, amount, status, created_at')
          .gte('created_at', sixMonthsAgo.toISOString()),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      const txns = (txnsRes.data || []).filter(t => t.status === 'completed');
      const refunds = refundsRes.data || [];
      const disputes = disputesRes.data || [];

      const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });
      const monthlyData: MonthlyData[] = months.map(month => {
        const ms = startOfMonth(month); const me = endOfMonth(month);
        const mTxns = txns.filter(t => { const d = new Date(t.created_at); return d >= ms && d <= me; });
        const mRefunds = refunds.filter(r => { const d = new Date(r.created_at); return d >= ms && d <= me; });
        const mDisputes = disputes.filter(d2 => { const d = new Date(d2.created_at); return d >= ms && d <= me; });
        return {
          month: format(month, 'MMM'),
          revenue: mTxns.reduce((s, t) => s + Number(t.amount), 0),
          refunds: mRefunds.reduce((s, r) => s + Number(r.amount), 0),
          chargebacks: mDisputes.reduce((s, d2) => s + Number(d2.amount), 0),
          count: mTxns.length,
        };
      });

      const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
      const dailyData: DailyData[] = days.map(day => {
        const ds = new Date(day); ds.setHours(0, 0, 0, 0);
        const de = new Date(day); de.setHours(23, 59, 59, 999);
        const dTxns = txns.filter(t => { const d = new Date(t.created_at); return d >= ds && d <= de; });
        return { date: format(day, 'MMM d'), volume: dTxns.reduce((s, t) => s + Number(t.amount), 0), count: dTxns.length };
      });

      return {
        monthlyData, dailyData,
        totalRevenue: txns.reduce((s, t) => s + Number(t.amount), 0),
        totalTransactions: txnsRes.data?.length || 0,
        totalRefunds: refunds.length,
        totalChargebacks: disputes.length,
        totalUsers: profilesRes.count || 0,
        chargebackAmount: disputes.reduce((s, d2) => s + Number(d2.amount), 0),
        refundAmount: refunds.reduce((s, r) => s + Number(r.amount), 0),
      };
    },
    staleTime: 60_000,
  });
}
