import { Badge } from "@/components/ui/badge";
import { Coins, Receipt, TrendingUp } from "lucide-react";

const NETWORK_COST = 0.05;
const MERCHANT_CHARGE = 0.50;
const MARGIN = MERCHANT_CHARGE - NETWORK_COST;

/**
 * Transparent pricing step shown right before crypto buy / payout confirmation.
 * Mirrors the PayWatcher cost ($0.05 network) → $0.50 charge structure.
 */
export function PaywatcherPricingBreakdown({ amountUsdc }: { amountUsdc: number }) {
  const total = (amountUsdc + MERCHANT_CHARGE).toFixed(2);
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Coins className="h-4 w-4 text-primary" />
        PayWatcher (BASE / USDC) pricing
        <Badge variant="outline" className="ml-auto text-[10px]">Preferred</Badge>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Amount" value={`${amountUsdc.toFixed(2)} USDC`} muted />
        <Stat label="Network cost" value={`$${NETWORK_COST.toFixed(2)}`} muted />
        <Stat label="Service fee" value={`$${MERCHANT_CHARGE.toFixed(2)}`} accent />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          Margin retained
        </span>
        <span className="font-mono font-medium text-emerald-600">+${MARGIN.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <Receipt className="h-3.5 w-3.5" /> Total charged
        </span>
        <span className="font-mono text-base font-semibold">${total}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Settles on BASE L2. Webhook events (<code>payment.confirmed/failed/expired</code>) update your transaction status automatically.
      </p>
    </div>
  );
}

function Stat({ label, value, muted, accent }: { label: string; value: string; muted?: boolean; accent?: boolean }) {
  return (
    <div className={`rounded-xl border border-border p-3 ${accent ? "bg-primary/5" : ""}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-sm ${muted ? "text-foreground" : "text-foreground"}`}>{value}</div>
    </div>
  );
}