import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoutingMerchants } from "@/hooks/useRoutingMaestro";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { Play, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "PKR", "INR", "BRL", "MXN", "PHP"];
const countries = ["US", "DE", "GB", "JP", "CA", "AU", "FR", "NL", "PK", "IN", "BR", "MX", "PH"];
const cardBrands = ["visa", "mastercard", "amex", "discover", "jcb", "unionpay"];
const riskLevels = ["low", "medium", "high"];

type ResolveResp = {
  merchant: { id: string; name: string; region: string | null };
  winningRule: null | { ruleId: string; ruleName: string; priority: number; target: string; fallback: string | null };
  evaluations: { ruleId: string; ruleName: string; priority: number; target: string; matched: boolean; reasons: string[] }[];
  chain: { step: number; processor: string; displayName: string }[];
  availableProcessors: { id: string; name: string }[];
  generatedAt: string;
};

export default function RoutingPreview() {
  const { data: merchants = [] } = useRoutingMerchants();

  const [merchantId, setMerchantId] = useState("");
  const [amount, setAmount] = useState("2500");
  const [currency, setCurrency] = useState("USD");
  const [country, setCountry] = useState<string>("");
  const [cardBrand, setCardBrand] = useState<string>("");
  const [riskLevel, setRiskLevel] = useState<string>("");
  const [excluded, setExcluded] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<ResolveResp | null>(null);

  const resolve = useMutation({
    mutationFn: async (): Promise<ResolveResp> => {
      const { data, error } = await supabase.functions.invoke("route-resolve", {
        body: {
          merchantId,
          amount: parseFloat(amount) || 0,
          currency,
          country: country || null,
          cardBrand: cardBrand || null,
          riskLevel: riskLevel || null,
          excludeProcessors: Object.entries(excluded).filter(([, v]) => v).map(([k]) => k),
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as ResolveResp;
    },
    onSuccess: (d) => setResult(d),
    onError: (e: any) => toast.error(e.message || "Resolve failed"),
  });

  const availableProcs = useMemo(() => result?.availableProcessors ?? [], [result]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Routing Preview</h1>
          <p className="text-sm text-muted-foreground mt-1">Resolve the live routing chain against the real rule engine</p>
        </div>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Payment Parameters</h3>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="md:col-span-3">
              <label className="text-xs font-medium text-muted-foreground">Merchant</label>
              <Select value={merchantId} onValueChange={setMerchantId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select merchant" /></SelectTrigger>
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
                <SelectTrigger className="mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>{countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Card Brand</label>
              <Select value={cardBrand} onValueChange={setCardBrand}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>{cardBrands.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Risk Level</label>
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>{riskLevels.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {availableProcs.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Processor availability overrides</p>
              <div className="flex flex-wrap gap-2">
                {availableProcs.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setExcluded((s) => ({ ...s, [p.id]: !s[p.id] }))}
                    className={`text-xs px-2.5 py-1 rounded-md border transition ${
                      excluded[p.id] ? "bg-destructive/10 border-destructive text-destructive line-through" : "bg-muted/40 border-border text-foreground"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={() => resolve.mutate()} disabled={!merchantId || resolve.isPending} className="mt-4">
            <Play className="h-4 w-4 mr-2" />
            {resolve.isPending ? "Resolving…" : "Resolve Routing"}
          </Button>
        </Card>

        {result && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Expected Processor Chain</h3>
              {result.chain.length === 0 ? (
                <p className="text-sm text-destructive">No eligible processor — transaction would be rejected.</p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {result.chain.map((s, i) => (
                    <div key={s.processor} className="flex items-center gap-2">
                      <div className={`px-3 py-2 rounded-lg border ${i === 0 ? "border-primary bg-primary/5" : "border-border bg-muted/30"}`}>
                        <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Step {s.step}</div>
                        <div className="text-sm font-medium text-foreground">{s.displayName}</div>
                      </div>
                      {i < result.chain.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Resolved at {new Date(result.generatedAt).toLocaleTimeString()} for {result.merchant.name}
              </p>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Rule Evaluation</h3>
              {result.evaluations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No routing rules configured for this merchant.</p>
              ) : (
                <div className="space-y-2">
                  {result.evaluations.map((e) => {
                    const winner = result.winningRule?.ruleId === e.ruleId;
                    const Icon = e.matched ? CheckCircle2 : XCircle;
                    return (
                      <div key={e.ruleId} className={`flex items-start gap-3 rounded-lg border p-3 ${winner ? "border-primary bg-primary/5" : ""}`}>
                        <Icon className={`h-4 w-4 mt-0.5 ${e.matched ? "text-success" : "text-muted-foreground"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">{e.ruleName}</span>
                            <Badge variant="outline" className="text-[10px]">P{e.priority}</Badge>
                            {winner && <Badge className="text-[10px]">Winner</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">→ {e.target}</p>
                          {e.reasons.length > 0 && (
                            <p className="text-xs text-destructive/80 mt-1">{e.reasons.join(" · ")}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
