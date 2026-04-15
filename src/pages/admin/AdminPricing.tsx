import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useMerchantPricing } from "@/hooks/useMerchantPricing";
import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import { toast } from "sonner";
import { DollarSign, Plus, Pencil } from "lucide-react";

const modelLabels: Record<string, string> = {
  percentage: "Percentage",
  fixed: "Fixed",
  tiered: "Tiered",
  blended: "Blended",
};

export default function AdminPricing() {
  const { data: pricingRows, isLoading, upsert } = useMerchantPricing();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    merchant_id: "",
    model_type: "percentage",
    percentage_fee: 2.9,
    fixed_fee: 0.3,
    currency: "USD",
    tiers: "",
    active: true,
  });

  const { data: merchants } = useQuery({
    queryKey: ["admin-merchants-for-pricing"],
    queryFn: () => extSelect("merchants", { select: "id, name", order: { column: "name", ascending: true } }),
  });

  const handleSave = () => {
    if (!form.merchant_id) { toast.error("Merchant required"); return; }
    let parsedTiers = null;
    if (form.model_type === "tiered" && form.tiers) {
      try { parsedTiers = JSON.parse(form.tiers); } catch { toast.error("Invalid tiers JSON"); return; }
    }
    upsert.mutate(
      { ...form, percentage_fee: Number(form.percentage_fee), fixed_fee: Number(form.fixed_fee), tiers: parsedTiers },
      { onSuccess: () => { setOpen(false); toast.success("Pricing saved"); } }
    );
  };

  const editRow = (row: any) => {
    setForm({
      merchant_id: row.merchant_id,
      model_type: row.model_type,
      percentage_fee: row.percentage_fee,
      fixed_fee: row.fixed_fee,
      currency: row.currency,
      tiers: row.tiers ? JSON.stringify(row.tiers, null, 2) : "",
      active: row.active,
    });
    setOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary" /> Merchant Pricing</h1>
            <p className="text-muted-foreground text-sm">Configure per-merchant pricing models and fee structures</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setForm({ merchant_id: "", model_type: "percentage", percentage_fee: 2.9, fixed_fee: 0.3, currency: "USD", sponsor_fee_pct: 0, tiers: "", active: true })}>
                <Plus className="h-4 w-4 mr-1" /> Add Pricing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Pricing Configuration</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Merchant</Label>
                  <Select value={form.merchant_id} onValueChange={v => setForm(f => ({ ...f, merchant_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select merchant" /></SelectTrigger>
                    <SelectContent>
                      {(merchants || []).map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Model Type</Label>
                  <Select value={form.model_type} onValueChange={v => setForm(f => ({ ...f, model_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="tiered">Tiered</SelectItem>
                      <SelectItem value="blended">Blended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>% Fee</Label><Input type="number" step="0.01" value={form.percentage_fee} onChange={e => setForm(f => ({ ...f, percentage_fee: Number(e.target.value) }))} /></div>
                  <div><Label>Fixed Fee ($)</Label><Input type="number" step="0.01" value={form.fixed_fee} onChange={e => setForm(f => ({ ...f, fixed_fee: Number(e.target.value) }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Currency</Label><Input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))} /></div>
                  <div><Label>Sponsor Fee %</Label><Input type="number" step="0.01" value={form.sponsor_fee_pct} onChange={e => setForm(f => ({ ...f, sponsor_fee_pct: Number(e.target.value) }))} /></div>
                </div>
                {form.model_type === "tiered" && (
                  <div><Label>Tiers (JSON)</Label><Textarea rows={4} value={form.tiers} onChange={e => setForm(f => ({ ...f, tiers: e.target.value }))} placeholder='[{"min":0,"max":100,"percentage":3.5,"fixed":0.30}]' /></div>
                )}
                <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} /><Label>Active</Label></div>
                <Button className="w-full" onClick={handleSave} disabled={upsert.isPending}>{upsert.isPending ? "Saving..." : "Save Pricing"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle>Pricing Rules</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-muted-foreground text-sm">Loading…</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>% Fee</TableHead>
                    <TableHead>Fixed</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Sponsor %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(pricingRows || []).map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-sm">{(row.merchants as any)?.name || row.merchant_id?.slice(0, 8)}</TableCell>
                      <TableCell><Badge variant="outline">{modelLabels[row.model_type] || row.model_type}</Badge></TableCell>
                      <TableCell>{row.percentage_fee}%</TableCell>
                      <TableCell>${row.fixed_fee}</TableCell>
                      <TableCell>{row.currency}</TableCell>
                      <TableCell>{row.sponsor_fee_pct}%</TableCell>
                      <TableCell><Badge variant={row.active ? "default" : "secondary"}>{row.active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => editRow(row)}><Pencil className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {(!pricingRows || pricingRows.length === 0) && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No pricing rules configured yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
