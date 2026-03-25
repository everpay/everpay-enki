import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";

const PlansApiPage = () => (
  <div className="max-w-4xl mx-auto space-y-10">
    <div>
      <Badge variant="secondary" className="mb-3">API Reference</Badge>
      <h1 className="text-3xl font-bold tracking-tight">Plans API</h1>
      <p className="text-muted-foreground mt-2">Create and manage subscription plans with flexible intervals and pricing.</p>
    </div>

    <Card>
      <CardHeader><CardTitle className="text-lg">The Plan Object</CardTitle></CardHeader>
      <CardContent>
        <CodeBlock code={`{
  "id": "plan_abc123",
  "object": "plan",
  "name": "Pro Monthly",
  "amount": 4999,
  "currency": "usd",
  "interval": "month",
  "trial_days": 14,
  "active": true,
  "created_at": "2026-03-25T12:00:00Z"
}`} language="curl" />
      </CardContent>
    </Card>

    <ApiEndpoint method="POST" path="/v2/plans" title="Create a Plan"
      description="Create a new subscription plan."
      params={[
        { name: "name", type: "string", required: true, desc: "Plan name" },
        { name: "amount", type: "integer", required: true, desc: "Price in smallest currency unit" },
        { name: "currency", type: "string", required: false, desc: "Three-letter ISO code (default USD)" },
        { name: "interval", type: "string", required: true, desc: "Billing interval: day, week, month, year" },
        { name: "trial_days", type: "integer", required: false, desc: "Free trial period in days" },
        { name: "active", type: "boolean", required: false, desc: "Whether plan is active (default true)" },
      ]}
      code={{
        curl: `curl -X POST https://api.everpayinc.com/v2/plans \\
  -H "Authorization: Bearer sk_test_your_key" \\
  -d '{
    "name": "Pro Monthly",
    "amount": 4999,
    "currency": "usd",
    "interval": "month",
    "trial_days": 14
  }'`,
        node: `const plan = await everpay.plans.create({
  name: 'Pro Monthly',
  amount: 4999,
  interval: 'month',
  trial_days: 14,
});`,
        python: `plan = everpay.Plan.create(
  name="Pro Monthly",
  amount=4999,
  interval="month",
  trial_days=14,
)`,
      }}
      response={`{
  "id": "plan_abc123",
  "object": "plan",
  "name": "Pro Monthly",
  "amount": 4999,
  "active": true
}`}
    />

    <ApiEndpoint method="GET" path="/v2/plans" title="List Plans"
      description="Retrieve all subscription plans."
      params={[
        { name: "limit", type: "integer", required: false, desc: "Results per page (default 25, max 100)" },
        { name: "active", type: "boolean", required: false, desc: "Filter by active status" },
      ]}
      code={{
        curl: `curl "https://api.everpayinc.com/v2/plans" \\
  -H "Authorization: Bearer sk_test_your_key"`,
        node: `const plans = await everpay.plans.list();`,
        python: `plans = everpay.Plan.list()`,
      }}
      response={`{
  "object": "list",
  "data": [...],
  "has_more": false,
  "total_count": 5,
  "url": "/v2/plans"
}`}
    />

    <ApiEndpoint method="PATCH" path="/v2/plans/:id" title="Update a Plan"
      description="Update an existing plan. Amount changes only apply to future subscriptions."
      params={[
        { name: "name", type: "string", required: false, desc: "Updated plan name" },
        { name: "active", type: "boolean", required: false, desc: "Activate or deactivate the plan" },
        { name: "trial_days", type: "integer", required: false, desc: "Updated trial period" },
      ]}
      code={{
        curl: `curl -X PATCH https://api.everpayinc.com/v2/plans/plan_abc123 \\
  -H "Authorization: Bearer sk_test_your_key" \\
  -d '{"active": false}'`,
        node: `await everpay.plans.update('plan_abc123', { active: false });`,
        python: `everpay.Plan.modify("plan_abc123", active=False)`,
      }}
      response={`{
  "id": "plan_abc123",
  "object": "plan",
  "active": false
}`}
    />
  </div>
);

export default PlansApiPage;
