import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/routing-maestro/StatCard";
import { RoutingChain, RoutingStep } from "@/components/routing-maestro/RoutingChain";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { processors, merchants, routingRules, performanceHistory } from "@/lib/routing-maestro/mock-data";
import { GitBranch, Shield, Activity, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const recentRouting: { merchant: string; amount: string; steps: RoutingStep[] }[] = [
  { merchant: "TechCorp Inc.", amount: "$2,450.00", steps: [{ processor: "Stripe", status: "success", latency: 210 }] },
  { merchant: "ShopMax Global", amount: "$8,900.00", steps: [
    { processor: "Adyen", status: "failed", latency: 340, reason: "Timeout" },
    { processor: "Stripe", status: "success", latency: 195 },
  ]},
  { merchant: "GameVault Studios", amount: "$150.00", steps: [
    { processor: "Stripe", status: "failed", latency: 500, reason: "Rate limit" },
    { processor: "Checkout.com", status: "failed", latency: 310, reason: "Declined" },
    { processor: "Worldpay", status: "success", latency: 380 },
  ]},
];

export default function RoutingMaestroDashboard() {
  const activeProcessors = processors.filter(p => p.enabled).length;
  const activeRules = routingRules.filter(r => r.enabled).length;
  const overriddenMerchants = merchants.filter(m => m.overrideEnabled).length;
  const avgSuccess = (processors.reduce((a, p) => a + p.successRate, 0) / processors.length).toFixed(1);
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Routing Maestro — Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time overview of payment routing orchestration</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Processors" value={`${activeProcessors}`} change={`${processors.length} total configured`} icon={Activity} />
          <StatCard title="Avg Success Rate" value={`${avgSuccess}%`} change="+0.3% vs last month" changeType="positive" icon={TrendingUp} />
          <StatCard title="Active Rules" value={`${activeRules}`} change={`${routingRules.length} total rules`} icon={Shield} />
          <StatCard title="Admin Overrides" value={`${overriddenMerchants}`} change={`${merchants.length} merchants total`} icon={GitBranch} />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Processor Success Rate Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis domain={[90, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="stripe" stroke="hsl(230, 80%, 56%)" name="Stripe" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="adyen" stroke="hsl(142, 71%, 45%)" name="Adyen" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="checkout" stroke="hsl(38, 92%, 50%)" name="Checkout.com" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="worldpay" stroke="hsl(0, 72%, 51%)" name="Worldpay" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Processor Status</h3>
            <div className="space-y-3">
              {processors.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${p.enabled ? 'bg-success' : 'bg-muted-foreground'}`} />
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{p.successRate}%</span>
                    <Badge variant={p.enabled ? 'default' : 'secondary'} className="text-xs">{p.enabled ? 'Active' : 'Off'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Routing Decisions</h3>
          <div className="space-y-4">
            {recentRouting.map((r, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-4">
                <div className="min-w-[160px]">
                  <p className="text-sm font-medium text-foreground">{r.merchant}</p>
                  <p className="text-xs font-mono text-muted-foreground">{r.amount}</p>
                </div>
                <RoutingChain steps={r.steps} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
