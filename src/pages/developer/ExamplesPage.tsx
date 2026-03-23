import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";

const examples = [
  {
    title: "Create a Payment Intent",
    desc: "Authorize and capture a payment in one call.",
    code: {
      curl: `curl -X POST https://api.everpayinc.com/v2/payments \\\n  -H "Authorization: Bearer sk_test_key" \\\n  -d '{"amount": 2999, "currency": "eur", "payment_method": "pm_card_visa", "capture": true}'`,
      node: `const payment = await everpay.payments.create({ amount: 2999, currency: 'eur', payment_method: 'pm_card_visa', capture: true });\nconsole.log('Payment ID:', payment.id);`,
      python: `payment = everpay.Payment.create(amount=2999, currency="eur", payment_method="pm_card_visa", capture=True)\nprint("Payment ID:", payment.id)`,
    },
  },
  {
    title: "Issue a Partial Refund",
    desc: "Refund part of a completed payment.",
    code: {
      curl: `curl -X POST https://api.everpayinc.com/v2/payments/pay_abc123/refund \\\n  -H "Authorization: Bearer sk_test_key" \\\n  -d '{"amount": 1500, "reason": "requested_by_customer"}'`,
      node: `const refund = await everpay.payments.refund('pay_abc123', { amount: 1500, reason: 'requested_by_customer' });`,
      python: `refund = everpay.Payment.refund("pay_abc123", amount=1500, reason="requested_by_customer")`,
    },
  },
  {
    title: "Verify Webhook Signature",
    desc: "Validate incoming webhook events for security.",
    code: {
      curl: `# Webhook headers include:\n# X-Everpay-Signature: hmac_sha256_hash\n# Verify using HMAC SHA-256 with your webhook secret`,
      node: `app.post('/webhooks', express.raw({type: 'application/json'}), (req, res) => {\n  const sig = req.headers['x-everpay-signature'];\n  const event = everpay.webhooks.constructEvent(req.body, sig, 'whsec_your_secret');\n  console.log('Event:', event.type);\n  res.json({ received: true });\n});`,
      python: `@app.route('/webhooks', methods=['POST'])\ndef webhook():\n    sig = request.headers.get('X-Everpay-Signature')\n    event = everpay.Webhook.construct_event(request.data, sig, "whsec_your_secret")\n    print("Event:", event.type)\n    return jsonify(received=True)`,
    },
  },
];

const ExamplesPage = () => (
  <div className="max-w-4xl mx-auto space-y-8">
    <div>
      <Badge variant="secondary" className="mb-3">Examples</Badge>
      <h1 className="text-3xl font-bold tracking-tight">Code Examples</h1>
      <p className="text-muted-foreground mt-2">Ready-to-use code snippets for common use cases.</p>
    </div>
    {examples.map((ex) => (
      <Card key={ex.title}>
        <CardHeader>
          <CardTitle className="text-lg">{ex.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{ex.desc}</p>
        </CardHeader>
        <CardContent><CodeBlock code={ex.code} /></CardContent>
      </Card>
    ))}
  </div>
);

export default ExamplesPage;