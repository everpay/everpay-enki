import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, Wallet, ArrowUpRight, ArrowDownRight, History, ShieldCheck, AlertTriangle, Eye, Radio, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type Merchant = { id: string; name: string };
type SyncRun = {
  id: string;
  merchant_id: string | null;
  status: string;
  scanned: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: any;
  verification: any;
  skipped_details: any;
  source?: string;
  duration_ms: number | null;
  created_at: string;
};

const CHAINS = ["ethereum", "polygon", "base", "solana", "arbitrum"];
const TOKEN_DECIMALS: Record<string, number> = { USDC: 6, USDT: 6 };

export function RebelFiActions({
  wallets,
  venues,
  onRefresh,
}: {
  wallets: any[];
  venues: any[];
  onRefresh: () => void;
}) {
  const qc = useQueryClient();
  const [merchantId, setMerchantId] = useState<string>("");

  const merchantsQ = useQuery<Merchant[]>({
    queryKey: ["rebelfi-merchants-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("merchants").select("id, name").order("name");
      if (error) throw error;
      return (data || []) as Merchant[];
    },
  });

  const runsQ = useQuery<SyncRun[]>({
    queryKey: ["rebelfi-sync-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rebelfi_sync_runs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []) as unknown as SyncRun[];
    },
  });

  const syncMut = useMutation({
    mutationFn: async () => {
      const body: any = {};
      if (merchantId) body.merchant_id = merchantId;
      const { data, error } = await supabase.functions.invoke("rebelfi-sync", { body });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as any;
    },
    onSuccess: (data) => {
      const v = data?.verification;
      const ok = v?.dashboard_consistent;
      toast.success(
        `Sync ✓ +${data.inserted} new · ~${data.updated} updated · ${data.skipped} skipped` +
          (ok ? ` — ledger verified` : v?.expected_ledger_entries ? ` — ⚠ ledger mismatch` : ""),
      );
      qc.invalidateQueries({ queryKey: ["rebelfi-sync-runs"] });
      qc.invalidateQueries({ queryKey: ["ledger-entries"] });
      qc.invalidateQueries({ queryKey: ["t360-accounts"] });
      onRefresh();
    },
    onError: (e: any) => toast.error(`Sync failed: ${e?.message || e}`),
  });

  // ---- Preflight preview ----
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const previewMut = useMutation({
    mutationFn: async () => {
      const body: any = { action: "preview" };
      if (merchantId) body.merchant_id = merchantId;
      const { data, error } = await supabase.functions.invoke("rebelfi-sync", { body });
      if (error) throw error;
      if ((data as any)?.ok === false) throw new Error((data as any).error);
      return data as any;
    },
    onSuccess: (data) => { setPreview(data); setPreviewOpen(true); },
    onError: (e: any) => toast.error(`Preview failed: ${e?.message || e}`),
  });

  // ---- Skipped inspector ----
  const [skippedRun, setSkippedRun] = useState<SyncRun | null>(null);

  // ---- Polling settings ----
  const pollQ = useQuery<any>({
    queryKey: ["rebelfi-poll-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rebelfi_poll_settings" as any).select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const pollMut = useMutation({
    mutationFn: async (patch: { enabled?: boolean; interval_seconds?: number; merchant_id?: string | null }) => {
      const existing: any = pollQ.data;
      if (existing?.id) {
        const { error } = await supabase.from("rebelfi_poll_settings" as any)
          .update(patch).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("rebelfi_poll_settings" as any).insert(patch);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rebelfi-poll-settings"] });
      toast.success("Polling settings saved");
    },
    onError: (e: any) => toast.error(e?.message || "Failed to save polling settings"),
  });

  return (
    <div className="space-y-4">
      {/* Sync controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4" /> RebelFi sync</CardTitle>
          <CardDescription>Pull RebelFi yield operations into the merchant's transactions and ledger.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <Label className="text-xs text-muted-foreground mb-1 block">Credit merchant</Label>
            <Select value={merchantId} onValueChange={setMerchantId}>
              <SelectTrigger><SelectValue placeholder="Default (your merchant)" /></SelectTrigger>
              <SelectContent>
                {(merchantsQ.data || []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => previewMut.mutate()} disabled={previewMut.isPending} variant="secondary" className="gap-2">
            <Eye className="h-4 w-4" /> {previewMut.isPending ? "Previewing…" : "Balance impact preview"}
          </Button>
          <Button onClick={() => syncMut.mutate()} disabled={syncMut.isPending} className="gap-2">
            <Sparkles className="h-4 w-4" /> {syncMut.isPending ? "Syncing…" : "Sync yield to ledger"}
          </Button>
          <RegisterWalletDialog onDone={onRefresh} />
          <SupplyUnwindDialog mode="supply" wallets={wallets} venues={venues} onDone={onRefresh} />
          <SupplyUnwindDialog mode="unwind" wallets={wallets} venues={venues} onDone={onRefresh} />
        </CardContent>
      </Card>

      {/* Auto-polling */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Radio className="h-4 w-4" /> Auto-polling</CardTitle>
          <CardDescription>
            Automatically pull RebelFi operation status changes into the ledger on a schedule (cron runs every minute, throttled by interval).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={!!pollQ.data?.enabled}
              onCheckedChange={(v) => pollMut.mutate({ enabled: v })}
              disabled={pollMut.isPending || pollQ.isLoading}
            />
            <Label className="text-sm">{pollQ.data?.enabled ? "Enabled" : "Disabled"}</Label>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Interval (seconds)</Label>
            <Input
              type="number" min={60} step={30}
              defaultValue={pollQ.data?.interval_seconds ?? 300}
              onBlur={(e) => {
                const n = Math.max(60, Number(e.target.value) || 300);
                if (n !== pollQ.data?.interval_seconds) pollMut.mutate({ interval_seconds: n });
              }}
              className="w-32"
            />
          </div>
          <div className="min-w-[220px]">
            <Label className="text-xs text-muted-foreground mb-1 block">Polled merchant</Label>
            <Select
              value={pollQ.data?.merchant_id || ""}
              onValueChange={(v) => pollMut.mutate({ merchant_id: v || null })}
            >
              <SelectTrigger><SelectValue placeholder="First merchant" /></SelectTrigger>
              <SelectContent>
                {(merchantsQ.data || []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div>Last run: {pollQ.data?.last_run_at ? new Date(pollQ.data.last_run_at).toLocaleString() : "—"}</div>
            <div>Status: {pollQ.data?.last_status || "—"}{pollQ.data?.last_error ? ` · ${pollQ.data.last_error}` : ""}</div>
          </div>
        </CardContent>
      </Card>

      {/* Run history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Sync run history</CardTitle>
          <CardDescription>Last 10 runs with insert/update/skip counts and ledger verification.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>When</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-right">Scanned</TableHead>
              <TableHead className="text-right">Inserted</TableHead>
              <TableHead className="text-right">Updated</TableHead>
              <TableHead className="text-right">Skipped</TableHead>
              <TableHead>Verified</TableHead><TableHead>Errors</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {runsQ.isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : (runsQ.data || []).length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">No runs yet — click Sync to begin.</TableCell></TableRow>
              ) : (runsQ.data || []).map((r) => {
                const v = r.verification || {};
                const consistent = v?.dashboard_consistent === true;
                const errCount = Array.isArray(r.errors) ? r.errors.length : 0;
                const skippedCount = Array.isArray(r.skipped_details) ? r.skipped_details.length : 0;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] uppercase">{r.source || "manual"}</Badge></TableCell>
                    <TableCell><Badge variant={r.status === "success" ? "default" : r.status === "partial" ? "secondary" : "destructive"}>{r.status}</Badge></TableCell>
                    <TableCell className="text-right">{r.scanned}</TableCell>
                    <TableCell className="text-right text-emerald-600">{r.inserted}</TableCell>
                    <TableCell className="text-right">{r.updated}</TableCell>
                    <TableCell className="text-right">
                      {skippedCount > 0 ? (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1"
                          onClick={() => setSkippedRun(r)}>
                          {r.skipped} <Info className="h-3 w-3" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">{r.skipped}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.inserted === 0 ? (
                        <span className="text-xs text-muted-foreground">n/a</span>
                      ) : consistent ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><ShieldCheck className="h-3.5 w-3.5" /> Yes</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="h-3.5 w-3.5" /> Mismatch</span>
                      )}
                    </TableCell>
                    <TableCell>{errCount > 0 ? <Badge variant="destructive">{errCount}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        preview={preview}
        onConfirm={() => { setPreviewOpen(false); syncMut.mutate(); }}
        confirming={syncMut.isPending}
      />
      <SkippedDialog run={skippedRun} onClose={() => setSkippedRun(null)} />
    </div>
  );
}

function PreviewDialog({ open, onOpenChange, preview, onConfirm, confirming }: any) {
  const p = preview?.preview;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Balance impact preview</DialogTitle>
          <DialogDescription>
            Estimated changes if you run sync now. No data has been written yet.
          </DialogDescription>
        </DialogHeader>
        {!p ? (
          <div className="text-sm text-muted-foreground">Nothing to apply — no new RebelFi operations to credit.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">New transactions</div>
                <div className="text-2xl font-semibold text-emerald-600">+{p.totals.new_transactions}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Status updates</div>
                <div className="text-2xl font-semibold">{p.totals.updated_transactions}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Idempotency conflicts</div>
                <div className="text-2xl font-semibold text-amber-600">{p.totals.idempotency_conflicts}</div>
              </div>
            </div>
            {p.currencies.length === 0 ? (
              <div className="text-sm text-muted-foreground">No balance deltas — nothing new to credit.</div>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Credit Δ</TableHead>
                  <TableHead className="text-right">Current balance</TableHead>
                  <TableHead className="text-right">Projected balance</TableHead>
                  <TableHead className="text-right">Available Δ</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {p.currencies.map((c: any) => (
                    <TableRow key={c.currency}>
                      <TableCell className="font-medium">{c.currency}</TableCell>
                      <TableCell className="text-right text-emerald-600">+{c.credit_delta.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{c.current_balance.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">{c.projected_balance.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-emerald-600">+{(c.projected_available - c.current_available).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={onConfirm} disabled={confirming || !p || p.totals.new_transactions === 0}>
            {confirming ? "Applying…" : "Apply now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SkippedDialog({ run, onClose }: { run: SyncRun | null; onClose: () => void }) {
  const details: any[] = Array.isArray(run?.skipped_details) ? run!.skipped_details : [];
  const conflicts = details.filter((d) => d.reason === "idempotency_conflict");
  const others = details.filter((d) => d.reason !== "idempotency_conflict");
  return (
    <Dialog open={!!run} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Skipped operations</DialogTitle>
          <DialogDescription>
            {run ? new Date(run.created_at).toLocaleString() : ""} — {details.length} skipped, of which {conflicts.length} were idempotency conflicts.
          </DialogDescription>
        </DialogHeader>
        {conflicts.length > 0 && (
          <div>
            <div className="text-xs uppercase text-muted-foreground mb-2">Idempotency conflicts</div>
            <div className="rounded-md border max-h-[320px] overflow-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Idempotency key</TableHead>
                  <TableHead>Existing tx</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Ledger entries</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {conflicts.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{c.idempotency_key}</TableCell>
                      <TableCell className="font-mono text-xs">{(c.existing_transaction_id || "").slice(0, 8)}…</TableCell>
                      <TableCell><Badge variant="outline">{c.existing_status}</Badge></TableCell>
                      <TableCell className="text-right">{Number(c.existing_amount || 0).toFixed(2)} {c.existing_currency}</TableCell>
                      <TableCell className="text-right">
                        {Array.isArray(c.ledger_entries) ? c.ledger_entries.length : 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <details className="mt-2 text-xs text-muted-foreground">
              <summary className="cursor-pointer">View raw ledger entries</summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-2 text-[10px]">{JSON.stringify(conflicts.map((c) => ({ key: c.idempotency_key, ledger: c.ledger_entries })), null, 2)}</pre>
            </details>
          </div>
        )}
        {others.length > 0 && (
          <div>
            <div className="text-xs uppercase text-muted-foreground mb-2 mt-2">Other skips</div>
            <pre className="max-h-48 overflow-auto rounded bg-muted p-2 text-[10px]">{JSON.stringify(others, null, 2)}</pre>
          </div>
        )}
        <DialogFooter><Button variant="ghost" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RegisterWalletDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [blockchain, setBlockchain] = useState("ethereum");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!walletAddress.trim()) return toast.error("Wallet address required");
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("rebelfi-proxy", {
        body: { action: "register_wallet", walletAddress: walletAddress.trim(), blockchain, label: label || undefined },
      });
      if (error) throw error;
      if ((data as any)?.ok === false) throw new Error((data as any).error || "RebelFi rejected the request");
      toast.success("Wallet registered with RebelFi");
      setOpen(false);
      setWalletAddress(""); setLabel("");
      onDone();
    } catch (e: any) {
      toast.error(`Register failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><Wallet className="h-4 w-4" /> Register wallet</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register RebelFi yield wallet</DialogTitle>
          <DialogDescription>Custody stays with you — RebelFi orchestrates supply &amp; unwind.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Wallet address</Label>
            <Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x… or Solana pubkey" className="font-mono text-xs" />
          </div>
          <div>
            <Label>Blockchain</Label>
            <Select value={blockchain} onValueChange={setBlockchain}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CHAINS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Label (optional)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Treasury main" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Registering…" : "Register"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SupplyUnwindDialog({
  mode, wallets, venues, onDone,
}: { mode: "supply" | "unwind"; wallets: any[]; venues: any[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [strategyId, setStrategyId] = useState("");
  const [token, setToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Flatten venue.strategies if present
  const strategies = (venues || []).flatMap((v: any) =>
    (v.strategies || []).map((s: any) => ({
      id: s.id ?? s.strategyId,
      label: `${v.name || v.venueName || "Venue"} · ${s.name || s.tokenSymbol || s.id}`,
      token: s.tokenSymbol || s.token || "USDC",
    })),
  );

  const submit = async () => {
    if (!walletAddress || !strategyId || !amount) return toast.error("Wallet, strategy, and amount required");
    const dec = TOKEN_DECIMALS[token.toUpperCase()] ?? 6;
    const baseUnits = BigInt(Math.floor(Number(amount) * 10 ** dec)).toString();
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("rebelfi-proxy", {
        body: { action: mode, walletAddress, strategyId: Number(strategyId) || strategyId, amount: baseUnits },
      });
      if (error) throw error;
      if ((data as any)?.ok === false) throw new Error((data as any).error || "RebelFi rejected the request");
      const op = (data as any)?.data || data;
      setResult(op);
      toast.success(`${mode === "supply" ? "Supply" : "Unwind"} planned — operation ${op?.id || op?.operationId || "created"}`);
      onDone();
    } catch (e: any) {
      toast.error(`${mode} failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const Icon = mode === "supply" ? ArrowUpRight : ArrowDownRight;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setResult(null); }}>
      <DialogTrigger asChild>
        <Button variant={mode === "supply" ? "default" : "outline"} className="gap-2">
          <Icon className="h-4 w-4" /> {mode === "supply" ? "Supply" : "Unwind"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="capitalize">{mode} yield position</DialogTitle>
          <DialogDescription>Plan a {mode} operation — sign and submit on-chain after planning.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Wallet</Label>
            <Select value={walletAddress} onValueChange={setWalletAddress}>
              <SelectTrigger><SelectValue placeholder="Select registered wallet" /></SelectTrigger>
              <SelectContent>
                {(wallets || []).map((w: any, i: number) => (
                  <SelectItem key={w.id || i} value={w.address || w.walletAddress}>
                    {(w.label || w.profileName || "Wallet")} — {(w.address || w.walletAddress || "").slice(0, 12)}…
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Venue / Strategy</Label>
            {strategies.length > 0 ? (
              <Select value={strategyId} onValueChange={(v) => { setStrategyId(v); const s = strategies.find((x) => String(x.id) === v); if (s) setToken(s.token); }}>
                <SelectTrigger><SelectValue placeholder="Select strategy" /></SelectTrigger>
                <SelectContent>
                  {strategies.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={strategyId} onChange={(e) => setStrategyId(e.target.value)} placeholder="Strategy ID (e.g. 5)" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Token</Label>
              <Select value={token} onValueChange={setToken}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100.00" type="number" min="0" step="0.01" />
            </div>
          </div>

          {result && (
            <div className="rounded-md border p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">Operation</span>
                <Badge>{result.status || "planned"}</Badge>
              </div>
              <div className="font-mono break-all">{result.id || result.operationId || JSON.stringify(result).slice(0, 120)}</div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Close</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Submitting…" : `Plan ${mode}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
