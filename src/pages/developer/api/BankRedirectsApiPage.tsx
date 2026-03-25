import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";
import { ExternalLink, Globe } from "lucide-react";

const BankRedirectsApiPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <Badge variant="secondary" className="mb-3">API Reference</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Bank Redirects API</h1>
        <p className="text-muted-foreground mt-2">Accept payments via bank redirect methods like iDEAL, Bancontact, Open Banking, and LATAM Open Banking (Prometeo). Customers are redirected to their bank to authorize the payment, then returned to your site. Powered by Mondo Open Banking, Plaid, and Prometeo.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Supported Redirect Methods</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              { method: 'Open Banking (UK)', region: 'United Kingdom', currency: 'GBP', provider: 'Mondo', logo: '/logos/ideal.svg' },
              { method: 'Open Banking (EU)', region: 'European Union', currency: 'EUR', provider: 'Mondo', logo: '/logos/ideal.svg' },
              { method: 'iDEAL', region: 'Netherlands', currency: 'EUR', provider: 'Mondo', logo: '/logos/ideal.svg' },
              { method: 'Bancontact', region: 'Belgium', currency: 'EUR', provider: 'Mondo', logo: '/logos/bancontact.svg' },
              { method: 'PIX', region: 'Brazil', currency: 'BRL', provider: 'FacilitaPay', logo: null },
              { method: 'Plaid Pay', region: 'United States', currency: 'USD', provider: 'Plaid', logo: null },
              { method: 'SPEI (Mexico)', region: 'Mexico', currency: 'MXN', provider: 'Prometeo', logo: null },
              { method: 'PSE (Colombia)', region: 'Colombia', currency: 'COP', provider: 'Prometeo', logo: null },
              { method: 'Open Finance (Brazil)', region: 'Brazil', currency: 'BRL', provider: 'Prometeo', logo: null },
              { method: 'Bank Redirect (Chile)', region: 'Chile', currency: 'CLP', provider: 'Prometeo', logo: null },
              { method: 'Bank Redirect (Peru)', region: 'Peru', currency: 'PEN', provider: 'Prometeo', logo: null },
              { method: 'Bank Redirect (Uruguay)', region: 'Uruguay', currency: 'UYU', provider: 'Prometeo', logo: null },
              { method: 'Bank Redirect (Argentina)', region: 'Argentina', currency: 'ARS', provider: 'Prometeo', logo: null },
            ].map((m) => (
              <div key={m.method} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {m.logo ? (
                    <img src={m.logo} alt={m.method} className="h-5 w-auto" />
                  ) : (
                    <ExternalLink className="h-4 w-4 text-primary" />
                  )}
                  <span className="font-medium text-foreground">{m.method}</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><strong>Region:</strong> {m.region}</p>
                  <p><strong>Currency:</strong> {m.currency}</p>
                  <p><strong>Provider:</strong> {m.provider}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">The Bank Redirect Object</CardTitle></CardHeader>
        <CardContent>
          <CodeBlock code={`{
  "id": "br_abc123",
  "object": "bank_redirect",
  "amount": 7500,
  "currency": "eur",
  "status": "pending",
  "method": "ideal",
  "redirect_url": "https://checkout.everpayinc.com/redirect/br_abc123",
  "return_url": "https://yoursite.com/checkout/complete",
  "bank_name": "ING",
  "customer_id": "cus_abc",
  "payment_intent_id": "pi_xyz789",
  "expires_at": "2026-03-25T12:15:00Z",
  "created_at": "2026-03-25T12:00:00Z"
}`} language="curl" />
        </CardContent>
      </Card>

      <ApiEndpoint
        method="POST"
        path="/v2/bank-redirects"
        title="Create a Bank Redirect Payment"
        description="Initiate a payment via bank redirect. Returns a redirect_url to send the customer to their bank for authorization."
        params={[
          { name: "amount", type: "integer", required: true, desc: "Amount in smallest currency unit" },
          { name: "currency", type: "string", required: true, desc: "ISO currency code (eur, gbp, usd, brl)" },
          { name: "method", type: "string", required: true, desc: "Redirect method: ideal, bancontact, open_banking, pix, plaid_pay" },
          { name: "return_url", type: "string", required: true, desc: "URL to redirect customer after bank authorization" },
          { name: "customer_id", type: "string", required: false, desc: "Customer ID for the payment" },
          { name: "bank_code", type: "string", required: false, desc: "Bank identifier (required for iDEAL)" },
          { name: "description", type: "string", required: false, desc: "Payment description" },
          { name: "metadata", type: "object", required: false, desc: "Additional metadata" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v2/bank-redirects \\
  -H "Authorization: Bearer sk_test_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 7500,
    "currency": "eur",
    "method": "ideal",
    "bank_code": "INGBNL2A",
    "return_url": "https://yoursite.com/checkout/complete",
    "description": "Order #2048"
  }'`,
          node: `const redirect = await everpay.bankRedirects.create({
  amount: 7500,
  currency: 'eur',
  method: 'ideal',
  bank_code: 'INGBNL2A',
  return_url: 'https://yoursite.com/checkout/complete',
  description: 'Order #2048',
});`,
          python: `redirect = everpay.BankRedirect.create(
  amount=7500,
  currency="eur",
  method="ideal",
  bank_code="INGBNL2A",
  return_url="https://yoursite.com/checkout/complete",
  description="Order #2048",
)`,
        }}
        response={`{
  "id": "br_abc123",
  "status": "pending",
  "redirect_url": "https://checkout.everpayinc.com/redirect/br_abc123",
  "method": "ideal",
  "expires_at": "2026-03-25T12:15:00Z"
}`}
      />

      <ApiEndpoint
        method="GET"
        path="/v2/bank-redirects/:id"
        title="Retrieve a Bank Redirect"
        description="Check the status of a bank redirect payment after the customer returns from their bank."
        params={[
          { name: "id", type: "string", required: true, desc: "The bank redirect ID" },
        ]}
        code={{
          curl: `curl https://api.everpayinc.com/v2/bank-redirects/br_abc123 \\
  -H "Authorization: Bearer sk_test_your_key"`,
          node: `const redirect = await everpay.bankRedirects.retrieve('br_abc123');`,
          python: `redirect = everpay.BankRedirect.retrieve("br_abc123")`,
        }}
        response={`{
  "id": "br_abc123",
  "status": "succeeded",
  "amount": 7500,
  "currency": "eur",
  "method": "ideal",
  "bank_name": "ING",
  "payment_intent_id": "pi_xyz789"
}`}
      />

      <ApiEndpoint
        method="GET"
        path="/v2/bank-redirects/:method/banks"
        title="List Available Banks"
        description="Retrieve a list of available banks for a specific redirect method (e.g., iDEAL issuers)."
        params={[
          { name: "method", type: "string", required: true, desc: "The redirect method: ideal, bancontact, open_banking" },
          { name: "country", type: "string", required: false, desc: "ISO country code to filter banks" },
        ]}
        code={{
          curl: `curl https://api.everpayinc.com/v2/bank-redirects/ideal/banks \\
  -H "Authorization: Bearer sk_test_your_key"`,
          node: `const banks = await everpay.bankRedirects.listBanks('ideal');`,
          python: `banks = everpay.BankRedirect.list_banks("ideal")`,
        }}
        response={`{
  "object": "list",
  "data": [
    { "id": "INGBNL2A", "name": "ING", "country": "NL" },
    { "id": "RABONL2U", "name": "Rabobank", "country": "NL" },
    { "id": "ABNANL2A", "name": "ABN AMRO", "country": "NL" }
  ]
}`}
      />

      <Card>
        <CardHeader><CardTitle className="text-lg">Webhooks</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          {[
            ['bank_redirect.created', 'Redirect payment initiated, customer sent to bank'],
            ['bank_redirect.succeeded', 'Customer authorized — payment confirmed'],
            ['bank_redirect.failed', 'Authorization failed or customer declined'],
            ['bank_redirect.expired', 'Redirect link expired before customer completed auth'],
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

export default BankRedirectsApiPage;
