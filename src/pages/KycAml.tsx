import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const kycProfiles = [
  { id: 'kyc_001', merchant: 'TechFlow Inc.', idVerification: 'Passed', sanctions: 'Clear', pep: 'Clear', status: 'Approved', variant: 'default' as const },
  { id: 'kyc_002', merchant: 'ShopWave Ltd.', idVerification: 'Passed', sanctions: 'Clear', pep: 'Review', status: 'Under Review', variant: 'secondary' as const },
  { id: 'kyc_003', merchant: 'PayEase Corp.', idVerification: 'Pending', sanctions: '—', pep: '—', status: 'Pending', variant: 'outline' as const },
  { id: 'kyc_004', merchant: 'QuickSell PTE', idVerification: 'Failed', sanctions: 'Match', pep: 'Match', status: 'Flagged', variant: 'destructive' as const },
  { id: 'kyc_005', merchant: 'NordicPay AS', idVerification: 'Passed', sanctions: 'Clear', pep: 'Clear', status: 'Under Review', variant: 'secondary' as const },
];

const amlFlags = [
  { id: 'aml_001', merchant: 'QuickSell PTE', type: 'Sanctions Match', severity: 'Critical', date: '2026-02-05' },
  { id: 'aml_002', merchant: 'Unknown Corp', type: 'Unusual Activity', severity: 'High', date: '2026-02-08' },
  { id: 'aml_003', merchant: 'ShopWave Ltd.', type: 'PEP Association', severity: 'Medium', date: '2026-02-10' },
];

export default function KycAml() {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">KYC / AML Engine</h1>
        <p className="mt-1 text-sm text-muted-foreground">Compliance pipeline for merchant verification</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Profiles" value="1,247" icon={Shield} />
        <StatCard title="Approved" value="1,089" change="87.3%" icon={CheckCircle} />
        <StatCard title="Under Review" value="120" icon={AlertTriangle} />
        <StatCard title="Flagged" value="38" change="3.0%" icon={XCircle} />
      </div>

      {/* KYC Profiles */}
      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <h3 className="text-lg font-semibold mb-6">KYC Profiles</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Merchant</th>
                <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">ID Verification</th>
                <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sanctions</th>
                <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">PEP Check</th>
                <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {kycProfiles.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-4 font-medium">{p.merchant}</td>
                  <td className="py-4 text-sm">{p.idVerification}</td>
                  <td className="py-4 text-sm">{p.sanctions}</td>
                  <td className="py-4 text-sm">{p.pep}</td>
                  <td className="py-4"><Badge variant={p.variant}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AML Flags */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-6">AML Alerts</h3>
        <div className="space-y-3">
          {amlFlags.map((flag) => (
            <div key={flag.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-4">
                <AlertTriangle className={`w-5 h-5 ${flag.severity === 'Critical' ? 'text-destructive' : flag.severity === 'High' ? 'text-amber-500' : 'text-blue-500'}`} />
                <div>
                  <p className="font-medium">{flag.merchant}</p>
                  <p className="text-sm text-muted-foreground">{flag.type}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={flag.severity === 'Critical' ? 'destructive' : 'secondary'}>{flag.severity}</Badge>
                <p className="text-xs text-muted-foreground mt-1">{flag.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
