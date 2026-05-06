import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";

const PayoutsApiPage = () => (
  <div className="max-w-4xl mx-auto space-y-10">
    <div>
      <Badge variant="secondary" className="mb-3">API Reference</Badge>
      <h1 className="text-3xl font-bold tracking-tight">Payouts API</h1>
      <p className="text-muted-foreground mt-2">Send funds to merchant bank accounts.</p>
    </div>
    <ApiEndpoint method="POST" path="/v1/payouts" title="Create a Payout" description="Send funds to a merchant's bank account."
      params={[
        { name: "amount", type: "integer", required: true, desc: "Amount in smallest currency unit" },
        { name: "currency", type: "string", required: true, desc: "Three-letter ISO currency code" },
        { name: "destination", type: "string", required: true, desc: "Bank account ID" },
      ]}
      code={{
        curl: `curl -X POST https://api.everpayinc.com/v1/payouts \\\n  -H "Authorization: Bearer sk_test_your_key" \\\n  -d '{"amount": 250000, "currency": "usd", "destination": "ba_123456"}'`,
        node: `const payout = await everpay.payouts.create({ amount: 250000, currency: 'usd', destination: 'ba_123456' });`,
        python: `payout = everpay.Payout.create(amount=250000, currency="usd", destination="ba_123456")`,
      }}
      response={`{\n  "id": "po_abc123",\n  "amount": 250000,\n  "status": "pending",\n  "created_at": "2026-03-09T12:00:00Z"\n}`}
    />
    <ApiEndpoint method="GET" path="/v1/payouts" title="List Payouts" description="Retrieve a paginated list of payouts."
      params={[{ name: "status", type: "string", required: false, desc: "pending, paid, failed" }]}
      code={{
        curl: `curl "https://api.everpayinc.com/v1/payouts?status=paid" \\\n  -H "Authorization: Bearer sk_test_your_key"`,
        node: `const payouts = await everpay.payouts.list({ status: 'paid' });`,
        python: `payouts = everpay.Payout.list(status="paid")`,
      }}
      response={`{\n  "object": "list",\n  "data": [...],\n  "total_count": 156\n}`}
    />
  </div>
);

export default PayoutsApiPage;