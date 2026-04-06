import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2 } from 'lucide-react';

export default function ThreeDSecureSettings() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">3D Secure</h1>
          <p className="text-sm text-muted-foreground mt-1">3DS authentication is managed natively by your payment processor</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">3DS Handled by ShieldHub</h3>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Your ShieldHub MID has 3D Secure enabled at the processor level. All card transactions are automatically protected with 3DS2 authentication — no additional configuration is needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">What this means</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> 3DS challenges are handled directly by the processor during card authorization</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> Liability shift is automatic for authenticated transactions</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> SCA compliance (PSD2) is enforced at the gateway level</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> No client-side 3DS modal or redirect is required</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
