import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";

const CustomersApiPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <Badge variant="secondary" className="mb-3">API Reference</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Customers API</h1>
        <p className="text-muted-foreground mt-2">Create and manage customer records, payment methods, and preferences.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">The Customer Object</CardTitle></CardHeader>
        <CardContent>
          <CodeBlock code={`{\n  "id": "cus_abc123",\n  "object": "customer",\n  "name": "Jane Doe",\n  "email": "jane@example.com",\n  "phone": "+1234567890",\n  "payment_methods": ["pm_card_visa"],\n  "metadata": {},\n  "created_at": "2026-03-09T12:00:00Z"\n}`} language="curl" />
        </CardContent>
      </Card>

      <ApiEndpoint method="POST" path="/v1/customers" title="Create a Customer" description="Create a new customer record."
        params={[
          { name: "name", type: "string", required: true, desc: "Customer full name" },
          { name: "email", type: "string", required: true, desc: "Customer email address" },
          { name: "phone", type: "string", required: false, desc: "Phone number in E.164 format" },
          { name: "metadata", type: "object", required: false, desc: "Custom key-value metadata" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v1/customers \\\n  -H "Authorization: Bearer sk_test_your_key" \\\n  -d '{"name": "Jane Doe", "email": "jane@example.com"}'`,
          node: `const customer = await everpay.customers.create({ name: 'Jane Doe', email: 'jane@example.com' });`,
          python: `customer = everpay.Customer.create(name="Jane Doe", email="jane@example.com")`,
        }}
        response={`{\n  "id": "cus_abc123",\n  "name": "Jane Doe",\n  "email": "jane@example.com",\n  "created_at": "2026-03-09T12:00:00Z"\n}`}
      />

      <ApiEndpoint method="GET" path="/v1/customers" title="List Customers" description="Retrieve a paginated list of customers."
        params={[
          { name: "limit", type: "integer", required: false, desc: "Results per page (default 10)" },
          { name: "email", type: "string", required: false, desc: "Filter by email address" },
        ]}
        code={{
          curl: `curl "https://api.everpayinc.com/v1/customers?limit=20" \\\n  -H "Authorization: Bearer sk_test_your_key"`,
          node: `const customers = await everpay.customers.list({ limit: 20 });`,
          python: `customers = everpay.Customer.list(limit=20)`,
        }}
        response={`{\n  "object": "list",\n  "data": [...],\n  "has_more": false,\n  "total_count": 48\n}`}
      />

      <ApiEndpoint method="PATCH" path="/v1/customers/:id" title="Update a Customer" description="Update an existing customer's details."
        params={[
          { name: "name", type: "string", required: false, desc: "Updated name" },
          { name: "email", type: "string", required: false, desc: "Updated email" },
        ]}
        code={{
          curl: `curl -X PATCH https://api.everpayinc.com/v1/customers/cus_abc123 \\\n  -H "Authorization: Bearer sk_test_your_key" \\\n  -d '{"name": "Jane Smith"}'`,
          node: `const customer = await everpay.customers.update('cus_abc123', { name: 'Jane Smith' });`,
          python: `customer = everpay.Customer.update("cus_abc123", name="Jane Smith")`,
        }}
        response={`{\n  "id": "cus_abc123",\n  "name": "Jane Smith",\n  "updated_at": "2026-03-10T08:00:00Z"\n}`}
      />

      <ApiEndpoint method="DELETE" path="/v1/customers/:id" title="Delete a Customer" description="Permanently delete a customer."
        params={[]}
        code={{
          curl: `curl -X DELETE https://api.everpayinc.com/v1/customers/cus_abc123 \\\n  -H "Authorization: Bearer sk_test_your_key"`,
          node: `await everpay.customers.delete('cus_abc123');`,
          python: `everpay.Customer.delete("cus_abc123")`,
        }}
        response={`{\n  "id": "cus_abc123",\n  "deleted": true\n}`}
      />
    </div>
  );
};

export default CustomersApiPage;