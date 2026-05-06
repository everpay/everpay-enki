import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp } from "lucide-react";

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

  useEffect(() => {
    (async () => {
      const { data } = await supabase.functions.invoke("paywatcher-payments", { body: { action: "rates" } });
      setRails(data?.rails || []);
    })();
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center gap-2 font-medium">
        <TrendingUp className="h-4 w-4 text-primary" /> Crypto buy rates &amp; markup
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
          {rails.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">Loading rates…</TableCell></TableRow>
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