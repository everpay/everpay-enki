import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';
import { useAdminTransactionAnalytics } from '@/hooks/useAdminTransactionAnalytics';
import { DollarSign, CreditCard, Users, TrendingUp, Calendar as CalendarIcon, Download } from 'lucide-react';
import AdminVolumeChart from '@/components/admin/charts/AdminVolumeChart';
import AdminRevenueChart from '@/components/admin/charts/AdminRevenueChart';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AdminAnalytics() {
  const { data: analytics, isLoading } = useAdminTransactionAnalytics();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({ from: new Date(Date.now() - 30 * 86400000), to: new Date() });

  const exportData = () => {
    const csv = ["Metric,Value", `Total Revenue,$${analytics?.totalRevenue || 0}`, `Total Transactions,${analytics?.totalTransactions || 0}`, `Total Users,${analytics?.totalUsers || 0}`].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `analytics-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
  };

  const avgOrderValue = analytics && analytics.totalTransactions > 0 ? (analytics.totalRevenue / analytics.totalTransactions).toFixed(2) : '0.00';

  if (isLoading) return <AppLayout><div className="flex items-center justify-center min-h-[400px]">Loading analytics...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold tracking-tight">Admin Analytics</h1><p className="text-muted-foreground">Track performance metrics across all merchants</p></div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={exportData}><Download className="h-4 w-4 mr-2" />Export</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${analytics?.totalRevenue.toLocaleString() || '0'}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Transactions</CardTitle><CreditCard className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{analytics?.totalTransactions.toLocaleString() || '0'}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{analytics?.totalUsers.toLocaleString() || '0'}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg Order Value</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${avgOrderValue}</div></CardContent></Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardHeader><CardTitle>Transaction Volume</CardTitle></CardHeader><CardContent><AdminVolumeChart /></CardContent></Card>
          <Card><CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader><CardContent><AdminRevenueChart /></CardContent></Card>
        </div>
      </div>
    </AppLayout>
  );
}
