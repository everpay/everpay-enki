import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";

const PaymentMethodsApiPage = () => (
  <div className="max-w-4xl mx-auto space-y-10">
    <div>
      <Badge variant="secondary" className="mb-3">API Reference</Badge>
      <h1 className="text-3xl font-bold tracking-tight">Payment Methods API</h1>
      <p className="text-muted-foreground mt-2">Attach, retrieve, and manage payment methods for customers. Supports cards, bank accounts, and digital wallets.</p>
    </div>

    <Card>
      <CardHeader><CardTitle className="text-lg">The Payment Method Object</CardTitle></CardHeader>
      <CardContent>
        <CodeBlock code={`{
  "id": "pm_abc123",
  "object": "payment_method",
  "customer_id": "cus_abc123",
  "card_brand": "visa",
  "card_last4": "4242",
  "exp_month": "12",
  "exp_year": "2028",
  "is_default": true,
  "network_token_status": "active",
  "created_at": "2026-03-25T12:00:00Z"
}`} language="curl" />
      </CardContent>
    </Card>

    <ApiEndpoint method="POST" path="/v1/payment-methods" title="Attach a Payment Method"
      description="Attach a tokenized payment method to a customer. Card data must be tokenized via VGS or PCI-compliant vault."
      params={[
        { name: "customer_id", type: "string", required: true, desc: "Customer to attach to" },
        { name: "vgs_alias", type: "string", required: true, desc: "VGS token alias for card data" },
        { name: "card_brand", type: "string", required: false, desc: "visa, mastercard, amex, discover" },
        { name: "card_last4", type: "string", required: false, desc: "Last 4 digits of card" },
        { name: "exp_month", type: "string", required: false, desc: "Expiration month" },
        { name: "exp_year", type: "string", required: false, desc: "Expiration year" },
        { name: "is_default", type: "boolean", required: false, desc: "Set as default (default false)" },
      ]}
      code={{
        curl: `curl -X POST https://api.everpayinc.com/v1/payment-methods \\
  -H "Authorization: Bearer sk_test_your_key" \\
  -d '{
    "customer_id": "cus_abc123",
    "vgs_alias": "tok_sandbox_abc123",
    "card_brand": "visa",
    "card_last4": "4242",
    "exp_month": "12",
    "exp_year": "2028"
  }'`,
        node: `const pm = await everpay.paymentMethods.create({
  customer_id: 'cus_abc123',
  vgs_alias: 'tok_sandbox_abc123',
  card_brand: 'visa',
  card_last4: '4242',
});`,
        python: `pm = everpay.PaymentMethod.create(
  customer_id="cus_abc123",
  vgs_alias="tok_sandbox_abc123",
  card_brand="visa",
  card_last4="4242",
)`,
      }}
      response={`{
  "id": "pm_abc123",
  "object": "payment_method",
  "card_brand": "visa",
  "card_last4": "4242",
  "is_default": false
}`}
    />

    <ApiEndpoint method="GET" path="/v1/payment-methods" title="List Payment Methods"
      description="Retrieve payment methods, optionally filtered by customer."
      params={[
        { name: "customer", type: "string", required: false, desc: "Filter by customer ID" },
        { name: "limit", type: "integer", required: false, desc: "Results per page (default 25, max 100)" },
      ]}
      code={{
        curl: `curl "https://api.everpayinc.com/v1/payment-methods?customer=cus_abc123" \\
  -H "Authorization: Bearer sk_test_your_key"`,
        node: `const methods = await everpay.paymentMethods.list({ customer: 'cus_abc123' });`,
        python: `methods = everpay.PaymentMethod.list(customer="cus_abc123")`,
      }}
      response={`{
  "object": "list",
  "data": [...],
  "has_more": false,
  "total_count": 3,
  "url": "/v1/payment-methods"
}`}
    />

    <ApiEndpoint method="DELETE" path="/v1/payment-methods/:id" title="Detach a Payment Method"
      description="Detach a payment method from its customer. The method can no longer be used for payments."
      code={{
        curl: `curl -X DELETE https://api.everpayinc.com/v1/payment-methods/pm_abc123 \\
  -H "Authorization: Bearer sk_test_your_key"`,
        node: `await everpay.paymentMethods.detach('pm_abc123');`,
        python: `everpay.PaymentMethod.detach("pm_abc123")`,
      }}
      response={`{
  "id": "pm_abc123",
  "object": "payment_method",
  "deleted": true
}`}
    />
  </div>
);

export default PaymentMethodsApiPage;
