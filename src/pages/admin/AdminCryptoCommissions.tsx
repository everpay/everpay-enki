import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCryptoCommissions, useUpsertCommission, useDeleteCommission } from "@/hooks/useCryptoCommissions";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

const TX_TYPES = ["deposit","withdrawal","convert","transfer","payment"] as const;

export default function AdminCryptoCommissions() {
  const { isAdmin, isSuperAdmin, isLoading } = useAccessControl();
  const { data: rows = [], isLoading: loading } = useCryptoCommissions();
  const upsert = useUpsertCommission();
  const del = useDeleteCommission();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tx_type: "payment", fee_percent: "0", fee_fixed: "0", split_percent: "0", asset_id: "", is_active: true });

  if (isLoading) return <AppLayout><div className="p-6">Loading...</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  const submit = async () => {
    await upsert.mutateAsync({
      tx_type: form.tx_type as any,
      fee_percent: Number(form.fee_percent),
      fee_fixed: Number(form.fee_fixed),
      split_percent: Number(form.split_percent),
      asset_id: form.asset_id || null,
      is_active: form.is_active,
    });
    setOpen(false);
  };

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Crypto Commissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Per-asset / per-tx-type fee schedules and revenue splits.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New rule</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New commission rule</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Transaction type</Label>
                <Select value={form.tx_type} onValueChange={(v) => setForm({ ...form, tx_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TX_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-2"><Label>Asset ID (optional)</Label><Input value={form.asset_id} onChange={(e) => setForm({ ...form, asset_id: e.target.value })} placeholder="USDT.TRC20" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Fee %</Label><Input type="number" step="0.01" value={form.fee_percent} onChange={(e) => setForm({ ...form, fee_percent: e.target.value })} /></div>
                <div className="space-y-2"><Label>Fee fixed</Label><Input type="number" step="0.00000001" value={form.fee_fixed} onChange={(e) => setForm({ ...form, fee_fixed: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Split %</Label><Input type="number" step="0.01" value={form.split_percent} onChange={(e) => setForm({ ...form, split_percent: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
              <Button className="w-full" onClick={submit} disabled={upsert.isPending}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Type</TableHead><TableHead>Asset</TableHead>
            <TableHead className="text-right">Fee %</TableHead><TableHead className="text-right">Fee fixed</TableHead>
            <TableHead className="text-right">Split %</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No rules configured</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell><Badge variant="outline">{r.tx_type}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{r.asset_id || "ANY"}</TableCell>
                <TableCell className="text-right">{Number(r.fee_percent).toFixed(2)}%</TableCell>
                <TableCell className="text-right">{Number(r.fee_fixed).toFixed(8)}</TableCell>
                <TableCell className="text-right">{Number(r.split_percent).toFixed(2)}%</TableCell>
                <TableCell><Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
