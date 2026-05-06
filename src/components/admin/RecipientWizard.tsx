import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

// Wise-style: required fields by country/rail. Conservative subset; expand as needed.
const RAILS_BY_COUNTRY: Record<string, Array<{ rail: string; label: string; fields: string[] }>> = {
  US: [
    { rail: "ach",     label: "ACH",      fields: ["routing_number","account_number","account_type"] },
    { rail: "wire",    label: "Wire",     fields: ["routing_number","account_number","swift_bic"] },
    { rail: "fedwire", label: "FedWire",  fields: ["routing_number","account_number"] },
    { rail: "rtp",     label: "RTP",      fields: ["routing_number","account_number"] },
    { rail: "usdt",    label: "USDT",     fields: ["wallet_address","wallet_network"] },
  ],
  GB: [
    { rail: "faster_payments", label: "Faster Payments", fields: ["sort_code","account_number"] },
    { rail: "swift",           label: "SWIFT",           fields: ["iban","swift_bic"] },
  ],
  EU: [
    { rail: "sepa",         label: "SEPA",         fields: ["iban","swift_bic"] },
    { rail: "sepa_instant", label: "SEPA Instant", fields: ["iban","swift_bic"] },
    { rail: "swift",        label: "SWIFT",        fields: ["iban","swift_bic"] },
  ],
  AU: [{ rail: "bsb", label: "BSB",   fields: ["bsb_code","account_number"] }],
  IN: [{ rail: "ifsc", label: "IFSC", fields: ["ifsc_code","account_number"] }],
  MX: [{ rail: "spei", label: "SPEI", fields: ["clabe"] }],
  BR: [{ rail: "pix",  label: "PIX",  fields: ["account_number","branch_code"] }],
  DEFAULT: [
    { rail: "swift", label: "SWIFT", fields: ["iban","swift_bic","account_number"] },
    { rail: "usdt",  label: "USDT",  fields: ["wallet_address","wallet_network"] },
  ],
};

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "EU", name: "Eurozone (SEPA)" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "IN", name: "India" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SG", name: "Singapore" },
];

const FIELD_LABELS: Record<string, string> = {
  routing_number: "Routing / ABA number",
  account_number: "Account number",
  account_type: "Account type (checking/savings)",
  swift_bic: "SWIFT / BIC",
  iban: "IBAN",
  sort_code: "Sort code",
  bsb_code: "BSB code",
  ifsc_code: "IFSC code",
  clabe: "CLABE (18 digits)",
  branch_code: "Branch / agency code",
  wallet_address: "Wallet address",
  wallet_network: "Network (TRC20 / ERC20 / Polygon)",
};

export function RecipientWizard({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; onSaved?: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<any>({
    recipient_type: "individual", currency: "USD", country: "US", rail: "ach",
  });
  const [saving, setSaving] = useState(false);

  const rails = RAILS_BY_COUNTRY[form.country] || RAILS_BY_COUNTRY.DEFAULT;
  const railDef = rails.find((r) => r.rail === form.rail) || rails[0];
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const reset = () => { setStep(1); setForm({ recipient_type: "individual", currency: "USD", country: "US", rail: "ach" }); };

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("recipients_intl" as any).insert({ ...form, rail: railDef.rail });
      if (error) throw error;
      toast.success("Recipient saved");
      onSaved?.(); onOpenChange(false); reset();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add payout recipient</DialogTitle>
          <DialogDescription>Step {step} of 3 — Wise-style multi-step bank form</DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Recipient type</Label>
              <Select value={form.recipient_type} onValueChange={(v) => set("recipient_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="individual">Individual</SelectItem><SelectItem value="business">Business</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Full / business name</Label><Input value={form.full_name || ""} onChange={(e) => set("full_name", e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} /></div>
            <div>
              <Label>Country</Label>
              <Select value={form.country} onValueChange={(v) => { set("country", v); const r = RAILS_BY_COUNTRY[v] || RAILS_BY_COUNTRY.DEFAULT; set("rail", r[0].rail); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} /></div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Address line 1</Label><Input value={form.address_line1 || ""} onChange={(e) => set("address_line1", e.target.value)} /></div>
            <div className="col-span-2"><Label>Address line 2</Label><Input value={form.address_line2 || ""} onChange={(e) => set("address_line2", e.target.value)} /></div>
            <div><Label>City</Label><Input value={form.city || ""} onChange={(e) => set("city", e.target.value)} /></div>
            <div><Label>State / region</Label><Input value={form.state || ""} onChange={(e) => set("state", e.target.value)} /></div>
            <div><Label>Postal / ZIP</Label><Input value={form.postal_code || ""} onChange={(e) => set("postal_code", e.target.value)} /></div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label>Payment rail</Label>
              <Select value={form.rail} onValueChange={(v) => set("rail", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{rails.map((r) => <SelectItem key={r.rail} value={r.rail}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Bank name</Label><Input value={form.bank_name || ""} onChange={(e) => set("bank_name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              {railDef.fields.map((f) => (
                <div key={f} className={f === "wallet_address" || f === "iban" ? "col-span-2" : ""}>
                  <Label>{FIELD_LABELS[f] || f}</Label>
                  <Input value={form[f] || ""} onChange={(e) => set(f, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
          ) : (
            <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" /> Save recipient</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}