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
