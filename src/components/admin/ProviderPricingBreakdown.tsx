import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Coins } from "lucide-react";

type Rail = { provider: string; network: string; asset: string; cost: number; charge: number; margin_usdc: number; adj_charge?: number };

const PROVIDER_LABELS: Record<string, string> = {
  paywatcher: "PayWatcher (BASE)",
  elektropay: "Elektropay",
  delos: "Delos",
  brighty: "Brighty",
  unit: "Unit",
  circle: "Circle",
  walletsuite: "Walletster",
  rebelfi: "RebelFi",
};

export function ProviderPricingBreakdown({ amount = 100, markupPct = 2.5, providers }: { amount?: number; markupPct?: number; providers?: string[] }) {
  const [rails, setRails] = useState<Rail[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("paywatcher-payments", { body: { action: "rates", markup_pct: markupPct } });
        if (error) throw new Error(error.message);
        if (!alive) return;
        setRails(data?.rails || []);
      } catch (e: any) { if (alive) setError(e.message); }
    })();
    return () => { alive = false; };
  }, [markupPct]);

  if (error) {
    return (
      <Card className="p-4 rounded-2xl text-xs text-destructive flex items-center gap-2">
        <AlertCircle className="h-4 w-4" /> Pricing unavailable: {error}
      </Card>
    );
  }
  if (!rails) {
    return (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  const filtered = providers ? rails.filter(r => providers.includes(r.provider)) : rails;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map(r => {
        const total = amount * (1 + markupPct / 100) + r.charge;
        const margin = total - amount - r.cost;
        return (
          <Card key={r.provider} className="p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="font-medium flex items-center gap-1.5"><Coins className="h-4 w-4 text-primary" />{PROVIDER_LABELS[r.provider] || r.provider}</div>
              <span className="text-[10px] uppercase text-muted-foreground">{r.network}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1 text-xs">
              <span className="text-muted-foreground">Network cost</span><span className="text-right font-mono">${r.cost.toFixed(2)}</span>
              <span className="text-muted-foreground">Service fee</span><span className="text-right font-mono">${r.charge.toFixed(2)}</span>
              <span className="text-muted-foreground">+{markupPct}% markup</span><span className="text-right font-mono">${(amount * markupPct / 100).toFixed(2)}</span>
              <span className="text-muted-foreground border-t pt-1">You pay</span><span className="text-right font-mono border-t pt-1">${total.toFixed(2)}</span>
              <span className="text-muted-foreground">Margin</span><span className="text-right font-mono text-emerald-600">+${margin.toFixed(2)}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
