import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Landmark, Plus, Droplet, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";

const PURPOSES = ["common","sweep","operating","merchant_fund","reserve","fees","payout","custody","other"];

function BankForm({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const set = (k: string, v: any) => onChange({ ...value, [k]: v });
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2"><Label>Label</Label><Input value={value.label || ""} onChange={(e) => set("label", e.target.value)} placeholder="e.g. Common Account, Sweep Account" /></div>
      <div>
        <Label>Purpose</Label>
        <Select value={value.purpose || "common"} onValueChange={(v) => set("purpose", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{PURPOSES.map((p) => <SelectItem key={p} value={p}>{p.replace("_"," ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Provider</Label><Input value={value.provider || ""} onChange={(e) => set("provider", e.target.value)} placeholder="delos / brighty / unit / circle" /></div>
      <div><Label>Bank name</Label><Input value={value.bank_name || ""} onChange={(e) => set("bank_name", e.target.value)} /></div>
      <div><Label>Account holder</Label><Input value={value.account_holder || ""} onChange={(e) => set("account_holder", e.target.value)} /></div>
      <div><Label>Currency</Label><Input value={value.currency || "USD"} onChange={(e) => set("currency", e.target.value.toUpperCase())} /></div>
      <div><Label>Country</Label><Input value={value.country || ""} onChange={(e) => set("country", e.target.value.toUpperCase())} /></div>
      <div><Label>Account number</Label><Input value={value.account_number || ""} onChange={(e) => set("account_number", e.target.value)} /></div>
      <div><Label>Routing / ABA</Label><Input value={value.routing_number || ""} onChange={(e) => set("routing_number", e.target.value)} /></div>
      <div><Label>IBAN</Label><Input value={value.iban || ""} onChange={(e) => set("iban", e.target.value)} /></div>
      <div><Label>SWIFT / BIC</Label><Input value={value.swift_bic || ""} onChange={(e) => set("swift_bic", e.target.value)} /></div>
      <div><Label>Sort code</Label><Input value={value.sort_code || ""} onChange={(e) => set("sort_code", e.target.value)} /></div>
    </div>
  );
}

function PoolForm({ value, onChange, accounts }: { value: any; onChange: (v: any) => void; accounts: any[] }) {
  const set = (k: string, v: any) => onChange({ ...value, [k]: v });
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2"><Label>Pool name</Label><Input value={value.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. USD Settlement Pool" /></div>
      <div><Label>Currency</Label><Input value={value.currency || "USD"} onChange={(e) => set("currency", e.target.value.toUpperCase())} /></div>
      <div><Label>Provider</Label><Input value={value.provider || ""} onChange={(e) => set("provider", e.target.value)} placeholder="delos / circle / walletsuite" /></div>
      <div><Label>Target balance</Label><Input type="number" value={value.target_balance ?? ""} onChange={(e) => set("target_balance", parseFloat(e.target.value) || 0)} /></div>
      <div><Label>Min threshold</Label><Input type="number" value={value.min_threshold ?? ""} onChange={(e) => set("min_threshold", parseFloat(e.target.value) || 0)} /></div>
      <div><Label>Max threshold</Label><Input type="number" value={value.max_threshold ?? ""} onChange={(e) => set("max_threshold", parseFloat(e.target.value) || null)} /></div>
      <div className="col-span-2">
        <Label>Linked bank account</Label>
        <Select value={value.bank_account_id || ""} onValueChange={(v) => set("bank_account_id", v || null)}>
          <SelectTrigger><SelectValue placeholder="Select treasury account" /></SelectTrigger>
          <SelectContent>
            {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.label} ({a.purpose} · {a.currency})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2"><Label>Notes</Label><Input value={value.notes || ""} onChange={(e) => set("notes", e.target.value)} /></div>
    </div>
  );
}

export default function AdminTreasuryBanking() {
  const { isAdmin, isSuperAdmin, isLoading } = useAccessControl();
  const qc = useQueryClient();
  const [bankOpen, setBankOpen] = useState(false);
  const [poolOpen, setPoolOpen] = useState(false);
  const [bankForm, setBankForm] = useState<any>({ purpose: "common", currency: "USD" });
  const [poolForm, setPoolForm] = useState<any>({ currency: "USD" });

  const accounts = useQuery({
    queryKey: ["treasury-bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("treasury_bank_accounts" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error; return data || [];
    },
  });
  const pools = useQuery({
    queryKey: ["liquidity-pools"],
    queryFn: async () => {
      const { data, error } = await supabase.from("liquidity_pools" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error; return data || [];
    },
  });

  if (isLoading) return <AppLayout><div className="p-6">Loading…</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  const saveBank = async () => {
    if (!bankForm.label) return toast.error("Label required");
    const { error } = await supabase.from("treasury_bank_accounts" as any).insert(bankForm);
    if (error) return toast.error(error.message);
    toast.success("Treasury account added");
    setBankOpen(false); setBankForm({ purpose: "common", currency: "USD" });
    qc.invalidateQueries({ queryKey: ["treasury-bank-accounts"] });
  };
  const removeBank = async (id: string) => {
    if (!confirm("Delete this treasury account?")) return;
    const { error } = await supabase.from("treasury_bank_accounts" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["treasury-bank-accounts"] });
  };
  const savePool = async () => {
    if (!poolForm.name) return toast.error("Name required");
    const { error } = await supabase.from("liquidity_pools" as any).insert(poolForm);
    if (error) return toast.error(error.message);
    toast.success("Liquidity pool created");
    setPoolOpen(false); setPoolForm({ currency: "USD" });
    qc.invalidateQueries({ queryKey: ["liquidity-pools"] });
  };
  const removePool = async (id: string) => {
    if (!confirm("Delete this pool?")) return;
    const { error } = await supabase.from("liquidity_pools" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["liquidity-pools"] });
  };

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Landmark className="h-6 w-6 text-primary" /> Treasury Banking</h1>
          <p className="text-sm text-muted-foreground">Labelled super-admin accounts (Common, Sweep, Operating, Merchant Fund) and liquidity pools.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card mb-6">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="font-medium flex items-center gap-2"><Landmark className="h-4 w-4" /> Treasury bank accounts</div>
          <Button size="sm" onClick={() => setBankOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add account</Button>
        </div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Label</TableHead><TableHead>Purpose</TableHead><TableHead>Provider</TableHead>
            <TableHead>Currency</TableHead><TableHead>Bank</TableHead><TableHead>Identifier</TableHead><TableHead className="w-[60px]" />
          </TableRow></TableHeader>
          <TableBody>
            {(accounts.data || []).length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No treasury accounts yet</TableCell></TableRow>
            ) : (accounts.data || []).map((a: any) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.label}</TableCell>
                <TableCell><Badge variant="outline">{a.purpose}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{a.provider || "—"}</TableCell>
                <TableCell className="font-mono text-xs">{a.currency}</TableCell>
                <TableCell>{a.bank_name || "—"}</TableCell>
                <TableCell className="font-mono text-xs">{a.iban || a.account_number || "—"}</TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => removeBank(a.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="font-medium flex items-center gap-2"><Droplet className="h-4 w-4" /> Liquidity pools</div>
          <Button size="sm" onClick={() => setPoolOpen(true)}><Plus className="h-4 w-4 mr-1" /> New pool</Button>
        </div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Currency</TableHead><TableHead>Provider</TableHead>
            <TableHead className="text-right">Target</TableHead><TableHead className="text-right">Min</TableHead>
            <TableHead className="text-right">Current</TableHead><TableHead className="w-[60px]" />
          </TableRow></TableHeader>
          <TableBody>
            {(pools.data || []).length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No liquidity pools configured</TableCell></TableRow>
            ) : (pools.data || []).map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="font-mono text-xs">{p.currency}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.provider || "—"}</TableCell>
                <TableCell className="text-right">{Number(p.target_balance || 0).toLocaleString()}</TableCell>
                <TableCell className="text-right">{Number(p.min_threshold || 0).toLocaleString()}</TableCell>
                <TableCell className="text-right font-medium">{Number(p.current_balance || 0).toLocaleString()}</TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => removePool(p.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={bankOpen} onOpenChange={setBankOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add treasury bank account</DialogTitle></DialogHeader>
          <BankForm value={bankForm} onChange={setBankForm} />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setBankOpen(false)}>Cancel</Button>
            <Button onClick={saveBank}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={poolOpen} onOpenChange={setPoolOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Create liquidity pool</DialogTitle></DialogHeader>
          <PoolForm value={poolForm} onChange={setPoolForm} accounts={accounts.data || []} />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setPoolOpen(false)}>Cancel</Button>
            <Button onClick={savePool}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}