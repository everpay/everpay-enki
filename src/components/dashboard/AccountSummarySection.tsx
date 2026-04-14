import { Building, Wallet, ArrowUpRight } from 'lucide-react';
import { useAdminTransactionAnalytics } from '@/hooks/useAdminTransactionAnalytics';
import { ReactNode } from 'react';

interface AccountCardProps {
  title: string;
  amount: string;
  subtitle: string;
  icon: React.ElementType;
}

const AccountCard = ({ title, amount, subtitle, icon: Icon }: AccountCardProps) => (
  <div className="bg-card rounded-xl border p-4">
    <div className="flex justify-between">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
          <Icon className="h-3 w-3 text-primary" />
        </div>
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="text-xs text-muted-foreground">Last 30 days</p>
    </div>
    <div className="mt-3">
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-semibold">{amount}</h3>
        <span className="text-primary flex items-center text-xs">
          {subtitle} <ArrowUpRight className="ml-0.5 h-3 w-3" />
        </span>
      </div>
    </div>
  </div>
);

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const AccountSummarySection = () => {
  const { data } = useAdminTransactionAnalytics();
  const revenue = data?.totalVolume || 0;
  const refunds = data?.totalRefunds || 0;
  const chargebacks = data?.totalChargebacks || 0;
  const net = revenue - refunds - chargebacks;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <AccountCard title="Total Revenue" amount={fmt(revenue)} subtitle={`${data?.totalTransactions || 0} txns`} icon={Building} />
      <AccountCard title="Net Revenue" amount={fmt(net)} subtitle="+0%" icon={Wallet} />
      <AccountCard title="Chargebacks & Refunds" amount={fmt(refunds + chargebacks)} subtitle={`${data?.totalChargebacks || 0} items`} icon={Wallet} />
    </div>
  );
};

export default AccountSummarySection;
