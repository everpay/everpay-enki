import { useEffect, useState } from 'react';
import { CreditCard, Building, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ActivityItem {
  id: string;
  name: string;
  description: string;
  amount: string;
  status: 'success' | 'pending';
  method: string;
  methodIcon: 'card' | 'bank';
}

const ActivityRow = ({ name, description, amount, status, method, methodIcon }: ActivityItem) => (
  <tr className="border-b border-border">
    <td className="py-3">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
          <ArrowUpRight className="h-3 w-3 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </td>
    <td className="py-3 text-sm">{amount}</td>
    <td className="py-3">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
        {status === 'success' ? 'Success' : 'Pending'}
      </span>
    </td>
    <td className="py-3">
      <div className="flex items-center gap-1 text-sm">
        {methodIcon === 'card' ? <CreditCard className="h-3 w-3 text-muted-foreground" /> : <Building className="h-3 w-3 text-muted-foreground" />}
        <span>{method}</span>
      </div>
    </td>
  </tr>
);

const RecentActivitySection = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => { fetchRecent(); }, []);

  const fetchRecent = async () => {
    const { data: txData } = await supabase
      .from('transactions')
      .select('id, amount, currency, status, payment_method, created_at, customer_email')
      .order('created_at', { ascending: false })
      .limit(10);

    const items: ActivityItem[] = (txData || []).map(tx => ({
      id: tx.id,
      name: tx.customer_email || 'Payment',
      description: `Transaction · ${format(new Date(tx.created_at), 'dd MMM yyyy')}`,
      amount: `$${parseFloat(String(tx.amount || 0)).toLocaleString()}`,
      status: (tx.status === 'succeeded' || tx.status === 'completed' || tx.status === 'settled') ? 'success' as const : 'pending' as const,
      method: tx.payment_method || 'Card',
      methodIcon: (tx.payment_method?.includes('bank') ? 'bank' : 'card') as 'card' | 'bank',
    }));

    setActivities(items);
  };

  return (
    <div className="bg-card rounded-xl border">
      <div className="flex justify-between items-center p-4 border-b border-border">
        <h3 className="font-medium">Recent Activity</h3>
      </div>
      <div className="p-4">
        {activities.length === 0 ? (
          <p className="text-center py-4 text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Method</th>
              </tr>
            </thead>
            <tbody>{activities.map(a => <ActivityRow key={a.id} {...a} />)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RecentActivitySection;
