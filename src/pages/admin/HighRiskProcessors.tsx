import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Merchant = {
  id: string;
  name: string;
  email: string | null;
  gambling_enabled: boolean | null;
};

type HRP = {
  merchant_id: string;
  matrix_enabled: boolean;
  matrix_flow: "checkout" | "h2h_payment" | "h2h_apm" | "inline";
  valenspay_enabled: boolean;
  elektropay_enabled: boolean;
  circoflows_enabled: boolean;
  circoflows_mode: "hosted" | "direct";
  vertical: string;
  notes: string | null;
};

const MATRIX_FLOWS = [
  { value: "checkout", label: "Hosted Checkout" },
  { value: "inline", label: "Inline card.js" },
  { value: "h2h_payment", label: "H2H (PCI)" },
  { value: "h2h_apm", label: "H2H APM (Apple/Google Pay)" },
] as const;

const CIRCOFLOWS_MODES = [
  { value: "hosted", label: "Hosted Card Page" },
  { value: "direct", label: "Direct API (PCI)" },
] as const;

export default function HighRiskProcessors() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [hrps, setHrps] = useState<Record<string, HRP>>({});
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: m }, { data: h }] = await Promise.all([
        supabase.from("merchants").select("id,name,email,gambling_enabled").order("name").limit(500),
        supabase.from("merchant_high_risk_processors").select("*"),
      ]);
      setMerchants((m || []) as Merchant[]);
      const map: Record<string, HRP> = {};
      (h || []).forEach((row: any) => { map[row.merchant_id] = row; });
      setHrps(map);
      setLoading(false);
    })();
  }, []);

  const getHrp = (id: string): HRP =>
    hrps[id] || {
      merchant_id: id, matrix_enabled: false, matrix_flow: "checkout",
      valenspay_enabled: false, elektropay_enabled: false,
      circoflows_enabled: false, circoflows_mode: "hosted",
      vertical: "gambling", notes: null,
    };

  const persist = async (id: string, patch: Partial<HRP>) => {
    const current = getHrp(id);
    const merged = { ...current, ...patch, merchant_id: id };
    setHrps((s) => ({ ...s, [id]: merged }));
    const { error } = await supabase
      .from("merchant_high_risk_processors")
      .upsert(merged, { onConflict: "merchant_id" });
    if (error) {
      toast.error(`Save failed: ${error.message}`);
    } else {
      toast.success("Saved");
    }
  };

  const toggleGambling = async (id: string, enabled: boolean) => {
    setMerchants((rows) => rows.map((r) => (r.id === id ? { ...r, gambling_enabled: enabled } : r)));
    const { error } = await supabase.from("merchants").update({ gambling_enabled: enabled }).eq("id", id);
    if (error) toast.error(`Failed: ${error.message}`);
    else toast.success(enabled ? "Vertical enabled" : "Vertical disabled");
  };

  const filtered = merchants.filter((m) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.id.includes(q);
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">High-Risk Processors</h1>
        <p className="text-muted-foreground mt-1">
          Enable Matrix Partners, ValensPay PG6, Elektropay and Circoflows for merchants in the
          <strong> gambling, casino, sweepstakes and iGaming </strong> verticals only.
          A merchant must have the vertical gate enabled before any high-risk processor
          will accept traffic; otherwise routing silently falls back to ShieldHub.
        </p>
      </header>

      <Input
        placeholder="Search merchants by name, email or id…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-md"
      />

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4">
          {filtered.map((m) => {
            const h = getHrp(m.id);
            const gateOn = !!m.gambling_enabled;
            return (
              <Card key={m.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{m.name || "Unnamed merchant"}</CardTitle>
                    <CardDescription className="font-mono text-xs">{m.id}</CardDescription>
                    {m.email && <CardDescription>{m.email}</CardDescription>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={gateOn ? "default" : "secondary"}>
                      {gateOn ? "High-risk vertical ON" : "Standard merchant"}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`gate-${m.id}`} className="text-sm">Gambling vertical</Label>
                      <Switch
                        id={`gate-${m.id}`}
                        checked={gateOn}
                        onCheckedChange={(v) => toggleGambling(m.id, v)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`mx-${m.id}`} className="font-medium">Matrix Partners</Label>
                      <Switch
                        id={`mx-${m.id}`}
                        checked={h.matrix_enabled}
                        disabled={!gateOn}
                        onCheckedChange={(v) => persist(m.id, { matrix_enabled: v })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Card flow</Label>
                      <Select
                        value={h.matrix_flow}
                        disabled={!gateOn || !h.matrix_enabled}
                        onValueChange={(v) => persist(m.id, { matrix_flow: v as HRP["matrix_flow"] })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MATRIX_FLOWS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`vp-${m.id}`} className="font-medium">ValensPay PG6</Label>
                      <Switch
                        id={`vp-${m.id}`}
                        checked={h.valenspay_enabled}
                        disabled={!gateOn}
                        onCheckedChange={(v) => persist(m.id, { valenspay_enabled: v })}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">HMAC-SHA1 signed v3.2 sandbox.</p>
                  </div>

                  <div className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`ek-${m.id}`} className="font-medium">Elektropay (crypto)</Label>
                      <Switch
                        id={`ek-${m.id}`}
                        checked={h.elektropay_enabled}
                        disabled={!gateOn}
                        onCheckedChange={(v) => persist(m.id, { elektropay_enabled: v })}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">USDT / USDC / BTC settlement.</p>
                  </div>

                  <div className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`cf-${m.id}`} className="font-medium">Circoflows</Label>
                      <Switch
                        id={`cf-${m.id}`}
                        checked={h.circoflows_enabled}
                        disabled={!gateOn}
                        onCheckedChange={(v) => persist(m.id, { circoflows_enabled: v })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Card flow</Label>
                      <Select
                        value={h.circoflows_mode}
                        disabled={!gateOn || !h.circoflows_enabled}
                        onValueChange={(v) => persist(m.id, { circoflows_mode: v as HRP["circoflows_mode"] })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CIRCOFLOWS_MODES.map((f) => (
                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && <p className="text-muted-foreground">No merchants match.</p>}
        </div>
      )}
    </div>
  );
}
