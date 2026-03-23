import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";

const InvoicesApiPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <Badge variant="secondary" className="mb-3">API Reference</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Invoices API</h1>
        <p className="text-muted-foreground mt-2">Create, send, and manage invoices with automatic payment collection.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">The Invoice Object</CardTitle></CardHeader>
        <CardContent>
          <CodeBlock code={`{\n  "id": "inv_abc123",\n  "object": "invoice",\n  "customer_id": "cus_abc123",\n  "number": "INV-2026-001",\n  "status": "open",\n  "currency": "usd",\n  "total": 10800,\n  "amount_due": 10800,\n  "due_date": "2026-04-09T00:00:00Z",\n  "line_items": [...],\n  "created_at": "2026-03-09T12:00:00Z"\n}`} language="curl" />
        </CardContent>
      </Card>

      <ApiEndpoint method="POST" path="/v2/invoices" title="Create an Invoice" description="Create a new invoice for a customer."
        params={[
          { name: "customer_id", type: "string", required: true, desc: "Customer to invoice" },
          { name: "currency", type: "string", required: true, desc: "Three-letter ISO currency code" },
          { name: "line_items", type: "array", required: true, desc: "Array of line items" },
          { name: "due_date", type: "string", required: false, desc: "Payment due date (ISO 8601)" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v2/invoices \\\n  -H "Authorization: Bearer sk_test_your_key" \\\n  -d '{"customer_id": "cus_abc123", "currency": "usd", "line_items": [{"description": "Pro Plan", "amount": 4999, "quantity": 1}]}'`,
          node: `const invoice = await everpay.invoices.create({ customer_id: 'cus_abc123', currency: 'usd', line_items: [{ description: 'Pro Plan', amount: 4999, quantity: 1 }] });`,
          python: `invoice = everpay.Invoice.create(customer_id="cus_abc123", currency="usd", line_items=[{"description": "Pro Plan", "amount": 4999, "quantity": 1}])`,
        }}
        response={`{\n  "id": "inv_abc123",\n  "number": "INV-2026-001",\n  "status": "draft",\n  "total": 4999,\n  "created_at": "2026-03-09T12:00:00Z"\n}`}
      />

      <ApiEndpoint method="GET" path="/v2/invoices" title="List Invoices" description="Retrieve a paginated list of invoices."
        params={[
          { name: "limit", type: "integer", required: false, desc: "Results per page" },
          { name: "status", type: "string", required: false, desc: "draft, open, paid, void" },
        ]}
        code={{
          curl: `curl "https://api.everpayinc.com/v2/invoices?status=open" \\\n  -H "Authorization: Bearer sk_test_your_key"`,
          node: `const invoices = await everpay.invoices.list({ status: 'open' });`,
          python: `invoices = everpay.Invoice.list(status="open")`,
        }}
        response={`{\n  "object": "list",\n  "data": [...],\n  "total_count": 12\n}`}
      />
    </div>
  );
};

export default InvoicesApiPage;