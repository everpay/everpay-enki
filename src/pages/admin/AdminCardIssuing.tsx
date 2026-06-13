import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Loader2, CreditCard, RefreshCw, Plus, Eye } from "lucide-react";

type IssuedCard = {
  id: string; card_account_id: string | null;
  recipient_full_name: string; recipient_email: string;
  card_last4: string | null; card_expiration: string | null;
  currency: string; balance: number; initial_load: number;
  status: string; environment: string; created_at: string;
};

export default function AdminCardIssuing() {
  const [cards, setCards] = useState<IssuedCard[]>([]);
  const [issuing, setIssuing] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    recipient_first_name: "", recipient_last_name: "", recipient_email: "",
    amount: "", public_description: "Virtual card load", admin_message: "",
  });

  const call = useCallback(async (action: string, extra: any = {}) => {
    const { data, error } = await supabase.functions.invoke("itspaid-ach", { body: { action, ...extra } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  const loadCards = useCallback(async () => {
    const { data } = await supabase.from("itspaid_cards").select("*")
      .order("created_at", { ascending: false }).limit(100);
    setCards((data as any) || []);
  }, []);

  useEffect(() => { loadCards(); }, [loadCards]);

  const issueCard = async () => {
    if (!form.recipient_first_name || !form.recipient_last_name || !form.recipient_email || !form.amount) {
      toast({ title: "Missing fields", description: "Name, email, amount required", variant: "destructive" });
      return;
    }
    setIssuing(true);
    try {
      const d = await call("issue_card", {
        amount: parseFloat(form.amount),
        recipient_full_name: `${form.recipient_first_name} ${form.recipient_last_name}`,
        recipient_first_name: form.recipient_first_name,
        recipient_last_name: form.recipient_last_name,
        recipient_email: form.recipient_email,
        public_description: form.public_description,
        admin_message: form.admin_message,
      });
      if (d?.GATEWAY_ERROR || d?.TRANSACTION_STATUS === "FAILED") {
        toast({ title: "Card issuance failed", description: d.GATEWAY_MESSAGE || d.GATEWAY_ERROR, variant: "destructive" });
      } else {
        toast({ title: "Virtual card issued", description: `Card ${d.card?.card_last4 ? `••${d.card.card_last4}` : ""} loaded with $${form.amount}` });
      }
      setForm({ ...form, amount: "", recipient_email: "" });
      loadCards();
    } catch (e: any) { toast({ title: "Issue failed", description: e.message, variant: "destructive" }); }
    finally { setIssuing(false); }
  };

  const refreshCard = async (c: IssuedCard) => {
    if (!c.card_account_id) return;
    setRefreshingId(c.id);
    try {
      const [first, ...rest] = c.recipient_full_name.split(" ");
      await call("card_details", { card_account_id: c.card_account_id, recipient_first_name: first, recipient_last_name: rest.join(" ") });
      loadCards();
      toast({ title: "Card refreshed" });
    } catch (e: any) { toast({ title: "Refresh failed", description: e.message, variant: "destructive" }); }
    finally { setRefreshingId(null); }
  };

  const fmt = (n: number, ccy = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: ccy }).format(n);
  const totalIssued = cards.reduce((s, c) => s + Number(c.initial_load || 0), 0);
  const totalBalance = cards.reduce((s, c) => s + Number(c.balance || 0), 0);
  const activeCards = cards.filter(c => c.status === "ACTIVE" || c.status === "INITIATED").length;

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Card Issuing</h1>
          <p className="text-muted-foreground mt-1">Issue PCI-compliant virtual debit cards via ItsPaid.</p>
        </div>
        <Badge variant="outline" className="text-xs">CARD_VIRTUAL</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardDescription>Active cards</CardDescription>
          <CardTitle className="text-2xl">{activeCards}</CardTitle></CardHeader>
          <CardContent><CreditCard className="h-4 w-4 text-muted-foreground" /></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total loaded</CardDescription>
          <CardTitle className="text-2xl">{fmt(totalIssued)}</CardTitle></CardHeader><CardContent /></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Current balance</CardDescription>
          <CardTitle className="text-2xl">{fmt(totalBalance)}</CardTitle></CardHeader>
          <CardContent><Button size="sm" variant="ghost" onClick={loadCards}><RefreshCw className="h-4 w-4 mr-2" />Reload</Button></CardContent></Card>
      </div>

      <Tabs defaultValue="issue">
        <TabsList>
          <TabsTrigger value="issue">Issue card</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="issue">
          <Card>
            <CardHeader>
              <CardTitle>Issue new virtual card</CardTitle>
              <CardDescription>Last-4 only is stored. Full PAN is delivered directly to the recipient.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div><Label>Recipient first name</Label>
                <Input value={form.recipient_first_name} onChange={e => setForm({ ...form, recipient_first_name: e.target.value })} /></div>
              <div><Label>Recipient last name</Label>
                <Input value={form.recipient_last_name} onChange={e => setForm({ ...form, recipient_last_name: e.target.value })} /></div>
              <div><Label>Recipient email</Label>
                <Input type="email" value={form.recipient_email} onChange={e => setForm({ ...form, recipient_email: e.target.value })} /></div>
              <div><Label>Load amount (USD)</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>Public description</Label>
                <Input value={form.public_description} onChange={e => setForm({ ...form, public_description: e.target.value })} /></div>
              <div><Label>Internal note</Label>
                <Input value={form.admin_message} onChange={e => setForm({ ...form, admin_message: e.target.value })} /></div>
              <div className="md:col-span-2">
                <Button onClick={issueCard} disabled={issuing}>
                  {issuing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Issue {form.amount && `$${form.amount} `}virtual card
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Issued cards</CardTitle>
              <Button size="sm" variant="outline" onClick={loadCards}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Issued</TableHead><TableHead>Recipient</TableHead><TableHead>Card</TableHead>
                  <TableHead>Expires</TableHead><TableHead>Balance</TableHead><TableHead>Status</TableHead>
                  <TableHead>Env</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {cards.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No virtual cards issued yet</TableCell></TableRow>
                  )}
                  {cards.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs">{new Date(c.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="font-medium">{c.recipient_full_name}</div>
                        <div className="text-xs text-muted-foreground">{c.recipient_email}</div>
                      </TableCell>
                      <TableCell><span className="font-mono">•••• {c.card_last4 || "—"}</span></TableCell>
                      <TableCell className="text-xs">{c.card_expiration || "—"}</TableCell>
                      <TableCell>{fmt(Number(c.balance), c.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "ACTIVE" ? "default" : c.status === "FAILED" ? "destructive" : "secondary"}>{c.status}</Badge>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{c.environment}</Badge></TableCell>
                      <TableCell>
                        {c.card_account_id && (
                          <Button size="sm" variant="ghost" onClick={() => refreshCard(c)} disabled={refreshingId === c.id}>
                            {refreshingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
