import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, Store, CheckCircle2, ArrowUpRight, ArrowDownRight, CreditCard, ArrowRightLeft, Wallet, CreditCard as CreditCardIcon } from 'lucide-react';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import AdminVolumeChart from '@/components/admin/charts/AdminVolumeChart';
import AdminRevenueChart from '@/components/admin/charts/AdminRevenueChart';
import AdminChargebackChart from '@/components/admin/charts/AdminChargebackChart';
import { LipadStatusPanel } from '@/components/admin/LipadStatusPanel';
import { useNavigate } from 'react-router-dom';

interface KPICardProps { title: string; value: string; change: string; trend: 'up' | 'down' | 'neutral'; icon: React.ElementType; description: string; }
const KPICard = ({ title, value, change, trend, icon: Icon, description }: KPICardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-primary" />}
        {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-destructive" />}
        <span className={trend === 'up' ? 'text-primary' : trend === 'down' ? 'text-destructive' : ''}>{change}</span>
        {' '}{description}
      </p>
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const { data, isLoading } = useAdminDashboardData();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        </div>
      </AppLayout>
    );
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const authRate = data && data.totalTransactions > 0
    ? ((data.totalTransactions - data.totalChargebacks) / data.totalTransactions * 100).toFixed(1)
    : '0';

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Payment orchestration overview and system health</p>
          </div>
          <Select defaultValue="30d">
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <KPICard title="Total Volume" value={fmt(data?.totalVolume || 0)} change={`${data?.totalTransactions || 0} txns`} trend="up" icon={DollarSign} description="Processing volume" />
          <KPICard title="Active Merchants" value={(data?.totalMerchants || 0).toString()} change={`of ${data?.totalUsers || 0} users`} trend="neutral" icon={Store} description="Onboarded merchants" />
          <KPICard title="Total Users" value={(data?.totalUsers || 0).toString()} change="" trend="neutral" icon={Users} description="All registered users" />
          <KPICard title="Auth Rate" value={`${authRate}%`} change="" trend="neutral" icon={CheckCircle2} description="Transaction approval" />
          <KPICard title="Crypto Commission" value={fmt(data?.cryptoTotalFees || 0)} change={`${data?.cryptoPaymentCount || 0} crypto txns`} trend="up" icon={Wallet} description="5% + $1.00 per txn" />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="health">PSP Health</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Transaction Volume</CardTitle>
                  <CardDescription>Daily transaction volume (last 30 days)</CardDescription>
                </CardHeader>
                <CardContent><AdminVolumeChart /></CardContent>
              </Card>
              <div className="lg:col-span-3 space-y-4">
                <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Revenue</p><h3 className="text-xl font-semibold mt-1">{fmt(data?.totalVolume || 0)}</h3><AdminRevenueChart /></CardContent></Card>
                <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Chargebacks & Refunds</p><h3 className="text-xl font-semibold mt-1">{fmt((data?.disputeAmount || 0) + (data?.refundAmount || 0))}</h3><AdminChargebackChart /></CardContent></Card>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Store, label: 'Merchants', href: '/enki/merchants' },
                      { icon: CreditCard, label: 'Payments', href: '/enki/payments' },
                      { icon: ArrowRightLeft, label: 'Routing', href: '/enki/payment-routing' },
                      { icon: Wallet, label: 'Treasury', href: '/enki/treasury' },
                    ].map(a => (
                      <Button key={a.label} variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate(a.href)}>
                        <a.icon className="h-5 w-5 text-primary" />
                        <span className="text-sm">{a.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">System Health</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {['ShieldHub', 'Mondo', 'Paygate10', 'Paygate10', 'Lipad.io', 'VGS Vault'].map(name => (
                    <div key={name} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="text-sm font-medium">{name}</span>
                      </div>
                      <Badge variant="default" className="text-xs">operational</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { name: 'ShieldHub', region: 'US/Global', type: 'gateway' },
                { name: 'Mondo', region: 'EU/UK', type: 'gateway' },
                { name: 'Paygate10', region: 'LATAM', type: 'gateway' },
                { name: 'Paygate10', region: 'India/BR/MX/PK', type: 'gateway' },
                { name: 'OFA', region: 'APAC', type: 'gateway' },
                { name: 'Moneto', region: 'Canada', type: 'wallet' },
                { name: 'Makapay', region: 'Bangladesh', type: 'gateway' },
              ].map(proc => (
                <Card key={proc.name}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-success" />
                        <span className="font-semibold">{proc.name}</span>
                      </div>
                      <Badge>active</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-muted-foreground">Type</p><p className="font-medium capitalize">{proc.type}</p></div>
                      <div><p className="text-muted-foreground">Region</p><p className="font-medium">{proc.region}</p></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="integrations" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LipadStatusPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
