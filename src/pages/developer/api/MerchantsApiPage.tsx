import { Badge } from "@/components/ui/badge";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";

const MerchantsApiPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <Badge variant="secondary" className="mb-3">API Reference</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Merchants API</h1>
        <p className="text-muted-foreground mt-2">Onboard and manage merchants on your platform.</p>
      </div>

      <ApiEndpoint method="POST" path="/v1/merchants" title="Create a Merchant" description="Register a new merchant on the platform."
        params={[
          { name: "business_name", type: "string", required: true, desc: "Legal business name" },
          { name: "business_type", type: "string", required: true, desc: "sole_proprietor, llc, corporation" },
          { name: "email", type: "string", required: true, desc: "Primary contact email" },
          { name: "country", type: "string", required: true, desc: "ISO 3166-1 alpha-2 country code" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v1/merchants \\\n  -H "Authorization: Bearer sk_test_your_key" \\\n  -d '{"business_name": "Acme Corp", "business_type": "llc", "email": "admin@acme.com", "country": "US"}'`,
          node: `const merchant = await everpay.merchants.create({ business_name: 'Acme Corp', business_type: 'llc', email: 'admin@acme.com', country: 'US' });`,
          python: `merchant = everpay.Merchant.create(business_name="Acme Corp", business_type="llc", email="admin@acme.com", country="US")`,
        }}
        response={`{\n  "id": "mer_abc123",\n  "business_name": "Acme Corp",\n  "status": "pending_verification",\n  "country": "US",\n  "created_at": "2026-03-09T12:00:00Z"\n}`}
      />

      <ApiEndpoint method="GET" path="/v1/merchants" title="List Merchants" description="Retrieve a paginated list of merchants."
        params={[
          { name: "limit", type: "integer", required: false, desc: "Results per page (default 10)" },
          { name: "status", type: "string", required: false, desc: "Filter by status" },
        ]}
        code={{
          curl: `curl "https://api.everpayinc.com/v1/merchants?limit=20&status=active" \\\n  -H "Authorization: Bearer sk_test_your_key"`,
          node: `const merchants = await everpay.merchants.list({ limit: 20, status: 'active' });`,
          python: `merchants = everpay.Merchant.list(limit=20, status="active")`,
        }}
        response={`{\n  "object": "list",\n  "data": [...],\n  "has_more": false,\n  "total_count": 5\n}`}
      />
    </div>
  );
};

export default MerchantsApiPage;