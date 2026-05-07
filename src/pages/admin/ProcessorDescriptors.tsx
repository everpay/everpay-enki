import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Save, Trash2, Building2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CatalogRow { name: string; display_name: string | null; acquirer_descriptor: string | null; active: boolean; }
interface MerchantRow { id: string; name: string | null; }
interface OverrideRow {
  id: string;
  merchant_id: string;
  processor: string;
  descriptor: string;
  descriptor_text: string | null;
  active: boolean;
  notes: string | null;
}

export default function ProcessorDescriptors() {
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  // New override form
  const [newMerchant, setNewMerchant] = useState('');
  const [newProcessor, setNewProcessor] = useState('shieldhub');
  const [newDescriptor, setNewDescriptor] = useState('');

  const merchantById = useMemo(() => Object.fromEntries(merchants.map((m) => [m.id, m.name || m.id.slice(0, 8)])), [merchants]);

  async function load() {
    setLoading(true);
    const [{ data: cat }, { data: mer }, { data: ov }] = await Promise.all([
      supabase.from('payment_processors').select('name, display_name, acquirer_descriptor, active').order('name'),
      supabase.from('merchants').select('id, name').order('name'),
      supabase.from('merchant_processor_descriptors').select('*').order('processor'),
    ]);
    setCatalog((cat || []) as CatalogRow[]);
    setMerchants((mer || []) as MerchantRow[]);
    setOverrides((ov || []) as OverrideRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveCatalog(name: string, descriptor: string, active: boolean) {
    setSavingId(`cat:${name}`);
    const { error } = await supabase
      .from('payment_processors')
      .update({ acquirer_descriptor: descriptor.trim(), active })
      .eq('name', name);
    setSavingId(null);
    if (error) return toast.error(error.message);
    toast.success(`Updated ${name} default descriptor`);
    load();
  }

  async function saveOverride(row: OverrideRow) {
    setSavingId(`ov:${row.id}`);
    const { error } = await supabase
      .from('merchant_processor_descriptors')
      .update({
        descriptor: row.descriptor.trim(),
        descriptor_text: (row.descriptor_text || row.descriptor).trim(),
        active: row.active,
        notes: row.notes,
      })
      .eq('id', row.id);
    setSavingId(null);
    if (error) return toast.error(error.message);
    toast.success('Override saved');
    load();
  }

  async function deleteOverride(id: string) {
    if (!confirm('Remove this descriptor override?')) return;
    const { error } = await supabase.from('merchant_processor_descriptors').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Override removed');
    load();
  }

  async function createOverride() {
    if (!newMerchant || !newProcessor || !newDescriptor.trim()) {
      return toast.error('Merchant, processor and descriptor are required');
    }
    const { error } = await supabase.from('merchant_processor_descriptors').insert({
      merchant_id: newMerchant,
      processor: newProcessor,
      descriptor: newDescriptor.trim(),
      descriptor_text: newDescriptor.trim(),
      active: true,
    });
    if (error) return toast.error(error.message);
    toast.success('Descriptor override created');
    setNewDescriptor('');
    load();
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Processor Descriptors</h1>
          <p className="text-sm text-muted-foreground">
            Edit the merchant-statement descriptor sent to each processor. Per-merchant overrides take priority over the global catalog default.
          </p>
        </div>

        {/* Catalog defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4" /> Global processor defaults</CardTitle>
            <CardDescription>Used when no per-merchant override exists. ShieldHub requires this to avoid error 004 (Processor not found).</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Processor</TableHead>
                    <TableHead>Default descriptor</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalog.map((row) => (
                    <CatalogEditor
                      key={row.name}
                      row={row}
                      saving={savingId === `cat:${row.name}`}
                      onSave={saveCatalog}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Per-merchant overrides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Per-merchant overrides</CardTitle>
            <CardDescription>Different merchants can use rotating or custom descriptors per processor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-lg border border-border p-3 bg-muted/30">
              <div className="space-y-1">
                <Label className="text-xs">Merchant</Label>
                <Select value={newMerchant} onValueChange={setNewMerchant}>
                  <SelectTrigger><SelectValue placeholder="Pick merchant..." /></SelectTrigger>
                  <SelectContent>
                    {merchants.map((m) => <SelectItem key={m.id} value={m.id}>{m.name || m.id.slice(0, 8)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Processor</Label>
                <Select value={newProcessor} onValueChange={setNewProcessor}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {catalog.map((c) => <SelectItem key={c.name} value={c.name}>{c.display_name || c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Descriptor</Label>
                <Input value={newDescriptor} onChange={(e) => setNewDescriptor(e.target.value)} placeholder="e.g. AXP*FER*AXP*FERES" />
              </div>
              <div className="flex items-end">
                <Button onClick={createOverride} className="w-full gap-1"><Plus className="h-4 w-4" /> Add override</Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Processor</TableHead>
                  <TableHead>Descriptor</TableHead>
                  <TableHead>Descriptor text</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {overrides.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">No overrides — global defaults apply.</TableCell></TableRow>
                )}
                {overrides.map((row) => (
                  <OverrideEditor
                    key={row.id}
                    row={row}
                    merchantName={merchantById[row.merchant_id] || row.merchant_id.slice(0, 8)}
                    saving={savingId === `ov:${row.id}`}
                    onSave={saveOverride}
                    onDelete={deleteOverride}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function CatalogEditor({ row, saving, onSave }: { row: CatalogRow; saving: boolean; onSave: (n: string, d: string, a: boolean) => void; }) {
  const [descriptor, setDescriptor] = useState(row.acquirer_descriptor || '');
  const [active, setActive] = useState(row.active);
  return (
    <TableRow>
      <TableCell className="font-medium">{row.display_name || row.name}<div className="text-xs text-muted-foreground font-mono">{row.name}</div></TableCell>
      <TableCell><Input value={descriptor} onChange={(e) => setDescriptor(e.target.value)} className="font-mono" /></TableCell>
      <TableCell><Switch checked={active} onCheckedChange={setActive} /></TableCell>
      <TableCell>
        <Button size="sm" variant="outline" disabled={saving} onClick={() => onSave(row.name, descriptor, active)} className="gap-1">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
        </Button>
      </TableCell>
    </TableRow>
  );
}

function OverrideEditor({ row, merchantName, saving, onSave, onDelete }: {
  row: OverrideRow;
  merchantName: string;
  saving: boolean;
  onSave: (r: OverrideRow) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState(row);
  return (
    <TableRow>
      <TableCell className="text-sm">{merchantName}</TableCell>
      <TableCell><Badge variant="outline">{row.processor}</Badge></TableCell>
      <TableCell><Input value={draft.descriptor} onChange={(e) => setDraft({ ...draft, descriptor: e.target.value })} className="font-mono" /></TableCell>
      <TableCell><Input value={draft.descriptor_text || ''} onChange={(e) => setDraft({ ...draft, descriptor_text: e.target.value })} className="font-mono" placeholder="(defaults to descriptor)" /></TableCell>
      <TableCell><Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} /></TableCell>
      <TableCell className="flex gap-1">
        <Button size="sm" variant="outline" disabled={saving} onClick={() => onSave(draft)} className="gap-1">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(row.id)} className="text-destructive">
          <Trash2 className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
