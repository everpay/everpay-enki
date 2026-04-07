import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";
import { Landmark, Globe } from "lucide-react";

const BankDebitsApiPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <Badge variant="secondary" className="mb-3">API Reference</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Bank Debits API</h1>
        <p className="text-muted-foreground mt-2">Accept payments directly from customer bank accounts via ACH (US), SEPA (EU), BACS (UK), and Plaid instant verification. Lower fees than cards with no chargebacks on confirmed debits.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Supported Methods</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              { method: 'ACH Debit', region: 'United States', currency: 'USD', provider: 'Plaid + ShieldHub', settlement: '3-5 business days' },
              { method: 'SEPA Direct Debit', region: 'European Union', currency: 'EUR', provider: 'Mondo Open Banking', settlement: '5-14 business days' },
              { method: 'BACS Direct Debit', region: 'United Kingdom', currency: 'GBP', provider: 'Mondo Open Banking', settlement: '3-5 business days' },
              { method: 'PIX', region: 'Brazil', currency: 'BRL', provider: 'Paygate10', settlement: 'Instant' },
            ].map((m) => (
              <div key={m.method} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{m.method}</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><strong>Region:</strong> {m.region}</p>
                  <p><strong>Currency:</strong> {m.currency}</p>
                  <p><strong>Provider:</strong> {m.provider}</p>
                  <p><strong>Settlement:</strong> {m.settlement}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">The Bank Debit Object</CardTitle></CardHeader>
        <CardContent>
          <CodeBlock code={`{
  "id": "bd_abc123",
  "object": "bank_debit",
  "amount": 10000,
  "currency": "usd",
  "status": "processing",
  "method": "ach_debit",
  "bank_account": {
    "id": "ba_xyz789",
    "bank_name": "Chase",
    "last4": "6789",
    "routing_number": "****0021"
  },
  "mandate_id": "mdt_456",
  "customer_id": "cus_abc",
  "description": "Invoice #1042",
  "failure_reason": null,
  "created_at": "2026-03-25T12:00:00Z"
}`} language="curl" />
        </CardContent>
      </Card>

      <ApiEndpoint
        method="POST"
        path="/v2/bank-debits"
        title="Create a Bank Debit"
        description="Initiate a debit from a customer's bank account. Requires a verified bank account (via Plaid or manual micro-deposits) and an active mandate."
        params={[
          { name: "amount", type: "integer", required: true, desc: "Amount in smallest currency unit (e.g., cents)" },
          { name: "currency", type: "string", required: true, desc: "Three-letter ISO currency code (usd, eur, gbp, brl)" },
          { name: "bank_account_id", type: "string", required: true, desc: "Verified bank account ID" },
          { name: "customer_id", type: "string", required: true, desc: "The customer being debited" },
          { name: "mandate_id", type: "string", required: false, desc: "Existing mandate ID. Auto-created if omitted." },
          { name: "description", type: "string", required: false, desc: "Statement descriptor" },
          { name: "metadata", type: "object", required: false, desc: "Additional key-value metadata" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v2/bank-debits \\
  -H "Authorization: Bearer sk_test_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "currency": "usd",
    "bank_account_id": "ba_xyz789",
    "customer_id": "cus_abc",
    "description": "Invoice #1042"
  }'`,
          node: `const debit = await everpay.bankDebits.create({
  amount: 10000,
  currency: 'usd',
  bank_account_id: 'ba_xyz789',
  customer_id: 'cus_abc',
  description: 'Invoice #1042',
});`,
          python: `debit = everpay.BankDebit.create(
  amount=10000,
  currency="usd",
  bank_account_id="ba_xyz789",
  customer_id="cus_abc",
  description="Invoice #1042",
)`,
        }}
        response={`{
  "id": "bd_abc123",
  "status": "processing",
  "amount": 10000,
  "currency": "usd",
  "method": "ach_debit",
  "created_at": "2026-03-25T12:00:00Z"
}`}
      />

      <ApiEndpoint
        method="POST"
        path="/v2/bank-debits/verify"
        title="Verify Bank Account (Plaid)"
        description="Verify a customer's bank account using Plaid Link. Returns a Plaid link token to launch the verification flow in the frontend."
        params={[
          { name: "customer_id", type: "string", required: true, desc: "Customer to verify bank account for" },
          { name: "country", type: "string", required: false, desc: "Bank country code (default: US)" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v2/bank-debits/verify \\
  -H "Authorization: Bearer sk_test_your_key" \\
  -d '{"customer_id": "cus_abc"}'`,
          node: `const link = await everpay.bankDebits.verify({
  customer_id: 'cus_abc',
});`,
          python: `link = everpay.BankDebit.verify(customer_id="cus_abc")`,
        }}
        response={`{
  "link_token": "link-sandbox-abc123",
  "expiration": "2026-03-25T12:30:00Z",
  "provider": "plaid"
}`}
      />

      <ApiEndpoint
        method="GET"
        path="/v2/bank-debits"
        title="List Bank Debits"
        description="Retrieve a paginated list of bank debit transactions."
        params={[
          { name: "limit", type: "integer", required: false, desc: "Number of results (1-100, default 10)" },
          { name: "status", type: "string", required: false, desc: "Filter: processing, succeeded, failed, canceled" },
          { name: "method", type: "string", required: false, desc: "Filter: ach_debit, sepa_debit, bacs_debit, pix" },
        ]}
        code={{
          curl: `curl https://api.everpayinc.com/v2/bank-debits?status=succeeded \\
  -H "Authorization: Bearer sk_test_your_key"`,
          node: `const debits = await everpay.bankDebits.list({ status: 'succeeded' });`,
          python: `debits = everpay.BankDebit.list(status="succeeded")`,
        }}
        response={`{
  "object": "list",
  "data": [...],
  "has_more": false,
  "total_count": 28
}`}
      />

      <Card>
        <CardHeader><CardTitle className="text-lg">Webhooks</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          {[
            ['bank_debit.created', 'Bank debit initiated and processing'],
            ['bank_debit.succeeded', 'Funds successfully debited from customer account'],
            ['bank_debit.failed', 'Debit failed (insufficient funds, closed account, etc.)'],
            ['bank_debit.reversed', 'Customer reversed the debit through their bank'],
            ['bank_account.verified', 'Customer bank account verified via Plaid'],
          ].map(([event, desc]) => (
            <div key={event} className="flex items-center gap-3 border rounded-lg px-4 py-2">
              <Badge variant="outline" className="text-xs font-mono">{event}</Badge>
              <span className="text-xs">{desc}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default BankDebitsApiPage;
