import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { processors as procSeed } from "@/lib/routing-maestro/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";

export default function RoutingMaestroProcessorPerformance() {
  const [procs, setProcs] = useState(procSeed);
  const toggleProcessor = (id: string) => { setProcs(p => p.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x)); toast.success("Processor status updated"); };
  const volumeData = procs.map(p => ({ name: p.name, volume: p.volume / 1000, successRate: p.successRate, enabled: p.enabled }));
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Processor Performance</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor and manage processor health metrics</p>
        </div>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Volume by Processor (in thousands)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                  {volumeData.map((entry, i) => (
                    <Cell key={i} fill={entry.enabled ? 'hsl(230, 80%, 56%)' : 'hsl(var(--muted-foreground))'} opacity={entry.enabled ? 1 : 0.4} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {procs.map(p => (
            <Card key={p.id} className={`p-5 ${!p.enabled ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${p.enabled ? 'bg-success' : 'bg-muted-foreground'}`} />
                  <h4 className="text-sm font-semibold text-foreground">{p.name}</h4>
                </div>
                <Switch checked={p.enabled} onCheckedChange={() => toggleProcessor(p.id)} />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className={`font-mono font-medium ${p.successRate >= 95 ? 'text-success' : p.successRate >= 90 ? 'text-warning' : 'text-destructive'}`}>{p.successRate}%</span>
                  </div>
                  <Progress value={p.successRate} className="h-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-2.5"><p className="text-xs text-muted-foreground">Volume</p><p className="text-sm font-semibold font-mono text-foreground">${(p.volume / 1000).toFixed(0)}k</p></div>
                  <div className="rounded-lg bg-muted/50 p-2.5"><p className="text-xs text-muted-foreground">Failure</p><p className="text-sm font-semibold font-mono text-destructive">{p.failureRate}%</p></div>
                  <div className="rounded-lg bg-muted/50 p-2.5"><p className="text-xs text-muted-foreground">Latency</p><p className="text-sm font-semibold font-mono text-foreground">{p.latency}ms</p></div>
                  <div className="rounded-lg bg-muted/50 p-2.5"><p className="text-xs text-muted-foreground">Cap Usage</p><p className="text-sm font-semibold font-mono text-foreground">{((p.currentVolume / p.monthlyCap) * 100).toFixed(0)}%</p></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
