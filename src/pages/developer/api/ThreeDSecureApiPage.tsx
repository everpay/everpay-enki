import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";
import { Shield, AlertTriangle, CheckCircle2, Fingerprint, Globe } from "lucide-react";

const ThreeDSecureApiPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <Badge variant="secondary" className="mb-3">API Reference</Badge>
        <h1 className="text-3xl font-bold tracking-tight">3D Secure API</h1>
        <p className="text-muted-foreground mt-2">Authenticate card payments with 3D Secure (3DS) to reduce fraud and shift liability. Everpay's 3DS Decision Engine automatically enforces authentication based on risk scores, merchant settings, and regulatory requirements (PSD2/SCA).</p>
      </div>

      {/* How 3DS Works */}
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

      {/* 3DS Versions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" /> 3DS Versions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 space-y-2">
              <span className="font-medium text-foreground text-sm">3D Secure 1.0</span>
              <p className="text-xs">Legacy protocol. Customer is redirected to the bank's Access Control Server (ACS) form to enter a one-time password. Higher friction, lower conversion rates.</p>
              <Badge variant="outline" className="text-xs">Verified by Visa / Mastercard SecureCode</Badge>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <span className="font-medium text-foreground text-sm">3D Secure 2.0</span>
              <p className="text-xs">Modern protocol. Collects browser and device data for frictionless authentication. Only suspicious transactions trigger a password challenge. Higher conversion rates.</p>
              <Badge className="text-xs bg-primary/10 text-primary border-0">Recommended</Badge>
            </div>
          </div>
          <p className="text-xs">Everpay automatically processes payments through both 3DS versions. The response includes a <code className="text-xs bg-muted px-1 py-0.5 rounded">three_d_secure_verification</code> section with verification results regardless of version used.</p>
        </CardContent>
      </Card>

      {/* Authentication Object */}
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
  "xid": null,
  "acs_url": null,
  "redirect_url": null,
  "liability_shift": true,
  "risk_score": 25,
  "three_d_secure_verification": {
    "status": "successful",
    "pa_status": "Y",
    "eci": "05",
    "version": "2.2.0"
  },
  "browser_data": {
    "screen_width": 1920,
    "screen_height": 1080,
    "color_depth": 24,
    "language": "en",
    "java_enabled": false,
    "time_zone": -300
  },
  "created_at": "2026-03-25T12:00:00Z"
}`} language="curl" />
        </CardContent>
      </Card>

      {/* Decision Engine */}
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
            <li><strong>Card issuer rules</strong> — some issuers mandate 3DS regardless of merchant settings</li>
            <li><strong>Transaction type</strong> — merchant-initiated recurring charges may use exemptions</li>
          </ul>
          <p>Transactions with risk score &gt; 90 are automatically <strong>blocked</strong> regardless of 3DS settings.</p>
        </CardContent>
      </Card>

      {/* 3DS Statuses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> 3DS Verification Statuses
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <div className="space-y-2">
            <div className="flex items-start gap-3 border rounded-lg px-4 py-3">
              <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-0 mt-0.5">Y</Badge>
              <div>
                <span className="text-xs font-medium text-foreground">Authenticated</span>
                <p className="text-xs mt-0.5">Customer fully authenticated. Liability shifts to issuer.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border rounded-lg px-4 py-3">
              <Badge className="text-xs bg-amber-500/10 text-amber-600 border-0 mt-0.5">A</Badge>
              <div>
                <span className="text-xs font-medium text-foreground">Attempted</span>
                <p className="text-xs mt-0.5">Authentication attempted but not completed. Partial liability shift.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border rounded-lg px-4 py-3">
              <Badge className="text-xs bg-destructive/10 text-destructive border-0 mt-0.5">N</Badge>
              <div>
                <span className="text-xs font-medium text-foreground">Not Authenticated</span>
                <p className="text-xs mt-0.5">Customer failed authentication. No liability shift. Consider declining.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border rounded-lg px-4 py-3">
              <Badge className="text-xs bg-muted text-muted-foreground border-0 mt-0.5">U</Badge>
              <div>
                <span className="text-xs font-medium text-foreground">Unavailable</span>
                <p className="text-xs mt-0.5">3DS not available for this card or issuer. Proceed at merchant risk.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border rounded-lg px-4 py-3">
              <Badge className="text-xs bg-primary/10 text-primary border-0 mt-0.5">R</Badge>
              <div>
                <span className="text-xs font-medium text-foreground">Rejected</span>
                <p className="text-xs mt-0.5">Issuer rejected the transaction. Do not proceed.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Initiate 3DS */}
      <ApiEndpoint
        method="POST"
        path="/v1/payments/3d-secure/authenticate"
        title="Initiate 3DS Authentication"
        description="Trigger 3D Secure authentication for a payment intent. Returns a redirect URL if challenge is required. For 3DS 2.0, include browser data for frictionless flow."
        params={[
          { name: "payment_intent_id", type: "string", required: true, desc: "The payment intent to authenticate" },
          { name: "return_url", type: "string", required: true, desc: "URL to redirect after 3DS completion" },
          { name: "force_challenge", type: "boolean", required: false, desc: "Force 3DS challenge regardless of risk score" },
          { name: "browser", type: "object", required: false, desc: "Browser data for 3DS 2.0 frictionless flow" },
          { name: "browser.screen_width", type: "number", required: false, desc: "Screen width in pixels" },
          { name: "browser.screen_height", type: "number", required: false, desc: "Screen height in pixels" },
          { name: "browser.color_depth", type: "number", required: false, desc: "Screen color depth" },
          { name: "browser.language", type: "string", required: false, desc: "Browser language" },
          { name: "browser.java_enabled", type: "boolean", required: false, desc: "Java enabled status" },
          { name: "browser.user_agent", type: "string", required: false, desc: "Full user agent string" },
          { name: "browser.time_zone", type: "number", required: false, desc: "Timezone offset in minutes" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v1/payments/3d-secure/authenticate \\
  -H "Authorization: Bearer sk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "payment_intent_id": "pi_xyz789",
    "return_url": "https://yoursite.com/checkout/complete",
    "browser": {
      "screen_width": 1920,
      "screen_height": 1080,
      "color_depth": 24,
      "language": "en",
      "java_enabled": false,
      "user_agent": "Mozilla/5.0...",
      "time_zone": -300
    }
  }'`,
          node: `const auth = await everpay.threeDSecure.authenticate({
  payment_intent_id: 'pi_xyz789',
  return_url: 'https://yoursite.com/checkout/complete',
  browser: {
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    color_depth: window.screen.colorDepth,
    language: navigator.language,
    java_enabled: false,
    time_zone: new Date().getTimezoneOffset(),
  },
});`,
          python: `auth = everpay.ThreeDSecure.authenticate(
  payment_intent_id="pi_xyz789",
  return_url="https://yoursite.com/checkout/complete",
  browser={
    "screen_width": 1920,
    "screen_height": 1080,
    "color_depth": 24,
    "language": "en",
    "java_enabled": False,
    "time_zone": -300,
  },
)`,
        }}
        response={`{
  "id": "3ds_auth_abc123",
  "status": "requires_action",
  "redirect_url": "https://checkout.everpayinc.com/3ds/abc123",
  "version": "2.2.0",
  "payment_intent_id": "pi_xyz789",
  "three_d_secure_verification": {
    "status": "pending",
    "pa_status": null
  }
}`}
      />

      {/* Confirm 3DS */}
      <ApiEndpoint
        method="POST"
        path="/v1/payments/3d-secure/confirm"
        title="Confirm 3DS Authentication"
        description="Confirm payment after the customer completes 3DS authentication. Called from the return_url callback."
        params={[
          { name: "payment_intent_id", type: "string", required: true, desc: "The payment intent to confirm" },
          { name: "authentication_id", type: "string", required: true, desc: "The 3DS authentication ID" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v1/payments/3d-secure/confirm \\
  -H "Authorization: Bearer sk_live_your_key" \\
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
    "version": "2.2.0",
    "cavv": "AAABBJkZUQAAAABkEmVkBTdAAAA="
  },
  "three_d_secure_verification": {
    "status": "successful",
    "pa_status": "Y"
  }
}`}
      />

      {/* Retrieve 3DS */}
      <ApiEndpoint
        method="GET"
        path="/v1/payments/3d-secure/:id"
        title="Retrieve 3DS Authentication"
        description="Retrieve the status and details of a 3DS authentication attempt."
        params={[
          { name: "id", type: "string", required: true, desc: "The 3DS authentication ID" },
        ]}
        code={{
          curl: `curl https://api.everpayinc.com/v1/payments/3d-secure/3ds_auth_abc123 \\
  -H "Authorization: Bearer sk_live_your_key"`,
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
  "three_d_secure_verification": {
    "status": "successful",
    "pa_status": "Y"
  },
  "created_at": "2026-03-25T12:00:00Z"
}`}
      />

      {/* Exemptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> SCA Exemptions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>Everpay can request exemptions from Strong Customer Authentication (SCA) to reduce friction:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3 border rounded-lg px-4 py-3">
              <Badge variant="outline" className="text-xs font-mono mt-0.5">low_value</Badge>
              <div>
                <span className="text-xs font-medium text-foreground">Low-value exemption</span>
                <p className="text-xs mt-0.5">Transactions under €30 EUR (cumulative limits apply).</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border rounded-lg px-4 py-3">
              <Badge variant="outline" className="text-xs font-mono mt-0.5">low_risk</Badge>
              <div>
                <span className="text-xs font-medium text-foreground">Transaction Risk Analysis (TRA)</span>
                <p className="text-xs mt-0.5">PSP's fraud rate below regulatory threshold. Amount limits vary by rate.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border rounded-lg px-4 py-3">
              <Badge variant="outline" className="text-xs font-mono mt-0.5">trusted_beneficiary</Badge>
              <div>
                <span className="text-xs font-medium text-foreground">Trusted beneficiary</span>
                <p className="text-xs mt-0.5">Customer has whitelisted this merchant with their bank.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border rounded-lg px-4 py-3">
              <Badge variant="outline" className="text-xs font-mono mt-0.5">merchant_initiated</Badge>
              <div>
                <span className="text-xs font-medium text-foreground">Merchant-initiated transaction</span>
                <p className="text-xs mt-0.5">Recurring or saved card charges initiated by the merchant (not customer-present).</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
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
            <div className="flex items-center gap-3 border rounded-lg px-4 py-2">
              <Badge variant="outline" className="text-xs font-mono">payment.3ds.frictionless</Badge>
              <span className="text-xs">3DS 2.0 frictionless flow completed — no customer interaction</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Processing Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>You can configure custom 3DS processing rules per merchant via the admin panel or API:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Decline on unknown status</strong> — reject transactions where 3DS verification returns status <code className="text-xs bg-muted px-1 py-0.5 rounded">U</code> (unavailable).</li>
            <li><strong>Force 3DS on high amounts</strong> — mandate 3DS for transactions above a configurable threshold.</li>
            <li><strong>Block on failed 3DS</strong> — automatically decline if <code className="text-xs bg-muted px-1 py-0.5 rounded">pa_status</code> is <code className="text-xs bg-muted px-1 py-0.5 rounded">N</code> (not authenticated).</li>
            <li><strong>Skip for processor-native 3DS</strong> — if the PSP handles 3DS natively, Everpay defers to the processor's implementation.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThreeDSecureApiPage;
