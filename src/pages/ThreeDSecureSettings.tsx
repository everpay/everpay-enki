import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Loader2, AlertTriangle, CheckCircle2, Fingerprint, Globe } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ThreeDSecureSettings() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['merchant-3ds-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('No merchant');

      const { data: settings } = await supabase
        .from('merchant_3ds_settings')
        .select('*')
        .eq('merchant_id', merchant.id)
        .maybeSingle();

      // Get transaction stats for 3DS overview
      const { data: txns } = await supabase
        .from('transactions')
        .select('id, status, metadata')
        .eq('merchant_id', merchant.id)
        .limit(500);

      return {
        merchantId: merchant.id,
        settings: settings || null,
        totalTxns: txns?.length || 0,
      };
    },
  });

  const updateSetting = async (field: string, value: any) => {
    if (!data?.merchantId) return;
    try {
      if (!data.settings) {
        const { error } = await supabase.from('merchant_3ds_settings').insert({
          merchant_id: data.merchantId,
          [field]: value,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('merchant_3ds_settings')
          .update({ [field]: value, updated_at: new Date().toISOString() })
          .eq('merchant_id', data.merchantId);
        if (error) throw error;
      }
      toast.success('3DS setting updated');
      queryClient.invalidateQueries({ queryKey: ['merchant-3ds-settings'] });
    } catch {
      toast.error('Failed to update');
    }
  };

  const s = data?.settings;
  const enabled = s?.enabled ?? true;
  const autoEnable = s?.auto_enable_high_risk ?? true;
  const riskThreshold = s?.risk_threshold ?? 70;
  const declineThreshold = s?.decline_threshold ?? 5;
  const skipIfProcessor = s?.skip_if_processor_3ds ?? true;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">3D Secure Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure 3DS authentication for your payment flows</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <Tabs defaultValue="settings" className="space-y-4">
            <TabsList>
              <TabsTrigger value="settings">Configuration</TabsTrigger>
              <TabsTrigger value="overview">How It Works</TabsTrigger>
              <TabsTrigger value="statuses">Verification Statuses</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-4">
              {/* Master toggle */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">3D Secure Authentication</h3>
                        <p className="text-sm text-muted-foreground">Enable 3DS for card transactions to reduce fraud and shift liability</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={enabled ? 'default' : 'secondary'}>{enabled ? 'Active' : 'Disabled'}</Badge>
                      <Switch checked={enabled} onCheckedChange={(v) => updateSetting('enabled', v)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Settings grid */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Auto-Enable for High Risk</CardTitle>
                    <CardDescription className="text-xs">Automatically trigger 3DS for high-risk transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Switch checked={autoEnable} onCheckedChange={(v) => updateSetting('auto_enable_high_risk', v)} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Skip if Processor Handles 3DS</CardTitle>
                    <CardDescription className="text-xs">Defer to processor's native 3DS implementation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Switch checked={skipIfProcessor} onCheckedChange={(v) => updateSetting('skip_if_processor_3ds', v)} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Risk Score Threshold</CardTitle>
                    <CardDescription className="text-xs">Trigger 3DS when risk score exceeds this value (0–100)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      type="number"
                      value={riskThreshold}
                      min={0}
                      max={100}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (!isNaN(v) && v >= 0 && v <= 100) updateSetting('risk_threshold', v);
                      }}
                      className="max-w-[120px]"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Decline Threshold</CardTitle>
                    <CardDescription className="text-xs">Auto-decline after this many 3DS failures</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      type="number"
                      value={declineThreshold}
                      min={0}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (!isNaN(v) && v >= 0) updateSetting('decline_threshold', v);
                      }}
                      className="max-w-[120px]"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* SCA Exemptions info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> SCA Exemptions</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>Everpay automatically requests exemptions when applicable:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { code: 'low_value', label: 'Low-value', desc: 'Transactions under €30 EUR' },
                      { code: 'low_risk', label: 'TRA', desc: 'Transaction Risk Analysis (low fraud rate)' },
                      { code: 'trusted_beneficiary', label: 'Trusted', desc: 'Customer whitelisted merchant' },
                      { code: 'merchant_initiated', label: 'MIT', desc: 'Merchant-initiated recurring charges' },
                    ].map(ex => (
                      <div key={ex.code} className="flex items-start gap-2 border rounded-lg px-3 py-2">
                        <Badge variant="outline" className="text-[10px] font-mono mt-0.5">{ex.code}</Badge>
                        <div><span className="text-xs font-medium text-foreground">{ex.label}</span><p className="text-[11px]">{ex.desc}</p></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> How 3DS Works</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-4">
                  <p>When a payment requires 3DS authentication, Everpay returns a <code className="text-xs bg-muted px-1 py-0.5 rounded">requires_action</code> status with a redirect URL.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { step: '1', title: 'Create Payment', desc: 'Submit payment. Risk engine evaluates.' },
                      { step: '2', title: '3DS Challenge', desc: 'If required, customer redirected to bank.' },
                      { step: '3', title: 'Confirm', desc: 'After authentication, confirm the payment.' },
                    ].map(s => (
                      <div key={s.step} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2"><Badge variant="outline" className="text-xs">{s.step}</Badge><span className="font-medium text-foreground">{s.title}</span></div>
                        <p className="text-xs">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Fingerprint className="h-5 w-5 text-primary" /> 3DS Versions</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 space-y-2">
                      <span className="font-medium text-foreground">3D Secure 1.0</span>
                      <p className="text-xs">Legacy protocol. Full-page redirect. Higher friction.</p>
                    </div>
                    <div className="border rounded-lg p-4 space-y-2">
                      <span className="font-medium text-foreground">3D Secure 2.0</span>
                      <p className="text-xs">Modern protocol. Frictionless flow with browser data. Higher conversion.</p>
                      <Badge className="text-xs bg-primary/10 text-primary border-0">Recommended</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statuses" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Verification Statuses</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { code: 'Y', label: 'Authenticated', desc: 'Fully authenticated. Liability shifts to issuer.', color: 'bg-emerald-500/10 text-emerald-600' },
                    { code: 'A', label: 'Attempted', desc: 'Authentication attempted. Partial liability shift.', color: 'bg-amber-500/10 text-amber-600' },
                    { code: 'N', label: 'Not Authenticated', desc: 'Failed authentication. No liability shift.', color: 'bg-destructive/10 text-destructive' },
                    { code: 'U', label: 'Unavailable', desc: '3DS not available. Proceed at merchant risk.', color: 'bg-muted text-muted-foreground' },
                    { code: 'R', label: 'Rejected', desc: 'Issuer rejected. Do not proceed.', color: 'bg-primary/10 text-primary' },
                  ].map(s => (
                    <div key={s.code} className="flex items-start gap-3 border rounded-lg px-4 py-3">
                      <Badge className={`text-xs border-0 mt-0.5 ${s.color}`}>{s.code}</Badge>
                      <div>
                        <span className="text-xs font-medium text-foreground">{s.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
