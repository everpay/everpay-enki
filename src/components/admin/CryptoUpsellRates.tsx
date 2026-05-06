import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Rail = {
  provider: string;
  network: string;
  asset: string;
  cost: number;
  charge: number;
  margin_usdc: number;
  markup_pct?: number;
};

export function CryptoUpsellRates() {
  const [rails, setRails] = useState<Rail[]>([]);
  const [buyAmount, setBuyAmount] = useState<number>(100);
  const [extraMarkupPct, setExtraMarkupPct] = useState<number>(2.5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    let lastErr: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke("paywatcher-payments", {
          body: { action: "rates", markup_pct: extraMarkupPct },
        });
        if (error) throw new Error(error.message);
        if (!data?.rails) throw new Error("No rates returned");
        setRails(data.rails);
        setLoading(false);
        return;
      } catch (e: any) {
        lastErr = e;
        if (attempt < 3) await new Promise(r => setTimeout(r, 400 * attempt));
      }
    }
    setError(`Rates failed: ${lastErr?.message || "PayWatcher /v1 unreachable"}`);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between font-medium">
        <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Crypto buy rates &amp; markup</span>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading} aria-label="Refresh rates">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="p-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Buy amount (USD)</Label>
          <Input type="number" value={buyAmount} onChange={(e) => setBuyAmount(Number(e.target.value || 0))} className="h-12" />
        </div>
        <div>
          <Label className="text-xs">Configured markup % (charged to merchant)</Label>
          <Input type="number" step="0.1" value={extraMarkupPct} onChange={(e) => setExtraMarkupPct(Number(e.target.value || 0))} className="h-12" />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Network</TableHead>
            <TableHead className="text-right">Network cost</TableHead>
            <TableHead className="text-right">Base charge</TableHead>
            <TableHead className="text-right">Adj. buy rate</TableHead>
            <TableHead className="text-right">Margin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && rails.length === 0 && Array.from({ length: 4 }).map((_, i) => (
            <TableRow key={`sk-${i}`}>
              {Array.from({ length: 6 }).map((__, j) => (
                <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
              ))}
            </TableRow>
          ))}
          {rails.map((r) => {
            const adjusted = buyAmount * (1 + extraMarkupPct / 100) + r.charge;
            const totalMargin = (adjusted - buyAmount - r.cost).toFixed(4);
            return (
              <TableRow key={r.provider}>
                <TableCell className="font-medium capitalize">{r.provider}</TableCell>
                <TableCell><Badge variant="outline">{r.network}</Badge> <span className="ml-1 text-xs text-muted-foreground">{r.asset}</span></TableCell>
                <TableCell className="text-right font-mono">${r.cost.toFixed(2)}</TableCell>
                <TableCell className="text-right font-mono">${r.charge.toFixed(2)}</TableCell>
                <TableCell className="text-right font-mono">${adjusted.toFixed(2)}</TableCell>
                <TableCell className="text-right font-mono text-emerald-600">+${totalMargin}</TableCell>
              </TableRow>
            );
          })}
          {error && !loading && (
            <TableRow><TableCell colSpan={6} className="text-center text-xs text-destructive py-6">
              <AlertCircle className="inline h-3.5 w-3.5 mr-1" />{error} — <button className="underline" onClick={load}>Retry</button>
            </TableCell></TableRow>
          )}
          {!loading && !error && rails.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">No rates available.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
      <div className="p-3 text-[11px] text-muted-foreground border-t">
        Rates derived from <code>paywatcher-payments?action=rates</code>. PayWatcher (BASE/USDC) is preferred for routing —
        cost $0.05 → charge $0.50.
      </div>
    </div>
  );
}