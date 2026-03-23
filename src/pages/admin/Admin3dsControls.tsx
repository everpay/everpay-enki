import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Shield, Loader2, Search, AlertTriangle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Admin3dsControls() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: merchants, isLoading } = useQuery({
    queryKey: ['admin-merchants-3ds'],
    queryFn: async () => {
      const { data: merch, error } = await supabase
        .from('merchants')
        .select('id, name')
        .order('name');
      if (error) throw error;

      // Get 3DS settings for all merchants
      const { data: settings } = await supabase
        .from('merchant_3ds_settings')
        .select('*');

      const settingsMap = new Map((settings || []).map((s: any) => [s.merchant_id, s]));
      
      return merch.map((m: any) => ({
        ...m,
        threeds: settingsMap.get(m.id) || null,
      }));
    },
  });

  const handleToggle3ds = async (merchantId: string, currentSettings: any, field: string, value: any) => {
    try {
      if (!currentSettings) {
        // Create settings first
        const { error } = await supabase.from('merchant_3ds_settings').insert({
          merchant_id: merchantId,
          [field]: value,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('merchant_3ds_settings')
          .update({ [field]: value, updated_at: new Date().toISOString() })
          .eq('merchant_id', merchantId);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ['admin-merchants-3ds'] });
    } catch {
      toast.error('Failed to update 3DS settings');
    }
  };

  const handleThresholdChange = async (merchantId: string, currentSettings: any, field: string, value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;
    await handleToggle3ds(merchantId, currentSettings, field, numValue);
  };

  const filtered = merchants?.filter((m: any) =>
    !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">3D Secure Controls</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enable/disable 3DS per merchant. Auto-enables for high-risk merchants.</p>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search merchants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4">
          {filtered?.map((m: any) => {
            const s = m.threeds;
            const enabled = s?.enabled ?? true;
            const autoEnable = s?.auto_enable_high_risk ?? true;
            const riskThreshold = s?.risk_threshold ?? 70;
            const declineThreshold = s?.decline_threshold ?? 5;
            const skipIfProcessor = s?.skip_if_processor_3ds ?? true;

            return (
              <Card key={m.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{m.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={enabled ? 'default' : 'outline'}>
                        {enabled ? '3DS Active' : '3DS Off'}
                      </Badge>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(v) => handleToggle3ds(m.id, s, 'enabled', v)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={autoEnable}
                          onCheckedChange={(v) => handleToggle3ds(m.id, s, 'auto_enable_high_risk', v)}
                        />
                        <Label className="text-xs">Auto-enable high risk</Label>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Risk threshold</Label>
                      <Input
                        type="number"
                        value={riskThreshold}
                        onChange={(e) => handleThresholdChange(m.id, s, 'risk_threshold', e.target.value)}
                        className="h-8 text-xs"
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Decline threshold</Label>
                      <Input
                        type="number"
                        value={declineThreshold}
                        onChange={(e) => handleThresholdChange(m.id, s, 'decline_threshold', e.target.value)}
                        className="h-8 text-xs"
                        min={0}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={skipIfProcessor}
                          onCheckedChange={(v) => handleToggle3ds(m.id, s, 'skip_if_processor_3ds', v)}
                        />
                        <Label className="text-xs">Skip if PSP has 3DS</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
