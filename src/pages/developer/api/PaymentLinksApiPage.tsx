import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";

const PaymentLinksApiPage = () => (
  <div className="max-w-4xl mx-auto space-y-10">
    <div>
      <Badge variant="secondary" className="mb-3">API Reference</Badge>
      <h1 className="text-3xl font-bold tracking-tight">Payment Links API</h1>
      <p className="text-muted-foreground mt-2">Create shareable payment links for one-time or recurring payments without writing frontend code.</p>
    </div>

    <Card>
      <CardHeader><CardTitle className="text-lg">The Payment Link Object</CardTitle></CardHeader>
      <CardContent>
        <CodeBlock code={`{
  "id": "plink_abc123",
  "object": "payment_link",
  "url": "https://checkout.everpayinc.com/pay/a1b2c3d4e5f6",
  "amount": 5000,
  "currency": "usd",
  "active": true,
  "description": "Premium subscription",
  "metadata": {},
  "created_at": "2026-03-25T12:00:00Z"
}`} language="curl" />
      </CardContent>
    </Card>

    <ApiEndpoint method="POST" path="/v1/payment-links" title="Create a Payment Link"
      description="Create a new payment link. The link can be shared with customers via email, SMS, or embedded in websites."
      params={[
        { name: "amount", type: "integer", required: true, desc: "Amount in smallest currency unit" },
        { name: "currency", type: "string", required: false, desc: "Three-letter ISO code (default USD)" },
        { name: "description", type: "string", required: false, desc: "Description shown at checkout" },
        { name: "redirect_url", type: "string", required: false, desc: "URL to redirect after payment" },
        { name: "metadata", type: "object", required: false, desc: "Arbitrary key-value metadata" },
      ]}
      code={{
        curl: `curl -X POST https://api.everpayinc.com/v1/payment-links \\
  -H "Authorization: Bearer sk_test_your_key" \\
  -d '{
    "amount": 5000,
    "currency": "usd",
    "description": "Premium subscription"
  }'`,
        node: `const link = await everpay.paymentLinks.create({
  amount: 5000,
  currency: 'usd',
  description: 'Premium subscription',
});
console.log(link.url); // https://checkout.everpayinc.com/pay/...`,
        python: `link = everpay.PaymentLink.create(
  amount=5000,
  currency="usd",
  description="Premium subscription",
)
print(link.url)`,
      }}
      response={`{
  "id": "plink_abc123",
  "object": "payment_link",
  "url": "https://checkout.everpayinc.com/pay/a1b2c3d4e5f6",
  "amount": 5000,
  "active": true
}`}
    />

    <ApiEndpoint method="GET" path="/v1/payment-links" title="List Payment Links"
      description="Retrieve all payment links for the merchant."
      params={[
        { name: "limit", type: "integer", required: false, desc: "Results per page (default 25, max 100)" },
        { name: "active", type: "boolean", required: false, desc: "Filter by active status" },
      ]}
      code={{
        curl: `curl "https://api.everpayinc.com/v1/payment-links?limit=10" \\
  -H "Authorization: Bearer sk_test_your_key"`,
        node: `const links = await everpay.paymentLinks.list({ limit: 10 });`,
        python: `links = everpay.PaymentLink.list(limit=10)`,
      }}
      response={`{
  "object": "list",
  "data": [...],
  "has_more": true,
  "total_count": 24,
  "url": "/v1/payment-links"
}`}
    />

    <ApiEndpoint method="PATCH" path="/v1/payment-links/:id" title="Update a Payment Link"
      description="Deactivate or update metadata on an existing payment link."
      params={[
        { name: "active", type: "boolean", required: false, desc: "Set to false to deactivate" },
        { name: "metadata", type: "object", required: false, desc: "Updated metadata" },
      ]}
      code={{
        curl: `curl -X PATCH https://api.everpayinc.com/v1/payment-links/plink_abc123 \\
  -H "Authorization: Bearer sk_test_your_key" \\
  -d '{"active": false}'`,
        node: `await everpay.paymentLinks.update('plink_abc123', { active: false });`,
        python: `everpay.PaymentLink.modify("plink_abc123", active=False)`,
      }}
      response={`{
  "id": "plink_abc123",
  "object": "payment_link",
  "active": false
}`}
    />
  </div>
);

export default PaymentLinksApiPage;
