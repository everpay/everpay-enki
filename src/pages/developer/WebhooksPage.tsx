import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Webhook, Plus, Send, CheckCircle2, XCircle, Clock } from "lucide-react";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { useToast } from "@/hooks/use-toast";

const eventTypes = ["payment.created","payment.succeeded","payment.failed","refund.created","refund.succeeded","merchant.created","payout.created","payout.completed","dispute.created","dispute.resolved"];

interface WebhookLog { id: string; event: string; url: string; status: "delivered"|"failed"|"pending"; statusCode: number; timestamp: string; duration: string; }
const mockLogs: WebhookLog[] = [
  { id: "1", event: "payment.succeeded", url: "https://example.com/hooks", status: "delivered", statusCode: 200, timestamp: "2026-03-09 14:32:01", duration: "234ms" },
  { id: "2", event: "payment.failed", url: "https://example.com/hooks", status: "failed", statusCode: 500, timestamp: "2026-03-09 14:30:45", duration: "1.2s" },
  { id: "3", event: "refund.created", url: "https://example.com/hooks", status: "delivered", statusCode: 200, timestamp: "2026-03-09 14:28:12", duration: "189ms" },
];

const DevWebhooksPage = () => {
  const [selectedEvent, setSelectedEvent] = useState("payment.succeeded");
  const [testUrl, setTestUrl] = useState("https://example.com/webhooks");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const sendTestEvent = () => { setIsSending(true); setTimeout(() => { setIsSending(false); toast({ title: "Test webhook sent", description: `${selectedEvent} → ${testUrl}` }); }, 1500); };
  const statusIcon = (s: string) => {
    if (s === "delivered") return <CheckCircle2 className="w-4 h-4 text-accent" />;
    if (s === "failed") return <XCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">Webhooks</Badge>
          <h1 className="text-3xl font-bold tracking-tight">Webhook Testing Console</h1>
          <p className="text-muted-foreground mt-2">Configure endpoints, test events, and view delivery logs.</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> Add Endpoint</Button>
      </div>

      <Tabs defaultValue="test">
        <TabsList>
          <TabsTrigger value="test">Test Events</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="test" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Webhook className="w-5 h-5 text-primary" /> Send Test Event</CardTitle>
              <CardDescription>Simulate webhook events to test your integration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Event Type</label>
                  <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{eventTypes.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Endpoint URL</label>
                  <Input value={testUrl} onChange={(e) => setTestUrl(e.target.value)} placeholder="https://your-app.com/webhooks" />
                </div>
              </div>
              <Button onClick={sendTestEvent} disabled={isSending} className="gap-2"><Send className="w-4 h-4" /> {isSending ? "Sending..." : "Send Test Event"}</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">Event Payload Preview</CardTitle></CardHeader>
            <CardContent>
              <CodeBlock code={`{\n  "id": "evt_test_abc123",\n  "type": "${selectedEvent}",\n  "created_at": "${new Date().toISOString()}",\n  "data": {\n    "id": "pay_test_xyz789",\n    "amount": 5000,\n    "currency": "usd",\n    "status": "${selectedEvent.includes('failed') ? 'failed' : 'succeeded'}"\n  },\n  "livemode": false\n}`} language="curl" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Recent Deliveries</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {statusIcon(log.status)}
                      <div>
                        <p className="text-sm font-medium font-mono">{log.event}</p>
                        <p className="text-xs text-muted-foreground">{log.url}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={log.status === "delivered" ? "secondary" : "destructive"} className="text-[10px]">{log.statusCode}</Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">{log.timestamp} · {log.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DevWebhooksPage;