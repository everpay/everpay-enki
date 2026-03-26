import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";
import { CreditCard, Key, RefreshCw, Shield } from "lucide-react";

const SavedCardsApiPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <Badge variant="secondary" className="mb-3">API Reference</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Saved Cards API</h1>
        <p className="text-muted-foreground mt-2">
          Tokenize and store card details for recurring or on-demand payments. After an initial transaction, 
          Everpay returns a secure card token that can be used for subsequent charges without re-entering card data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> How Saved Cards Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>The saved card flow consists of three stages:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">1</Badge>
                <span className="font-medium text-foreground">Initial Transaction</span>
              </div>
              <p className="text-xs">Customer submits card details. 3DS verification may be triggered. Set <code className="text-xs bg-muted px-1 py-0.5 rounded">contract</code> to enable tokenization.</p>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">2</Badge>
                <span className="font-medium text-foreground">Receive Token</span>
              </div>
              <p className="text-xs">Upon success, Everpay returns a <code className="text-xs bg-muted px-1 py-0.5 rounded">card_token</code> in the response and webhook. Store it securely.</p>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">3</Badge>
                <span className="font-medium text-foreground">Charge Token</span>
              </div>
              <p className="text-xs">Use the token for subsequent payments — no card re-entry, no repeat 3DS for merchant-initiated charges.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">The Saved Card Object</CardTitle></CardHeader>
        <CardContent>
          <CodeBlock code={`{
  "id": "card_tok_abc123",
  "object": "saved_card",
  "customer_id": "cus_xyz789",
  "card_brand": "visa",
  "card_last4": "4242",
  "card_bin": "424200",
  "exp_month": "12",
  "exp_year": "2028",
  "issuer_country": "US",
  "issuer_name": "Chase",
  "token": "2a4ef31c-bdc9-450b-a979-d533a19341ac",
  "contract": ["recurring", "card_on_file"],
  "recurring_type": "initial",
  "network_token_status": "active",
  "created_at": "2026-03-25T12:00:00Z"
}`} language="curl" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" /> Contract Types
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>The <code className="text-xs bg-muted px-1 py-0.5 rounded">contract</code> parameter tells the issuer how the token will be used:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3 border rounded-lg px-4 py-3">
              <Badge variant="outline" className="text-xs font-mono mt-0.5">recurring</Badge>
              <div>
                <span className="text-xs font-medium text-foreground">Recurring payments</span>
                <p className="text-xs mt-0.5">Fixed-amount charges on a regular schedule (e.g. subscriptions).</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border rounded-lg px-4 py-3">
              <Badge variant="outline" className="text-xs font-mono mt-0.5">card_on_file</Badge>
              <div>
                <span className="text-xs font-medium text-foreground">Card on file</span>
                <p className="text-xs mt-0.5">Variable-amount, on-demand charges initiated by merchant or customer.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ApiEndpoint
        method="POST"
        path="/v2/saved-cards/tokenize"
        title="Create Initial Tokenization"
        description="Submit an initial payment or authorization with contract flags to tokenize the card. Supports zero-amount authorization if the acquirer allows it."
        params={[
          { name: "amount", type: "number", required: true, desc: "Amount in minor units (0 for zero-auth)" },
          { name: "currency", type: "string", required: true, desc: "ISO 4217 currency code" },
          { name: "customer_id", type: "string", required: true, desc: "Customer to attach card to" },
          { name: "card", type: "object", required: true, desc: "Card details or VGS token alias" },
          { name: "contract", type: "array", required: true, desc: '["recurring", "card_on_file"]' },
          { name: "transaction_type", type: "string", required: false, desc: "payment, authorization, or tokenization (default: authorization)" },
          { name: "return_url", type: "string", required: false, desc: "URL for 3DS redirect callback" },
          { name: "notification_url", type: "string", required: false, desc: "Webhook URL for async updates" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v2/saved-cards/tokenize \\
  -H "Authorization: Bearer sk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 0,
    "currency": "USD",
    "customer_id": "cus_xyz789",
    "transaction_type": "authorization",
    "contract": ["recurring", "card_on_file"],
    "card": {
      "vgs_alias": "tok_sandbox_abc123",
      "holder": "John Doe",
      "exp_month": "12",
      "exp_year": "2028"
    },
    "return_url": "https://yoursite.com/card-saved"
  }'`,
          node: `const result = await everpay.savedCards.tokenize({
  amount: 0,
  currency: 'USD',
  customer_id: 'cus_xyz789',
  transaction_type: 'authorization',
  contract: ['recurring', 'card_on_file'],
  card: {
    vgs_alias: 'tok_sandbox_abc123',
    holder: 'John Doe',
    exp_month: '12',
    exp_year: '2028',
  },
});`,
          python: `result = everpay.SavedCards.tokenize(
  amount=0,
  currency="USD",
  customer_id="cus_xyz789",
  transaction_type="authorization",
  contract=["recurring", "card_on_file"],
  card={
    "vgs_alias": "tok_sandbox_abc123",
    "holder": "John Doe",
    "exp_month": "12",
    "exp_year": "2028",
  },
)`,
        }}
        response={`{
  "id": "txn_init_abc123",
  "object": "tokenization",
  "status": "successful",
  "card_token": "2a4ef31c-bdc9-450b-a979-d533a19341ac",
  "card_last4": "4242",
  "card_brand": "visa",
  "card_bin": "424200",
  "issuer_country": "US",
  "contract": ["recurring", "card_on_file"],
  "recurring_type": "initial",
  "three_d_secure": {
    "status": "successful",
    "version": "2.2.0",
    "eci": "05"
  },
  "created_at": "2026-03-25T12:00:00Z"
}`}
      />

      <ApiEndpoint
        method="POST"
        path="/v2/saved-cards/charge"
        title="Charge a Saved Card"
        description="Use a previously obtained card token to create a new payment. No card re-entry or 3DS challenge required for merchant-initiated transactions."
        params={[
          { name: "card_token", type: "string", required: true, desc: "Token from initial tokenization" },
          { name: "amount", type: "number", required: true, desc: "Amount in minor units" },
          { name: "currency", type: "string", required: true, desc: "ISO 4217 currency code" },
          { name: "description", type: "string", required: false, desc: "Payment description" },
          { name: "tracking_id", type: "string", required: false, desc: "Your internal reference ID" },
          { name: "recurring_type", type: "string", required: false, desc: "subsequent (default) or initial" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v2/saved-cards/charge \\
  -H "Authorization: Bearer sk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "card_token": "2a4ef31c-bdc9-450b-a979-d533a19341ac",
    "amount": 2500,
    "currency": "USD",
    "description": "Monthly subscription",
    "tracking_id": "sub_renewal_456"
  }'`,
          node: `const payment = await everpay.savedCards.charge({
  card_token: '2a4ef31c-bdc9-450b-a979-d533a19341ac',
  amount: 2500,
  currency: 'USD',
  description: 'Monthly subscription',
});`,
          python: `payment = everpay.SavedCards.charge(
  card_token="2a4ef31c-bdc9-450b-a979-d533a19341ac",
  amount=2500,
  currency="USD",
  description="Monthly subscription",
)`,
        }}
        response={`{
  "id": "pi_sub_789",
  "object": "payment",
  "status": "successful",
  "amount": 2500,
  "currency": "USD",
  "card_token": "2a4ef31c-bdc9-450b-a979-d533a19341ac",
  "card_last4": "4242",
  "recurring_type": "subsequent",
  "auth_code": "654321",
  "created_at": "2026-03-26T08:00:00Z"
}`}
      />

      <ApiEndpoint
        method="GET"
        path="/v2/saved-cards/:customer_id"
        title="List Saved Cards"
        description="Retrieve all saved card tokens for a customer."
        params={[
          { name: "customer_id", type: "string", required: true, desc: "Customer ID" },
        ]}
        code={{
          curl: `curl https://api.everpayinc.com/v2/saved-cards/cus_xyz789 \\
  -H "Authorization: Bearer sk_live_your_key"`,
          node: `const cards = await everpay.savedCards.list('cus_xyz789');`,
          python: `cards = everpay.SavedCards.list("cus_xyz789")`,
        }}
        response={`{
  "object": "list",
  "data": [
    {
      "token": "2a4ef31c-bdc9-450b-a979-d533a19341ac",
      "card_brand": "visa",
      "card_last4": "4242",
      "exp_month": "12",
      "exp_year": "2028",
      "is_default": true,
      "created_at": "2026-03-25T12:00:00Z"
    }
  ],
  "total_count": 1,
  "has_more": false
}`}
      />

      <ApiEndpoint
        method="DELETE"
        path="/v2/saved-cards/:token"
        title="Delete a Saved Card"
        description="Remove a saved card token. The token will be invalidated and cannot be used for future charges."
        params={[
          { name: "token", type: "string", required: true, desc: "Card token to delete" },
        ]}
        code={{
          curl: `curl -X DELETE https://api.everpayinc.com/v2/saved-cards/2a4ef31c-bdc9-450b-a979-d533a19341ac \\
  -H "Authorization: Bearer sk_live_your_key"`,
          node: `await everpay.savedCards.delete('2a4ef31c-bdc9-450b-a979-d533a19341ac');`,
          python: `everpay.SavedCards.delete("2a4ef31c-bdc9-450b-a979-d533a19341ac")`,
        }}
        response={`{
  "object": "saved_card",
  "token": "2a4ef31c-bdc9-450b-a979-d533a19341ac",
  "deleted": true
}`}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-accent" /> Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>Listen for saved card events:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 border rounded-lg px-4 py-2">
              <Badge variant="outline" className="text-xs font-mono">card.tokenized</Badge>
              <span className="text-xs">Card successfully tokenized and stored</span>
            </div>
            <div className="flex items-center gap-3 border rounded-lg px-4 py-2">
              <Badge variant="outline" className="text-xs font-mono">card.charge.succeeded</Badge>
              <span className="text-xs">Saved card charge completed successfully</span>
            </div>
            <div className="flex items-center gap-3 border rounded-lg px-4 py-2">
              <Badge variant="outline" className="text-xs font-mono">card.charge.failed</Badge>
              <span className="text-xs">Saved card charge failed — retry or prompt re-entry</span>
            </div>
            <div className="flex items-center gap-3 border rounded-lg px-4 py-2">
              <Badge variant="outline" className="text-xs font-mono">card.deleted</Badge>
              <span className="text-xs">Saved card token removed</span>
            </div>
            <div className="flex items-center gap-3 border rounded-lg px-4 py-2">
              <Badge variant="outline" className="text-xs font-mono">card.updated</Badge>
              <span className="text-xs">Card details updated via network token or card updater</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Security & Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>Always verify the initial transaction reached <code className="text-xs bg-muted px-1 py-0.5 rounded">successful</code> status before storing the token.</li>
            <li>For <strong>tokenization</strong> transaction types, the subsequent charge must occur within <strong>1 hour</strong> — otherwise the customer must re-verify via 3DS.</li>
            <li>Display saved cards using <code className="text-xs bg-muted px-1 py-0.5 rounded">card_last4</code> only (e.g. •••• 4242). Never store or display full card numbers.</li>
            <li>Use <code className="text-xs bg-muted px-1 py-0.5 rounded">card_on_file</code> for customer-initiated and <code className="text-xs bg-muted px-1 py-0.5 rounded">recurring</code> for merchant-initiated charges.</li>
            <li>Enable Everpay's <strong>Card Updater</strong> to automatically refresh expired cards.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavedCardsApiPage;
