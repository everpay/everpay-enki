import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";

const ProductsApiPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <Badge variant="secondary" className="mb-3">API Reference</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Products API</h1>
        <p className="text-muted-foreground mt-2">Create and manage products and pricing for subscriptions and one-time purchases.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">The Product Object</CardTitle></CardHeader>
        <CardContent>
          <CodeBlock code={`{\n  "id": "prod_abc123",\n  "object": "product",\n  "name": "Pro Plan",\n  "active": true,\n  "prices": [{"id": "price_monthly", "amount": 4999, "currency": "usd", "interval": "month"}],\n  "created_at": "2026-03-09T12:00:00Z"\n}`} language="curl" />
        </CardContent>
      </Card>

      <ApiEndpoint method="POST" path="/v2/products" title="Create a Product" description="Create a new product."
        params={[
          { name: "name", type: "string", required: true, desc: "Product name" },
          { name: "description", type: "string", required: false, desc: "Product description" },
          { name: "active", type: "boolean", required: false, desc: "Whether available (default true)" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v2/products \\\n  -H "Authorization: Bearer sk_test_your_key" \\\n  -d '{"name": "Pro Plan", "description": "Full API access"}'`,
          node: `const product = await everpay.products.create({ name: 'Pro Plan', description: 'Full API access' });`,
          python: `product = everpay.Product.create(name="Pro Plan", description="Full API access")`,
        }}
        response={`{\n  "id": "prod_abc123",\n  "name": "Pro Plan",\n  "active": true,\n  "created_at": "2026-03-09T12:00:00Z"\n}`}
      />

      <ApiEndpoint method="GET" path="/v2/products" title="List Products" description="Retrieve a paginated list of products."
        params={[{ name: "active", type: "boolean", required: false, desc: "Filter by active status" }]}
        code={{
          curl: `curl "https://api.everpayinc.com/v2/products?active=true" \\\n  -H "Authorization: Bearer sk_test_your_key"`,
          node: `const products = await everpay.products.list({ active: true });`,
          python: `products = everpay.Product.list(active=True)`,
        }}
        response={`{\n  "object": "list",\n  "data": [...],\n  "total_count": 8\n}`}
      />
    </div>
  );
};

export default ProductsApiPage;