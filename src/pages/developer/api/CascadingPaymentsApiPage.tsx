import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";
import { RefreshCw, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";

const CascadingPaymentsApiPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <Badge variant="secondary" className="mb-3">API Reference</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Cascading Payments API</h1>
        <p className="text-muted-foreground mt-2">
          Maximize payment success rates by automatically routing failed transactions to fallback processors. 
          Everpay's cascading engine retries across multiple connected gateways to recover otherwise lost revenue.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" /> How Cascading Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>When a payment fails on one processor, Everpay can automatically retry on an alternative gateway. This works with <code className="text-xs bg-muted px-1 py-0.5 rounded">payment</code> and <code className="text-xs bg-muted px-1 py-0.5 rounded">authorization</code> transaction types, and only for <code className="text-xs bg-muted px-1 py-0.5 rounded">failed</code> status (not <code className="text-xs bg-muted px-1 py-0.5 rounded">expired</code> or <code className="text-xs bg-muted px-1 py-0.5 rounded">incomplete</code>).</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">1</Badge>
                <span className="font-medium text-foreground text-xs">Submit Payment</span>
              </div>
              <p className="text-[11px]">Send payment to primary processor.</p>
            </div>
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">2</Badge>
                <span className="font-medium text-foreground text-xs">Detect Failure</span>
              </div>
              <p className="text-[11px]">If status is <code className="text-[10px] bg-muted px-1 rounded">failed</code>, capture the <code className="text-[10px] bg-muted px-1 rounded">gateway_id</code>.</p>
            </div>
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">3</Badge>
                <span className="font-medium text-foreground text-xs">Retry w/ Exclusion</span>
              </div>
              <p className="text-[11px]">Resend with <code className="text-[10px] bg-muted px-1 rounded">excluded_gateways</code> and <code className="text-[10px] bg-muted px-1 rounded">duplicate_check: false</code>.</p>
            </div>
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">4</Badge>
                <span className="font-medium text-foreground text-xs">Success or Exhaust</span>
              </div>
              <p className="text-[11px]">Repeat until successful or all gateways exhausted.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">The Cascade Attempt Object</CardTitle></CardHeader>
        <CardContent>
          <CodeBlock code={`{
  "id": "cascade_abc123",
  "object": "cascade_attempt",
  "payment_intent_id": "pi_xyz789",
  "attempt_number": 2,
  "gateway_id": "gw_shieldhub_01",
  "processor": "shieldhub",
  "status": "successful",
  "response_code": "S.0000",
  "response_message": "Payment was approved",
  "auth_code": "654321",
  "latency_ms": 1240,
  "excluded_gateways": ["gw_facilitapay_01"],
  "created_at": "2026-03-25T12:00:02Z"
}`} language="curl" />
        </CardContent>
      </Card>

      <ApiEndpoint
        method="POST"
        path="/v2/payments/cascade"
        title="Create Cascading Payment"
        description="Submit a payment with automatic cascading enabled. Everpay routes through connected processors, excluding failed gateways on each retry."
        params={[
          { name: "amount", type: "number", required: true, desc: "Amount in minor units" },
          { name: "currency", type: "string", required: true, desc: "ISO 4217 currency code" },
          { name: "card", type: "object", required: true, desc: "Card details, VGS alias, or saved card token" },
          { name: "customer", type: "object", required: false, desc: "Customer IP, email, device info" },
          { name: "description", type: "string", required: false, desc: "Payment description" },
          { name: "tracking_id", type: "string", required: false, desc: "Your internal reference" },
          { name: "cascade", type: "object", required: false, desc: "Cascade configuration" },
          { name: "cascade.enabled", type: "boolean", required: false, desc: "Enable cascading (default: true if multiple gateways)" },
          { name: "cascade.max_attempts", type: "number", required: false, desc: "Max retry attempts (default: 3)" },
          { name: "cascade.excluded_gateways", type: "array", required: false, desc: "Gateway IDs to skip" },
          { name: "notification_url", type: "string", required: false, desc: "Webhook URL for async updates" },
          { name: "duplicate_check", type: "boolean", required: false, desc: "Set false for cascade retries" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v2/payments/cascade \\
  -H "Authorization: Bearer sk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -H "X-Idempotency-Key: cascade_order_12345" \\
  -d '{
    "amount": 5000,
    "currency": "USD",
    "description": "Order #12345",
    "tracking_id": "order_12345",
    "card": {
      "vgs_alias": "tok_sandbox_abc123",
      "holder": "John Doe",
      "exp_month": "08",
      "exp_year": "2028"
    },
    "customer": {
      "ip": "203.0.113.45",
      "email": "john@example.com"
    },
    "cascade": {
      "enabled": true,
      "max_attempts": 3
    }
  }'`,
          node: `const payment = await everpay.payments.cascade({
  amount: 5000,
  currency: 'USD',
  tracking_id: 'order_12345',
  card: { vgs_alias: 'tok_sandbox_abc123' },
  cascade: { enabled: true, max_attempts: 3 },
});`,
          python: `payment = everpay.Payments.cascade(
  amount=5000,
  currency="USD",
  tracking_id="order_12345",
  card={"vgs_alias": "tok_sandbox_abc123"},
  cascade={"enabled": True, "max_attempts": 3},
)`,
        }}
        response={`{
  "id": "pi_cascade_xyz",
  "object": "payment_intent",
  "status": "successful",
  "amount": 5000,
  "currency": "USD",
  "cascade_summary": {
    "total_attempts": 2,
    "successful_gateway": "gw_shieldhub_01",
    "attempts": [
      {
        "attempt": 1,
        "gateway_id": "gw_facilitapay_01",
        "processor": "facilitapay",
        "status": "failed",
        "response_code": "E.5001",
        "latency_ms": 890
      },
      {
        "attempt": 2,
        "gateway_id": "gw_shieldhub_01",
        "processor": "shieldhub",
        "status": "successful",
        "response_code": "S.0000",
        "auth_code": "654321",
        "latency_ms": 1240
      }
    ]
  },
  "created_at": "2026-03-25T12:00:00Z"
}`}
      />

      <ApiEndpoint
        method="POST"
        path="/v2/payments/cascade/retry"
        title="Manual Cascade Retry"
        description="Manually retry a failed payment on the next available gateway. Use when you want explicit control over the cascade flow instead of automatic retries."
        params={[
          { name: "payment_intent_id", type: "string", required: true, desc: "The failed payment intent" },
          { name: "excluded_gateways", type: "array", required: true, desc: "Gateway IDs that already failed" },
          { name: "duplicate_check", type: "boolean", required: false, desc: "Must be false for retries" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v2/payments/cascade/retry \\
  -H "Authorization: Bearer sk_live_your_key" \\
  -d '{
    "payment_intent_id": "pi_failed_abc",
    "excluded_gateways": ["gw_facilitapay_01", "gw_makapay_01"],
    "duplicate_check": false
  }'`,
          node: `const retry = await everpay.payments.cascadeRetry({
  payment_intent_id: 'pi_failed_abc',
  excluded_gateways: ['gw_facilitapay_01', 'gw_makapay_01'],
});`,
          python: `retry = everpay.Payments.cascade_retry(
  payment_intent_id="pi_failed_abc",
  excluded_gateways=["gw_facilitapay_01", "gw_makapay_01"],
)`,
        }}
        response={`{
  "id": "pi_failed_abc",
  "status": "successful",
  "cascade_attempt": {
    "attempt": 3,
    "gateway_id": "gw_shieldhub_01",
    "processor": "shieldhub",
    "status": "successful",
    "auth_code": "789012"
  }
}`}
      />

      <ApiEndpoint
        method="GET"
        path="/v2/payments/:id/cascade-history"
        title="Get Cascade History"
        description="Retrieve the full cascade attempt history for a payment, including all gateway attempts, response codes, and latency."
        params={[
          { name: "id", type: "string", required: true, desc: "Payment intent ID" },
        ]}
        code={{
          curl: `curl https://api.everpayinc.com/v2/payments/pi_xyz789/cascade-history \\
  -H "Authorization: Bearer sk_live_your_key"`,
          node: `const history = await everpay.payments.cascadeHistory('pi_xyz789');`,
          python: `history = everpay.Payments.cascade_history("pi_xyz789")`,
        }}
        response={`{
  "object": "list",
  "payment_intent_id": "pi_xyz789",
  "total_attempts": 2,
  "data": [
    {
      "attempt": 1,
      "gateway_id": "gw_facilitapay_01",
      "processor": "facilitapay",
      "status": "failed",
      "response_code": "E.5001",
      "response_message": "Insufficient funds",
      "latency_ms": 890,
      "created_at": "2026-03-25T12:00:00Z"
    },
    {
      "attempt": 2,
      "gateway_id": "gw_shieldhub_01",
      "processor": "shieldhub",
      "status": "successful",
      "response_code": "S.0000",
      "auth_code": "654321",
      "latency_ms": 1240,
      "created_at": "2026-03-25T12:00:02Z"
    }
  ]
}`}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Routing Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>Everpay's routing engine selects fallback gateways based on:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>PSP routing rules</strong> — merchant-configured priority and weight for each processor</li>
            <li><strong>Currency support</strong> — only gateways supporting the transaction currency are considered</li>
            <li><strong>Real-time success rates</strong> — processors with higher recent success rates are preferred</li>
            <li><strong>Latency</strong> — lower latency gateways are prioritized for time-sensitive transactions</li>
            <li><strong>BIN routing</strong> — card issuer country may influence optimal processor selection</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>Cascading only triggers on <code className="text-xs bg-muted px-1 py-0.5 rounded">failed</code> status — <code className="text-xs bg-muted px-1 py-0.5 rounded">expired</code> and <code className="text-xs bg-muted px-1 py-0.5 rounded">incomplete</code> transactions are not retried.</li>
            <li>Set <code className="text-xs bg-muted px-1 py-0.5 rounded">duplicate_check: false</code> on manual retries to prevent idempotency rejection.</li>
            <li>Each cascade attempt is logged as a separate <code className="text-xs bg-muted px-1 py-0.5 rounded">payment_attempt</code> record for full audit trail.</li>
            <li>The fraud engine re-evaluates risk on each cascade attempt — a high-risk score can block retries.</li>
            <li>Maximum cascade depth is configurable per merchant (default: 3 attempts).</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-accent" /> Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>Cascade-related webhook events:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 border rounded-lg px-4 py-2">
              <Badge variant="outline" className="text-xs font-mono">payment.cascade.initiated</Badge>
              <span className="text-xs">Cascade retry started after primary failure</span>
            </div>
            <div className="flex items-center gap-3 border rounded-lg px-4 py-2">
              <Badge variant="outline" className="text-xs font-mono">payment.cascade.succeeded</Badge>
              <span className="text-xs">Payment recovered via fallback gateway</span>
            </div>
            <div className="flex items-center gap-3 border rounded-lg px-4 py-2">
              <Badge variant="outline" className="text-xs font-mono">payment.cascade.exhausted</Badge>
              <span className="text-xs">All gateways failed — payment not recoverable</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CascadingPaymentsApiPage;
