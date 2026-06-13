import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Loader2, Send, RefreshCw, Banknote, Wallet, X } from "lucide-react";

type Settings = {
  environment: "sandbox" | "live"; enabled: boolean;
  default_send_method: string; default_notification_type: number; webhook_url?: string | null;
};
type Transfer = {
  id: string; itspaid_transaction_id: string | null; send_method: string; currency: string;
  amount: number; recipient_full_name: string; recipient_bank_account_last4: string | null;
  status: string; gateway_message: string | null; created_at: string; environment: string;
};
type Balances = {
  PAYOUT_BALANCE?: number; FLOAT_BALANCE?: number; RESERVE_BALANCE?: number;
  ACCOUNT_CURRENCY_ISO3?: string; ACCOUNT_SERVICE_STATUS?: string; GATEWAY_ERROR?: string;
};

const SEND_METHODS = ["ACH", "FEDWIRE", "SWIFT", "ZELLE", "CARD_PUSH", "CARD_VIRTUAL"];

export default function AdminItsPaid() {
  const [settings, setSettings] = useState<Settings>({
    environment: "sandbox", enabled: true, default_send_method: "ACH", default_notification_type: 0,
  });
  const [balances, setBalances] = useState<Balances | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loadingBal, setLoadingBal] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    send_method: "ACH", currency: "USD", amount: "",
    recipient_full_name: "", recipient_email: "",
    recipient_bank_account: "", recipient_bank_routing: "",
    public_description: "", admin_message: "",
  });

  const call = useCallback(async (action: string, extra: any = {}) => {
    const { data, error } = await supabase.functions.invoke("itspaid-ach", { body: { action, ...extra } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  const loadSettings = useCallback(async () => {
    try { const d = await call("get_settings"); if (d?.settings) setSettings(s => ({ ...s, ...d.settings })); }
    catch (e) { console.error(e); }
  }, [call]);

  const loadBalance = useCallback(async () => {
    setLoadingBal(true);
    try { setBalances(await call("balance")); }
    catch (e: any) { toast({ title: "Balance error", description: e.message, variant: "destructive" }); }
    finally { setLoadingBal(false); }
  }, [call]);

  const loadTransfers = useCallback(async () => {
    const { data } = await supabase.from("itspaid_transfers").select("*")
      .order("created_at", { ascending: false }).limit(50);
    setTransfers((data as any) || []);
  }, []);

  useEffect(() => { loadSettings(); loadBalance(); loadTransfers(); }, [loadSettings, loadBalance, loadTransfers]);

  const saveSettings = async () => {
    try {
      const d = await call("save_settings", settings);
      if (d?.settings) setSettings(s => ({ ...s, ...d.settings }));
      toast({ title: "Settings saved" });
      loadBalance();
    } catch (e: any) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
  };

  const sendMoney = async () => {
    if (!form.amount || !form.recipient_full_name || !form.recipient_bank_account || !form.recipient_bank_routing) {
      toast({ title: "Missing fields", description: "Name, amount, account, routing required", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const d = await call("send", { ...form, amount: parseFloat(form.amount) });
      toast({ title: "Transfer initiated", description: `Transaction: ${d.TRANSACTION_ID || d.transfer?.id}` });
      setForm({ ...form, amount: "", public_description: "", admin_message: "" });
      loadTransfers(); loadBalance();
    } catch (e: any) { toast({ title: "Send failed", description: e.message, variant: "destructive" }); }
    finally { setSending(false); }
  };

  const cancelTransfer = async (t: Transfer) => {
    if (!t.itspaid_transaction_id) return;
    try {
      await call("cancel", { transfer_id: t.id, itspaid_transaction_id: t.itspaid_transaction_id });
      toast({ title: "Cancel requested" });
      loadTransfers(); loadBalance();
    } catch (e: any) { toast({ title: "Cancel failed", description: e.message, variant: "destructive" }); }
  };

  const fmt = (n?: number) =>
    n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: balances?.ACCOUNT_CURRENCY_ISO3 || "USD" }).format(n);

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">ItsPaid · ACH &amp; Payouts</h1>
          <p className="text-muted-foreground mt-1">ACH, Fedwire, SWIFT, Zelle, push-to-card and virtual cards.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={settings.environment === "live" ? "default" : "secondary"}>{settings.environment.toUpperCase()}</Badge>
          <Badge variant={settings.enabled ? "default" : "outline"}>{settings.enabled ? "Enabled" : "Disabled"}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardDescription>Payout Balance</CardDescription>
          <CardTitle className="text-2xl">{fmt(balances?.PAYOUT_BALANCE)}</CardTitle></CardHeader>
          <CardContent><Wallet className="h-4 w-4 text-muted-foreground" /></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Float Balance</CardDescription>
          <CardTitle className="text-2xl">{fmt(balances?.FLOAT_BALANCE)}</CardTitle></CardHeader>
          <CardContent><Banknote className="h-4 w-4 text-muted-foreground" /></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Reserve Balance</CardDescription>
          <CardTitle className="text-2xl">{fmt(balances?.RESERVE_BALANCE)}</CardTitle></CardHeader>
          <CardContent>
            <Button size="sm" variant="ghost" onClick={loadBalance} disabled={loadingBal}>
              {loadingBal ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Refresh</span>
            </Button>
          </CardContent></Card>
      </div>
      {balances?.GATEWAY_ERROR && <p className="text-sm text-destructive">{balances.GATEWAY_ERROR}</p>}

      <Tabs defaultValue="send" className="w-full">
        <TabsList>
          <TabsTrigger value="send">Send Money</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <Card>
            <CardHeader><CardTitle>Send a payout</CardTitle>
              <CardDescription>ACH, Fedwire, SWIFT, Zelle, push-to-card.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div><Label>Method</Label>
                <Select value={form.send_method} onValueChange={(v) => setForm({ ...form, send_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SEND_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Currency</Label>
                <Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></div>
              <div><Label>Amount</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>Recipient full name</Label>
                <Input value={form.recipient_full_name} onChange={e => setForm({ ...form, recipient_full_name: e.target.value })} /></div>
              <div><Label>Recipient email</Label>
                <Input value={form.recipient_email} onChange={e => setForm({ ...form, recipient_email: e.target.value })} /></div>
              <div><Label>Bank routing (ABA)</Label>
                <Input value={form.recipient_bank_routing} onChange={e => setForm({ ...form, recipient_bank_routing: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Bank account number</Label>
                <Input value={form.recipient_bank_account} onChange={e => setForm({ ...form, recipient_bank_account: e.target.value })} /></div>
              <div><Label>Public description</Label>
                <Input value={form.public_description} onChange={e => setForm({ ...form, public_description: e.target.value })} /></div>
              <div><Label>Internal admin message</Label>
                <Input value={form.admin_message} onChange={e => setForm({ ...form, admin_message: e.target.value })} /></div>
              <div className="md:col-span-2">
                <Button onClick={sendMoney} disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Send {form.send_method} {form.amount && `· ${form.currency} ${form.amount}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent transfers</CardTitle>
              <Button size="sm" variant="outline" onClick={loadTransfers}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Created</TableHead><TableHead>Recipient</TableHead><TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Txn ID</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {transfers.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No transfers yet</TableCell></TableRow>
                  )}
                  {transfers.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs">{new Date(t.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="font-medium">{t.recipient_full_name}</div>
                        <div className="text-xs text-muted-foreground">••{t.recipient_bank_account_last4}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{t.send_method}</Badge></TableCell>
                      <TableCell>{t.currency} {Number(t.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === "INITIATED" ? "secondary" : (t.status === "CANCELED" || t.status === "FAILED") ? "destructive" : "default"}>
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{t.itspaid_transaction_id?.slice(0, 12)}…</TableCell>
                      <TableCell>
                        {t.status === "INITIATED" && (
                          <Button size="sm" variant="ghost" onClick={() => cancelTransfer(t)}><X className="h-4 w-4" /></Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle>ItsPaid configuration</CardTitle>
              <CardDescription>Credentials stored as platform secrets. Toggle environment and webhook.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label>Enabled</Label><p className="text-xs text-muted-foreground">Toggle ItsPaid payouts.</p></div>
                <Switch checked={settings.enabled} onCheckedChange={v => setSettings({ ...settings, enabled: v })} />
              </div>
              <div><Label>Environment</Label>
                <Select value={settings.environment} onValueChange={(v: any) => setSettings({ ...settings, environment: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select></div>
              <div><Label>Default send method</Label>
                <Select value={settings.default_send_method} onValueChange={v => setSettings({ ...settings, default_send_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SEND_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Payout webhook URL</Label>
                <Input readOnly value={`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/itspaid-webhook`} /></div>
              <Button onClick={saveSettings}>Save settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
