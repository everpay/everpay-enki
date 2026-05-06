import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";

const SubscriptionsApiPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <Badge variant="secondary" className="mb-3">API Reference</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Subscriptions API</h1>
        <p className="text-muted-foreground mt-2">Create and manage recurring billing subscriptions with dunning and retry logic.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">The Subscription Object</CardTitle></CardHeader>
        <CardContent>
          <CodeBlock code={`{\n  "id": "sub_abc123",\n  "object": "subscription",\n  "customer_id": "cus_abc123",\n  "status": "active",\n  "current_period_end": "2026-04-01T00:00:00Z",\n  "cancel_at_period_end": false,\n  "created_at": "2026-03-01T00:00:00Z"\n}`} language="curl" />
        </CardContent>
      </Card>

      <ApiEndpoint method="POST" path="/v1/subscriptions" title="Create a Subscription" description="Subscribe a customer to a recurring plan."
        params={[
          { name: "customer_id", type: "string", required: true, desc: "Customer to subscribe" },
          { name: "price_id", type: "string", required: true, desc: "Price ID for the plan" },
          { name: "trial_days", type: "integer", required: false, desc: "Number of trial days" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v1/subscriptions \\\n  -H "Authorization: Bearer sk_test_your_key" \\\n  -d '{"customer_id": "cus_abc123", "price_id": "price_monthly", "trial_days": 14}'`,
          node: `const subscription = await everpay.subscriptions.create({ customer_id: 'cus_abc123', price_id: 'price_monthly', trial_days: 14 });`,
          python: `subscription = everpay.Subscription.create(customer_id="cus_abc123", price_id="price_monthly", trial_days=14)`,
        }}
        response={`{\n  "id": "sub_abc123",\n  "status": "trialing",\n  "trial_end": "2026-03-23T00:00:00Z",\n  "created_at": "2026-03-09T12:00:00Z"\n}`}
      />

      <ApiEndpoint method="POST" path="/v1/subscriptions/:id/cancel" title="Cancel a Subscription" description="Cancel at end of period or immediately."
        params={[{ name: "at_period_end", type: "boolean", required: false, desc: "Cancel at end of current period (default true)" }]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v1/subscriptions/sub_abc123/cancel \\\n  -H "Authorization: Bearer sk_test_your_key" \\\n  -d '{"at_period_end": true}'`,
          node: `const subscription = await everpay.subscriptions.cancel('sub_abc123', { at_period_end: true });`,
          python: `subscription = everpay.Subscription.cancel("sub_abc123", at_period_end=True)`,
        }}
        response={`{\n  "id": "sub_abc123",\n  "status": "active",\n  "cancel_at_period_end": true\n}`}
      />
    </div>
  );
};

export default SubscriptionsApiPage;