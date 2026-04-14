import { Plus, Send, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminTransactionAnalytics } from '@/hooks/useAdminTransactionAnalytics';

const TotalBalanceCard = () => {
  const { data } = useAdminTransactionAnalytics();
  const totalVolume = data?.totalRevenue || 0;
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalVolume);

  return (
    <div className="bg-primary rounded-2xl p-5">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <p className="text-primary-foreground/70 text-sm mb-1">Total Balance</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-semibold text-primary-foreground">{formatted}</h2>
            <span className="text-primary-foreground/60 text-sm">{data?.totalTransactions || 0} txns</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary"><Plus className="mr-1 h-4 w-4" /> Add</Button>
          <Button size="sm" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"><Send className="mr-1 h-4 w-4" /> Send</Button>
          <Button size="sm" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"><Wallet className="mr-1 h-4 w-4" /> Request</Button>
        </div>
      </div>
    </div>
  );
};

export default TotalBalanceCard;
