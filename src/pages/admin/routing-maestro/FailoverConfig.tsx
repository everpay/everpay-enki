import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { processors } from "@/lib/routing-maestro/mock-data";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface RetryConfig { processorId: string; processorName: string; maxRetries: number; retryDelay: number; enabled: boolean; }
interface FallbackChain { id: string; name: string; processors: string[]; enabled: boolean; }

export default function RoutingMaestroFailoverConfig() {
  const [retryConfigs, setRetryConfigs] = useState<RetryConfig[]>(
    processors.map(p => ({ processorId: p.id, processorName: p.name, maxRetries: 3, retryDelay: 1000, enabled: true }))
  );
  const [fallbackChains, setFallbackChains] = useState<FallbackChain[]>([
    { id: 'fc1', name: 'Primary Chain', processors: ['Stripe', 'Adyen', 'Checkout.com'], enabled: true },
    { id: 'fc2', name: 'EU Fallback', processors: ['Adyen', 'Worldpay', 'Stripe'], enabled: true },
    { id: 'fc3', name: 'Low-value Chain', processors: ['Checkout.com', 'Braintree'], enabled: false },
  ]);
  const [globalMaxRetries, setGlobalMaxRetries] = useState(3);
  const [globalRetryDelay, setGlobalRetryDelay] = useState(1000);
  const updateRetryConfig = (id: string, field: keyof RetryConfig, value: any) =>
    setRetryConfigs(p => p.map(c => c.processorId === id ? { ...c, [field]: value } : c));
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Failover & Retry</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure global retry rules and fallback chains</p>
          </div>
          <Button onClick={() => toast.success("Configuration saved")}><Save className="h-4 w-4 mr-2" />Save All</Button>
        </div>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Global Retry Settings</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Max Retries (Global Default)</label>
              <div className="flex items-center gap-4 mt-2">
                <Slider value={[globalMaxRetries]} onValueChange={([v]) => setGlobalMaxRetries(v)} max={5} min={0} step={1} className="flex-1" />
                <span className="text-sm font-mono font-semibold text-foreground w-8">{globalMaxRetries}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Retry Delay (ms)</label>
              <div className="flex items-center gap-4 mt-2">
                <Slider value={[globalRetryDelay]} onValueChange={([v]) => setGlobalRetryDelay(v)} max={5000} min={100} step={100} className="flex-1" />
                <span className="text-sm font-mono font-semibold text-foreground w-16">{globalRetryDelay}ms</span>
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Per-Processor Retry Configuration</h3>
          <div className="space-y-3">
            {retryConfigs.map(config => (
              <div key={config.processorId} className="flex items-center gap-4 rounded-lg border p-4">
                <div className="min-w-[120px]"><span className="text-sm font-medium text-foreground">{config.processorName}</span></div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Retries:</span>
                    <Slider value={[config.maxRetries]} onValueChange={([v]) => updateRetryConfig(config.processorId, 'maxRetries', v)} max={5} min={0} step={1} className="flex-1" disabled={!config.enabled} />
                    <span className="text-xs font-mono text-foreground w-4">{config.maxRetries}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Delay:</span>
                    <Slider value={[config.retryDelay]} onValueChange={([v]) => updateRetryConfig(config.processorId, 'retryDelay', v)} max={5000} min={100} step={100} className="flex-1" disabled={!config.enabled} />
                    <span className="text-xs font-mono text-foreground w-14">{config.retryDelay}ms</span>
                  </div>
                </div>
                <Switch checked={config.enabled} onCheckedChange={(v) => updateRetryConfig(config.processorId, 'enabled', v)} />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Fallback Chains</h3>
          <div className="space-y-3">
            {fallbackChains.map(chain => (
              <div key={chain.id} className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{chain.name}</span>
                    {!chain.enabled && <span className="text-xs text-muted-foreground">(disabled)</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    {chain.processors.map((proc, i) => (
                      <span key={i} className="flex items-center gap-1.5">
                        {i > 0 && <span className="text-xs text-muted-foreground">→</span>}
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground">{proc}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <Switch checked={chain.enabled} onCheckedChange={(v) => setFallbackChains(p => p.map(c => c.id === chain.id ? { ...c, enabled: v } : c))} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
