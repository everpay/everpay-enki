import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Building2, FileCheck, Clock, CheckCircle } from 'lucide-react';

const merchants = [
  { id: 'mrc_001', name: 'TechFlow Inc.', email: 'ops@techflow.com', status: 'Active', variant: 'default' as const, risk: 'Low', submitted: '2026-01-15' },
  { id: 'mrc_002', name: 'ShopWave Ltd.', email: 'admin@shopwave.co', status: 'KYC Review', variant: 'secondary' as const, risk: 'Medium', submitted: '2026-02-01' },
  { id: 'mrc_003', name: 'PayEase Corp.', email: 'hello@payease.io', status: 'Documents Pending', variant: 'outline' as const, risk: '—', submitted: '2026-02-10' },
  { id: 'mrc_004', name: 'GlobalTrade AG', email: 'info@globaltrade.de', status: 'Active', variant: 'default' as const, risk: 'Low', submitted: '2026-01-20' },
  { id: 'mrc_005', name: 'QuickSell PTE', email: 'team@quicksell.sg', status: 'Rejected', variant: 'destructive' as const, risk: 'High', submitted: '2026-02-05' },
];

const steps = ['Sign Up', 'Business Profile', 'Documents', 'KYC Review', 'Approval', 'Activated'];

export default function MerchantOnboardingAdmin() {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Merchant Onboarding</h1>
        <p className="mt-1 text-sm text-muted-foreground">Automated registration and verification workflow</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Merchants" value="1,247" change="+24 this week" icon={<Building2 className="w-5 h-5" />} />
        <StatCard label="Pending Review" value="38" icon={<Clock className="w-5 h-5" />} />
        <StatCard label="Approved (30d)" value="142" change="+18% MoM" icon={<CheckCircle className="w-5 h-5" />} />
        <StatCard label="Avg. Onboarding" value="2.4 days" change="-0.8 days" icon={<FileCheck className="w-5 h-5" />} />
      </div>

      {/* Onboarding Pipeline */}
      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <h3 className="text-lg font-semibold mb-6">Onboarding Pipeline</h3>
        <div className="flex items-center gap-2">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < 4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {i + 1}
                </div>
                <span className="text-xs text-muted-foreground mt-2 text-center">{step}</span>
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 flex-1 ${i < 3 ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Merchants Table */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-6">Merchants</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Merchant</th>
                <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Risk</th>
                <th className="text-right pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-4">
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </td>
                  <td className="py-4"><Badge variant={m.variant}>{m.status}</Badge></td>
                  <td className="py-4 text-sm">{m.risk}</td>
                  <td className="py-4 text-sm text-muted-foreground text-right">{m.submitted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
