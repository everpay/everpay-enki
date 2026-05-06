import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/developer/CodeBlock";

const steps = [
  {
    num: 1,
    title: "Get your API keys",
    desc: "Sign up and grab your sandbox keys from the dashboard.",
    code: {
      curl: `# Your sandbox key starts with sk_test_\nexport EVERPAY_API_KEY="sk_test_your_key_here"`,
      node: `// Install the SDK\nnpm install @everpay/node\n\n// Initialize\nconst Everpay = require('@everpay/node');\nconst everpay = new Everpay('sk_test_your_key_here');`,
      python: `# Install the SDK\npip install everpay\n\n# Initialize\nimport everpay\neverpay.api_key = "sk_test_your_key_here"`,
    },
  },
  {
    num: 2,
    title: "Create a payment",
    desc: "Charge a customer using the Payments API.",
    code: {
      curl: `curl -X POST https://api.everpayinc.com/v1/payments \\\n  -H "Authorization: Bearer $EVERPAY_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "amount": 5000,\n    "currency": "usd",\n    "payment_method": "pm_card_visa",\n    "description": "Order #1234"\n  }'`,
      node: `const payment = await everpay.payments.create({\n  amount: 5000,\n  currency: 'usd',\n  payment_method: 'pm_card_visa',\n  description: 'Order #1234',\n});\n\nconsole.log(payment.id); // pay_abc123`,
      python: `payment = everpay.Payment.create(\n  amount=5000,\n  currency="usd",\n  payment_method="pm_card_visa",\n  description="Order #1234",\n)\n\nprint(payment.id)  # pay_abc123`,
    },
  },
  {
    num: 3,
    title: "Handle webhooks",
    desc: "Listen for payment events in real-time.",
    code: {
      curl: `# Webhook payload example\n{\n  "event": "payment.completed",\n  "data": {\n    "id": "pay_abc123",\n    "amount": 5000,\n    "status": "succeeded"\n  }\n}`,
      node: `app.post('/webhooks', (req, res) => {\n  const sig = req.headers['x-everpay-signature'];\n  const event = everpay.webhooks.verify(req.body, sig);\n\n  if (event.type === 'payment.completed') {\n    console.log('Payment succeeded:', event.data.id);\n  }\n\n  res.json({ received: true });\n});`,
      python: `@app.route('/webhooks', methods=['POST'])\ndef handle_webhook():\n    sig = request.headers['X-Everpay-Signature']\n    event = everpay.Webhook.verify(request.data, sig)\n\n    if event.type == 'payment.completed':\n        print(f"Payment succeeded: {event.data.id}")\n\n    return jsonify(received=True)`,
    },
  },
];

const QuickStartPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Badge variant="secondary" className="mb-3">Quick Start</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Get started in 5 minutes</h1>
        <p className="text-muted-foreground mt-2">Follow these steps to integrate Everpay into your application.</p>
      </div>

      {steps.map((step) => (
        <Card key={step.num} className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {step.num}
              </div>
              <div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CodeBlock code={step.code} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuickStartPage;