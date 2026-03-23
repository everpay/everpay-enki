import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";

const PaymentsApiPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <Badge variant="secondary" className="mb-3">API Reference</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Payments API</h1>
        <p className="text-muted-foreground mt-2">Create, capture, and manage payments across multiple processors and payment methods.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">The Payment Object</CardTitle></CardHeader>
        <CardContent>
          <CodeBlock code={`{\n  "id": "pay_abc123xyz",\n  "object": "payment",\n  "amount": 5000,\n  "currency": "usd",\n  "status": "succeeded",\n  "payment_method": "pm_card_visa",\n  "description": "Order #1234",\n  "merchant_id": "mer_abc123",\n  "processor": "shieldhub",\n  "metadata": {},\n  "created_at": "2026-03-09T12:00:00Z"\n}`} language="curl" />
        </CardContent>
      </Card>

      <ApiEndpoint method="POST" path="/v2/payments" title="Create a Payment" description="Create a new payment intent and charge the customer."
        params={[
          { name: "amount", type: "integer", required: true, desc: "Amount in smallest currency unit (e.g., cents)" },
          { name: "currency", type: "string", required: true, desc: "Three-letter ISO currency code" },
          { name: "payment_method", type: "string", required: true, desc: "Payment method ID or type" },
          { name: "description", type: "string", required: false, desc: "Description of the payment" },
          { name: "metadata", type: "object", required: false, desc: "Additional key-value metadata" },
          { name: "capture", type: "boolean", required: false, desc: "Auto-capture. Defaults to true" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v2/payments \\\n  -H "Authorization: Bearer sk_test_your_key" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "amount": 5000,\n    "currency": "usd",\n    "payment_method": "pm_card_visa",\n    "description": "Order #1234"\n  }'`,
          node: `const payment = await everpay.payments.create({\n  amount: 5000,\n  currency: 'usd',\n  payment_method: 'pm_card_visa',\n  description: 'Order #1234',\n});`,
          python: `payment = everpay.Payment.create(\n  amount=5000,\n  currency="usd",\n  payment_method="pm_card_visa",\n  description="Order #1234",\n)`,
        }}
        response={`{\n  "id": "pay_abc123xyz",\n  "object": "payment",\n  "amount": 5000,\n  "currency": "usd",\n  "status": "succeeded",\n  "created_at": "2026-03-09T12:00:00Z"\n}`}
      />

      <ApiEndpoint method="GET" path="/v2/payments" title="List Payments" description="Retrieve a paginated list of payments."
        params={[
          { name: "limit", type: "integer", required: false, desc: "Number of results (1-100, default 10)" },
          { name: "offset", type: "integer", required: false, desc: "Pagination offset" },
          { name: "status", type: "string", required: false, desc: "Filter by status" },
        ]}
        code={{
          curl: `curl https://api.everpayinc.com/v2/payments?limit=10 \\\n  -H "Authorization: Bearer sk_test_your_key"`,
          node: `const payments = await everpay.payments.list({ limit: 10, status: 'succeeded' });`,
          python: `payments = everpay.Payment.list(limit=10, status="succeeded")`,
        }}
        response={`{\n  "object": "list",\n  "data": [...],\n  "has_more": true,\n  "total_count": 142\n}`}
      />

      <ApiEndpoint method="POST" path="/v2/payments/:id/capture" title="Capture a Payment" description="Capture a previously authorized payment."
        params={[{ name: "amount", type: "integer", required: false, desc: "Partial capture amount (defaults to full)" }]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v2/payments/pay_abc123/capture \\\n  -H "Authorization: Bearer sk_test_your_key" \\\n  -d '{"amount": 3000}'`,
          node: `const captured = await everpay.payments.capture('pay_abc123', { amount: 3000 });`,
          python: `captured = everpay.Payment.capture("pay_abc123", amount=3000)`,
        }}
        response={`{\n  "id": "pay_abc123",\n  "status": "succeeded",\n  "amount": 3000,\n  "captured": true\n}`}
      />

      <ApiEndpoint method="POST" path="/v2/payments/:id/refund" title="Refund a Payment" description="Issue a full or partial refund."
        params={[
          { name: "amount", type: "integer", required: false, desc: "Partial refund amount. Omit for full refund" },
          { name: "reason", type: "string", required: false, desc: "Reason code: duplicate, fraudulent, requested_by_customer" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v2/payments/pay_abc123/refund \\\n  -H "Authorization: Bearer sk_test_your_key" \\\n  -d '{"amount": 2500, "reason": "requested_by_customer"}'`,
          node: `const refund = await everpay.payments.refund('pay_abc123', { amount: 2500, reason: 'requested_by_customer' });`,
          python: `refund = everpay.Payment.refund("pay_abc123", amount=2500, reason="requested_by_customer")`,
        }}
        response={`{\n  "id": "ref_xyz789",\n  "payment_id": "pay_abc123",\n  "amount": 2500,\n  "status": "succeeded",\n  "reason": "requested_by_customer"\n}`}
      />
    </div>
  );
};

export default PaymentsApiPage;