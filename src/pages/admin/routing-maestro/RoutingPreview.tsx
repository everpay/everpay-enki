import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoutingChain, RoutingStep } from "@/components/routing-maestro/RoutingChain";
import { useRoutingMerchants, useRoutingRules, useProcessors } from "@/hooks/useRoutingMaestro";
import { Play } from "lucide-react";

const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "PKR"];
const countries = ["US", "DE", "GB", "JP", "CA", "AU", "FR", "NL", "PK"];

export default function RoutingPreview() {
  const { data: merchants = [] } = useRoutingMerchants();
  const { data: rules = [] } = useRoutingRules();
  const { data: processors = [] } = useProcessors();

  const [merchantId, setMerchantId] = useState("");
  const [amount, setAmount] = useState("2500");
  const [currency, setCurrency] = useState("USD");
  const [country, setCountry] = useState("US");
  const [result, setResult] = useState<RoutingStep[] | null>(null);
  const [explanation, setExplanation] = useState<string[]>([]);

  const procName = (id: string) => processors.find((p) => p.id === id)?.name || id;

  const simulateRouting = () => {
    const amt = parseFloat(amount);
    const reasons: string[] = [];
    const steps: RoutingStep[] = [];

    const merchantRules = rules.filter((r) => r.enabled && (r.scope === "global" || r.merchantId === merchantId));
    let matchedTarget: string | null = null;
    let matchedFallback: string | null = null;

    for (const r of merchantRules.sort((a, b) => a.priority - b.priority)) {
      const okCurrency = r.conditions.find((c) => c.field === "currency");
      const okMin = r.conditions.find((c) => c.field === "amount" && c.operator === ">=");
      const okMax = r.conditions.find((c) => c.field === "amount" && c.operator === "<=");
      if (okCurrency && !okCurrency.value.split(",").map((s) => s.trim().toUpperCase()).includes(currency)) continue;
      if (okMin && amt < Number(okMin.value)) continue;
      if (okMax && amt > Number(okMax.value)) continue;
      matchedTarget = r.actionTarget;
      reasons.push(`Rule matched: "${r.name}" (priority ${r.priority}) → route to ${procName(r.actionTarget)}`);
      break;
    }

    if (!matchedTarget) {
      const fallback = processors.find((p) => p.enabled);
      matchedTarget = fallback?.id || "shieldhub";
      reasons.push(`No rule matched — default to ${procName(matchedTarget)}`);
    }

    steps.push({ processor: procName(matchedTarget), status: "success", latency: processors.find((p) => p.id === matchedTarget)?.latency });
    reasons.push(`Final: routed via ${procName(matchedTarget)}`);

    setResult(steps);
    setExplanation(reasons);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Routing Preview</h1>
          <p className="text-sm text-muted-foreground mt-1">Simulate routing decisions against live rules before execution</p>
        </div>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Test Transaction</h3>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Merchant</label>
              <Select value={merchantId} onValueChange={setMerchantId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Any merchant" /></SelectTrigger>
                <SelectContent>
                  {merchants.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Amount</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 font-mono" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{currencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Country</label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={simulateRouting} className="mt-4">
            <Play className="h-4 w-4 mr-2" />Simulate Routing
          </Button>
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
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-mono text-primary mt-0.5">
                      {i + 1}
                    </div>
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
