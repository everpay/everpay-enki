import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";
import { Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

const ThreeDSecureApiPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <Badge variant="secondary" className="mb-3">API Reference</Badge>
        <h1 className="text-3xl font-bold tracking-tight">3D Secure API</h1>
        <p className="text-muted-foreground mt-2">Authenticate card payments with 3D Secure (3DS) to reduce fraud and shift liability. Everpay's 3DS Decision Engine automatically enforces authentication based on risk scores, merchant settings, and regulatory requirements (PSD2/SCA).</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> How 3DS Works</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>When a payment requires 3DS authentication, Everpay returns a <code className="text-xs bg-muted px-1 py-0.5 rounded">requires_action</code> status with a redirect URL. The customer completes authentication with their bank, then Everpay finalizes the payment.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2"><Badge variant="outline" className="text-xs">1</Badge><span className="font-medium text-foreground">Create Payment</span></div>
              <p className="text-xs">Submit payment with card details. Engine evaluates risk.</p>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2"><Badge variant="outline" className="text-xs">2</Badge><span className="font-medium text-foreground">3DS Challenge</span></div>
              <p className="text-xs">If required, redirect customer to bank's 3DS page.</p>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2"><Badge variant="outline" className="text-xs">3</Badge><span className="font-medium text-foreground">Confirm</span></div>
              <p className="text-xs">After authentication, confirm the payment intent.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">The 3DS Authentication Object</CardTitle></CardHeader>
        <CardContent>
          <CodeBlock code={`{
  "id": "3ds_auth_abc123",
  "object": "three_d_secure",
  "payment_intent_id": "pi_xyz789",
  "status": "succeeded",
  "version": "2.2.0",
  "eci": "05",
  "cavv": "AAABBJkZUQAAAABkEmVkBTdAAAA=",
  "ds_transaction_id": "97267598-FAE6-48F5-8E82-EBE6B3E2F3B0",
  "acs_url": null,
  "redirect_url": null,
  "liability_shift": true,
  "risk_score": 25,
  "created_at": "2026-03-25T12:00:00Z"
}`} language="curl" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> 3DS Decision Engine</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>Everpay automatically determines whether 3DS is required based on:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Merchant settings</strong> — per-merchant 3DS toggle, risk threshold, and decline threshold</li>
            <li><strong>Risk score</strong> — transactions with risk score above the merchant's threshold trigger 3DS</li>
            <li><strong>Regulatory requirements</strong> — SCA/PSD2 mandates for EEA transactions</li>
            <li><strong>Amount thresholds</strong> — low-value exemptions (under €30 EUR)</li>
            <li><strong>Processor capability</strong> — skip if the PSP already handles 3DS natively</li>
          </ul>
          <p>Transactions with risk score &gt; 90 are automatically <strong>blocked</strong> regardless of 3DS settings.</p>
        </CardContent>
      </Card>

      <ApiEndpoint
        method="POST"
        path="/v2/payments/3d-secure/authenticate"
        title="Initiate 3DS Authentication"
        description="Trigger 3D Secure authentication for a payment intent. Returns a redirect URL if challenge is required."
        params={[
          { name: "payment_intent_id", type: "string", required: true, desc: "The payment intent to authenticate" },
          { name: "return_url", type: "string", required: true, desc: "URL to redirect after 3DS completion" },
          { name: "force_challenge", type: "boolean", required: false, desc: "Force 3DS challenge regardless of risk score" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v2/payments/3d-secure/authenticate \\
  -H "Authorization: Bearer sk_test_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "payment_intent_id": "pi_xyz789",
    "return_url": "https://yoursite.com/checkout/complete"
  }'`,
          node: `const auth = await everpay.threeDSecure.authenticate({
  payment_intent_id: 'pi_xyz789',
  return_url: 'https://yoursite.com/checkout/complete',
});`,
          python: `auth = everpay.ThreeDSecure.authenticate(
  payment_intent_id="pi_xyz789",
  return_url="https://yoursite.com/checkout/complete",
)`,
        }}
        response={`{
  "id": "3ds_auth_abc123",
  "status": "requires_action",
  "redirect_url": "https://checkout.everpayinc.com/3ds/abc123",
  "version": "2.2.0",
  "payment_intent_id": "pi_xyz789"
}`}
      />

      <ApiEndpoint
        method="POST"
        path="/v2/payments/3d-secure/confirm"
        title="Confirm 3DS Authentication"
        description="Confirm payment after the customer completes 3DS authentication. Called from the return_url callback."
        params={[
          { name: "payment_intent_id", type: "string", required: true, desc: "The payment intent to confirm" },
          { name: "authentication_id", type: "string", required: true, desc: "The 3DS authentication ID" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v2/payments/3d-secure/confirm \\
  -H "Authorization: Bearer sk_test_your_key" \\
  -d '{
    "payment_intent_id": "pi_xyz789",
    "authentication_id": "3ds_auth_abc123"
  }'`,
          node: `const result = await everpay.threeDSecure.confirm({
  payment_intent_id: 'pi_xyz789',
  authentication_id: '3ds_auth_abc123',
});`,
          python: `result = everpay.ThreeDSecure.confirm(
  payment_intent_id="pi_xyz789",
  authentication_id="3ds_auth_abc123",
)`,
        }}
        response={`{
  "id": "pi_xyz789",
  "status": "succeeded",
  "amount": 5000,
  "currency": "usd",
  "three_d_secure": {
    "status": "succeeded",
    "liability_shift": true,
    "eci": "05",
    "version": "2.2.0"
  }
}`}
      />

      <ApiEndpoint
        method="GET"
        path="/v2/payments/3d-secure/:id"
        title="Retrieve 3DS Authentication"
        description="Retrieve the status and details of a 3DS authentication attempt."
        params={[
          { name: "id", type: "string", required: true, desc: "The 3DS authentication ID" },
        ]}
        code={{
          curl: `curl https://api.everpayinc.com/v2/payments/3d-secure/3ds_auth_abc123 \\
  -H "Authorization: Bearer sk_test_your_key"`,
          node: `const auth = await everpay.threeDSecure.retrieve('3ds_auth_abc123');`,
          python: `auth = everpay.ThreeDSecure.retrieve("3ds_auth_abc123")`,
        }}
        response={`{
  "id": "3ds_auth_abc123",
  "status": "succeeded",
  "version": "2.2.0",
  "eci": "05",
  "cavv": "AAABBJkZUQAAAABkEmVkBTdAAAA=",
  "liability_shift": true,
  "risk_score": 25,
  "created_at": "2026-03-25T12:00:00Z"
}`}
      />

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Webhooks</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>Listen for 3DS-related events via webhooks:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 border rounded-lg px-4 py-2">
              <Badge variant="outline" className="text-xs font-mono">payment.3ds.initiated</Badge>
              <span className="text-xs">3DS authentication started</span>
            </div>
            <div className="flex items-center gap-3 border rounded-lg px-4 py-2">
              <Badge variant="outline" className="text-xs font-mono">payment.3ds.succeeded</Badge>
              <span className="text-xs">Customer passed 3DS challenge</span>
            </div>
            <div className="flex items-center gap-3 border rounded-lg px-4 py-2">
              <Badge variant="outline" className="text-xs font-mono">payment.3ds.failed</Badge>
              <span className="text-xs">Customer failed or abandoned 3DS</span>
            </div>
            <div className="flex items-center gap-3 border rounded-lg px-4 py-2">
              <Badge variant="outline" className="text-xs font-mono">payment.3ds.exempted</Badge>
              <span className="text-xs">Transaction exempted from 3DS (low risk / low value)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThreeDSecureApiPage;
