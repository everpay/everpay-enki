import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { VolumeChart } from '@/components/VolumeChart';
import { TransactionTable } from '@/components/TransactionTable';
import { ActivityFeed } from '@/components/ActivityFeed';
import { ProviderAnalytics } from '@/components/ProviderAnalytics';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/format';
import { DollarSign, ArrowUpRight, ArrowLeftRight, Clock, Filter, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const { data: transactions = [], isLoading: loadingTx } = useTransactions();
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { data: profile } = useProfile();

  // Filters
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30d');

  // Derive filter options from data
  const allProviders = useMemo(() => [...new Set(transactions.map(tx => tx.provider))], [transactions]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (providerFilter !== 'all') {
      filtered = filtered.filter(tx => tx.provider === providerFilter);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter(tx => new Date(tx.created_at) >= cutoff);
    }

    return filtered;
  }, [transactions, providerFilter, statusFilter, dateRange]);

  const hasActiveFilters = providerFilter !== 'all' || statusFilter !== 'all' || dateRange !== '30d';

  const clearFilters = () => {
    setProviderFilter('all');
    setStatusFilter('all');
    setDateRange('30d');
  };

  // Calculate stats from filtered data
  const rates: Record<string, number> = { USD: 1, EUR: 1.08, GBP: 1.27, BRL: 0.195, MXN: 0.057, COP: 0.00024, CAD: 0.74 };
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance * (rates[a.currency] || 1), 0);

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const todayTransactions = filteredTransactions.filter(tx => tx.created_at.startsWith(today));
  const todayVolume = todayTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const yesterdayVolume = filteredTransactions.filter(tx => tx.created_at.startsWith(yesterdayStr)).reduce((sum, tx) => sum + tx.amount, 0);

  const balanceChange = yesterdayVolume > 0 ? ((todayVolume - yesterdayVolume) / yesterdayVolume * 100) : 0;
  const volumeChange = yesterdayVolume > 0 ? ((todayVolume - yesterdayVolume) / yesterdayVolume * 100) : 0;

  const pendingTransactions = filteredTransactions.filter(tx => ['pending', 'processing'].includes(tx.status));
  const pendingAmount = pendingTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const completedAmount = filteredTransactions.filter(tx => tx.status === 'completed').reduce((sum, tx) => sum + tx.amount, 0);
  const pendingChange = completedAmount > 0 ? ((pendingAmount - completedAmount) / completedAmount * 100) : 0;

  const providers = [...new Set(filteredTransactions.map(tx => tx.provider))];
  const firstName = profile?.display_name?.split(' ')[0] || 'there';

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hi, {firstName}! Here's an overview of your account
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filters:</span>
        </div>
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {allProviders.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Date Range" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1">
            <X className="h-3 w-3" />Clear
          </Button>
        )}
        {hasActiveFilters && (
          <Badge variant="secondary" className="text-xs">{filteredTransactions.length} of {transactions.length} transactions</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Balance"
          value={loadingAccounts ? '...' : formatCurrency(totalBalance, 'USD')}
          change={balanceChange !== 0 ? `${balanceChange > 0 ? '+' : ''}${balanceChange.toFixed(1)}%` : undefined}
          changeType={balanceChange > 0 ? "positive" : balanceChange < 0 ? "negative" : "neutral"}
          icon={DollarSign}
          subtitle="Across all currencies"
        />
        <StatCard
          title="Today's Volume"
          value={loadingTx ? '...' : formatCurrency(todayVolume, 'USD')}
          change={volumeChange !== 0 ? `${volumeChange > 0 ? '+' : ''}${volumeChange.toFixed(1)}%` : undefined}
          changeType={volumeChange > 0 ? "positive" : volumeChange < 0 ? "negative" : "neutral"}
          icon={ArrowUpRight}
          subtitle={`${todayTransactions.length} transactions`}
        />
        <StatCard
          title="Active Providers"
          value={loadingTx ? '...' : providers.length.toString()}
          icon={ArrowLeftRight}
          subtitle={providers.join(' · ') || 'No providers yet'}
        />
        <StatCard
          title="Pending Settlement"
          value={loadingTx ? '...' : formatCurrency(pendingAmount, 'USD')}
          change={pendingChange !== 0 ? `${pendingChange > 0 ? '+' : ''}${pendingChange.toFixed(1)}%` : undefined}
          changeType={pendingChange < 0 ? "positive" : pendingChange > 0 ? "negative" : "neutral"}
          icon={Clock}
          subtitle={`${pendingTransactions.length} transactions`}
        />
      </div>

      <div className="mb-6">
        <Tabs defaultValue="volume">
          <TabsList>
            <TabsTrigger value="volume">Volume Chart</TabsTrigger>
            <TabsTrigger value="providers">Provider Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="volume" className="mt-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <VolumeChart />
              </div>
              <ActivityFeed />
            </div>
          </TabsContent>
          <TabsContent value="providers" className="mt-4">
            <ProviderAnalytics />
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">Recent Transactions</h2>
          <a href="/transactions" className="text-sm text-primary hover:underline">View all →</a>
        </div>
        {loadingTx ? (
          <div className="flex items-center justify-center p-8 rounded-xl border border-border bg-card">
            <p className="text-muted-foreground">Loading transactions...</p>
          </div>
        ) : (
          <TransactionTable transactions={filteredTransactions.slice(0, 5)} compact />
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
