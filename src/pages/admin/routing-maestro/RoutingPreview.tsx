import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoutingChain, RoutingStep } from "@/components/routing-maestro/RoutingChain";
import { Play } from "lucide-react";

const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];
const countries = ["US", "DE", "GB", "JP", "CA", "AU", "FR", "NL"];

export default function RoutingMaestroPreview() {
  const [amount, setAmount] = useState("2500");
  const [currency, setCurrency] = useState("USD");
  const [country, setCountry] = useState("US");
  const [result, setResult] = useState<RoutingStep[] | null>(null);
  const [explanation, setExplanation] = useState<string[]>([]);
  const simulateRouting = () => {
    const amt = parseFloat(amount);
    const steps: RoutingStep[] = [];
    const reasons: string[] = [];
    if (amt > 10000) { reasons.push("Rule: High-value to Stripe (amount > $10,000)"); steps.push({ processor: "Stripe", status: "success", latency: 215 }); }
    else if (currency === "EUR") {
      reasons.push("Rule: EUR to Adyen (currency = EUR)");
      steps.push({ processor: "Adyen", status: "failed", latency: 330, reason: "Timeout" });
      reasons.push("Fallback: Adyen failed → trying Stripe");
      steps.push({ processor: "Stripe", status: "success", latency: 200 });
    } else {
      reasons.push("Default weight-based routing");
      if (Math.random() > 0.5) {
        steps.push({ processor: "Stripe", status: "failed", latency: 480, reason: "Rate limit" });
        reasons.push("Fallback: Stripe rate limited → trying Adyen");
        steps.push({ processor: "Adyen", status: "success", latency: 290 });
      } else { steps.push({ processor: "Stripe", status: "success", latency: 210 }); }
    }
    reasons.push(`Final: Routed via ${steps[steps.length - 1].processor}`);
    setResult(steps); setExplanation(reasons);
  };
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Routing Preview</h1>
          <p className="text-sm text-muted-foreground mt-1">Test routing decisions before execution</p>
        </div>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Test Transaction</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Amount ($)</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 font-mono" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Country</label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={simulateRouting} className="w-full"><Play className="h-4 w-4 mr-2" />Simulate</Button>
            </div>
          </div>
        </Card>
        {result && (
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Routing Decision Chain</h3>
              <RoutingChain steps={result} />
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Decision Explanation</h3>
              <div className="space-y-2">
                {explanation.map((reason, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-mono text-primary mt-0.5">{i + 1}</div>
                    <p className="text-sm text-foreground">{reason}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
