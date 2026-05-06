import { ApiEndpoint } from "@/components/developer/ApiEndpoint";

const MatrixApiPage = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl font-bold">Matrix Partners API</h1>
      <p className="text-muted-foreground mt-2">
        Full payment gateway integration — cards, payouts, oneclick, subscriptions, H2H, and MID management.
        Not available for US-based customers/cards.
      </p>
    </div>

    <ApiEndpoint
      method="POST" path="/v1/customer/token" title="Get Customer Token"
      description="Retrieve a customer token for Card.js integration. Pass this token to the Card.js SDK so customers can save and reuse their cards."
      params={[
        { name: "id", type: "string", required: true, desc: "Unique obfuscated customer identifier on your side" },
        { name: "details", type: "object", required: false, desc: "Additional customer info (email, birthday, etc.)" },
        { name: "labels", type: "array", required: false, desc: "Customer labels for routing (e.g. first_time_deposit)" },
      ]}
      code={{
        curl: `curl -X POST \\
  -u pk_xxx:sk_xxx \\
  -H "Content-Type: application/json" \\
  -d '{"id":"U31676025316"}' \\
  https://api.matrixpaysolution.com/v1/customer/token`,
        node: `const { data } = await supabase.functions.invoke('matrix-process', {
  body: { action: 'customer_token', id: 'U31676025316' }
});`,
        python: `import requests
r = requests.post('https://api.matrixpaysolution.com/v1/customer/token',
  auth=('pk_xxx', 'sk_xxx'),
  json={"id": "U31676025316"})`,
      }}
      response={`{
  "status": "success",
  "code": 0,
  "customer_token": "a5be57bad982a6f63e4a03b1b939c579"
}`}
    />

    <ApiEndpoint
      method="POST" path="/v1/transaction/pay" title="Transaction Pay"
      description="Direct card payment using a payment token from Card.js. Supports 3DS redirect, currency conversion, and cascading."
      params={[
        { name: "reference", type: "string", required: true, desc: "Unique request identifier" },
        { name: "order_id", type: "string", required: true, desc: "Unique order identifier" },
        { name: "order_description", type: "string", required: true, desc: "Order description" },
        { name: "token", type: "string", required: true, desc: "Payment token from Card.js" },
        { name: "amount", type: "integer", required: true, desc: "Amount in minor units (100 = 1.00)" },
        { name: "currency", type: "string", required: true, desc: "ISO 4217 currency code" },
        { name: "subscribe", type: "boolean", required: false, desc: "Create subscription token" },
        { name: "allow_cascading_after_3ds", type: "boolean", required: false, desc: "Try alternative provider after 3DS failure" },
      ]}
      code={{
        curl: `curl -X POST \\
  -u pk_xxx:sk_xxx \\
  -H "Content-Type: application/json" \\
  -d '{"reference":"ref123","order_id":"ord456","order_description":"Test","token":"abc","amount":100,"currency":"EUR"}' \\
  https://api.matrixpaysolution.com/v1/transaction/pay`,
        node: `const { data } = await supabase.functions.invoke('matrix-process', {
  body: {
    action: 'pay',
    reference: 'ref123', order_id: 'ord456',
    order_description: 'Test', token: 'abc',
    amount: 100, currency: 'EUR'
  }
});`,
        python: `r = requests.post('.../v1/transaction/pay',
  auth=('pk', 'sk'),
  json={"reference":"ref123","order_id":"ord456",
        "order_description":"Test","token":"abc",
        "amount":100,"currency":"EUR"})`,
      }}
      response={`{
  "status": "success",
  "code": 0,
  "id": "order-abc123",
  "transactions": [{
    "id": "tx_def456",
    "status": "success",
    "code": 0,
    "amount": 100,
    "currency": "EUR"
  }]
}`}
    />

    <ApiEndpoint
      method="POST" path="/v1/transaction/payout/init" title="Transaction Payout"
      description="Send money to a customer's card (OCT — Original Credit Transaction). Requires a payout token from Card.js."
      params={[
        { name: "reference", type: "string", required: true, desc: "Unique request identifier" },
        { name: "order_id", type: "string", required: true, desc: "Unique order identifier" },
        { name: "order_description", type: "string", required: true, desc: "Order description" },
        { name: "token", type: "string", required: true, desc: "Payout token from Card.js" },
        { name: "amount", type: "integer", required: true, desc: "Amount in minor units" },
        { name: "currency", type: "string", required: true, desc: "ISO 4217 currency code" },
      ]}
      code={{
        curl: `curl -X POST \\
  -u pk_xxx:sk_xxx \\
  -H "Content-Type: application/json" \\
  -d '{"reference":"ref1","order_id":"po_1","order_description":"Payout","token":"tok","amount":5000,"currency":"EUR"}' \\
  https://api.matrixpaysolution.com/v1/transaction/payout/init`,
        node: `const { data } = await supabase.functions.invoke('matrix-process', {
  body: { action: 'payout', reference: 'ref1', order_id: 'po_1',
    order_description: 'Payout', token: 'tok', amount: 5000, currency: 'EUR' }
});`,
        python: `r = requests.post('.../v1/transaction/payout/init',
  auth=('pk', 'sk'),
  json={"reference":"ref1","order_id":"po_1",
        "order_description":"Payout","token":"tok",
        "amount":5000,"currency":"EUR"})`,
      }}
      response={`{
  "status": "success",
  "code": 0,
  "transactions": [{
    "id": "tx_po_123",
    "status": "success",
    "type": "payout",
    "amount": 5000,
    "currency": "EUR"
  }]
}`}
    />

    <ApiEndpoint
      method="POST" path="/v1/checkout/oneclick/init" title="Create Oneclick Token"
      description="Create a oneclick payment token. Returns a checkout redirect URL. The oneclick token maps to multiple provider subscription tokens under the hood."
      params={[
        { name: "reference", type: "string", required: true, desc: "Unique request identifier" },
        { name: "order_id", type: "string", required: true, desc: "Unique order identifier" },
        { name: "order_description", type: "string", required: true, desc: "Order description" },
        { name: "amount", type: "integer", required: true, desc: "Amount in minor units" },
        { name: "currency", type: "string", required: true, desc: "ISO 4217 currency code" },
        { name: "oneclick_token", type: "string", required: false, desc: "Existing oneclick token (to add new provider subscriptions)" },
        { name: "check_all_routes", type: "boolean", required: false, desc: "Check all routes including non-subscription" },
      ]}
      code={{
        curl: `curl -X POST \\
  -u pk_xxx:sk_xxx \\
  -H "Content-Type: application/json" \\
  -d '{"reference":"ref1","order_id":"oc_1","order_description":"Oneclick","amount":100,"currency":"EUR"}' \\
  https://api.matrixpaysolution.com/v1/checkout/oneclick/init`,
        node: `const { data } = await supabase.functions.invoke('matrix-process', {
  body: { action: 'oneclick_create', reference: 'ref1',
    order_id: 'oc_1', order_description: 'Oneclick',
    amount: 100, currency: 'EUR' }
});`,
        python: `r = requests.post('.../v1/checkout/oneclick/init',
  auth=('pk', 'sk'),
  json={"reference":"ref1","order_id":"oc_1",
        "order_description":"Oneclick","amount":100,"currency":"EUR"})`,
      }}
      response={`{
  "status": "pending",
  "code": 0,
  "redirect_url": "https://checkout.matrixpaysolution.com/oneclick/...",
  "oneclick_token": "72b4f58426b31c62..."
}`}
    />

    <ApiEndpoint
      method="POST" path="/v1/oneclick/transaction/pay" title="Oneclick Pay"
      description="Charge a customer using their existing oneclick token. No card re-entry needed."
      params={[
        { name: "reference", type: "string", required: true, desc: "Unique request identifier" },
        { name: "order_id", type: "string", required: true, desc: "Unique order identifier" },
        { name: "order_description", type: "string", required: true, desc: "Order description" },
        { name: "amount", type: "integer", required: true, desc: "Amount in minor units" },
        { name: "currency", type: "string", required: true, desc: "ISO 4217 currency code" },
        { name: "oneclick_token", type: "string", required: true, desc: "Oneclick token from previous init" },
      ]}
      code={{
        curl: `curl -X POST \\
  -u pk_xxx:sk_xxx \\
  -H "Content-Type: application/json" \\
  -d '{"reference":"ref2","order_id":"ocp_1","order_description":"Pay","amount":500,"currency":"EUR","oneclick_token":"72b4f..."}' \\
  https://api.matrixpaysolution.com/v1/oneclick/transaction/pay`,
        node: `const { data } = await supabase.functions.invoke('matrix-process', {
  body: { action: 'oneclick_pay', reference: 'ref2',
    order_id: 'ocp_1', order_description: 'Pay',
    amount: 500, currency: 'EUR', oneclick_token: '72b4f...' }
});`,
        python: `r = requests.post('.../v1/oneclick/transaction/pay',
  auth=('pk', 'sk'),
  json={"reference":"ref2","order_id":"ocp_1",
        "order_description":"Pay","amount":500,
        "currency":"EUR","oneclick_token":"72b4f..."})`,
      }}
      response={`{
  "status": "success",
  "code": 0,
  "transactions": [{
    "id": "tx_oc_pay1",
    "status": "success",
    "amount": 500,
    "currency": "EUR"
  }]
}`}
    />

    <ApiEndpoint
      method="POST" path="/v1/mid/details" title="MID Details"
      description="Get detailed information about a specific Merchant ID (MID) — provider, currency, payment methods, features."
      params={[
        { name: "mid", type: "string", required: true, desc: "MID identifier (e.g. TZ-0000000000)" },
      ]}
      code={{
        curl: `curl -X POST \\
  -u pk_xxx:sk_xxx \\
  -H "Content-Type: application/json" \\
  -d '{"mid":"TZ-0000000001"}' \\
  https://api.matrixpaysolution.com/v1/mid/details`,
        node: `const { data } = await supabase.functions.invoke('matrix-process', {
  body: { action: 'mid_details', mid: 'TZ-0000000001' }
});`,
        python: `r = requests.post('.../v1/mid/details',
  auth=('pk', 'sk'),
  json={"mid":"TZ-0000000001"})`,
      }}
      response={`{
  "status": "success",
  "code": 0,
  "mid": {
    "id": "TZ-0000000001",
    "status": "active",
    "provider": "Provider A",
    "currency": "EUR",
    "descriptor": "EVERPAY*PAYMENT",
    "payment_methods": ["visa", "mastercard", "amex"],
    "features": { "subscriptions": true, "payouts": true }
  }
}`}
    />

    <ApiEndpoint
      method="POST" path="/v1/balance/mid" title="MID Balance"
      description="Get available, pending, and reserved balances for a specific MID."
      params={[
        { name: "mid", type: "string", required: true, desc: "MID identifier" },
      ]}
      code={{
        curl: `curl -X POST -u pk_xxx:sk_xxx \\
  -d '{"mid":"TZ-0000000001"}' \\
  https://api.matrixpaysolution.com/v1/balance/mid`,
        node: `const { data } = await supabase.functions.invoke('matrix-process', {
  body: { action: 'mid_balance', mid: 'TZ-0000000001' }
});`,
        python: `r = requests.post('.../v1/balance/mid',
  auth=('pk', 'sk'), json={"mid":"TZ-0000000001"})`,
      }}
      response={`{
  "status": "success",
  "balance": {
    "mid": "TZ-0000000001",
    "currency": "EUR",
    "available": 125000,
    "pending": 8500,
    "reserved": 12000,
    "total": 145500
  }
}`}
    />

    <ApiEndpoint
      method="POST" path="/v1/h2h/payment" title="H2H Payment (Host-to-Host)"
      description="Direct card debit — requires PCI DSS Level 1 compliance. Card data sent directly (not via Card.js)."
      params={[
        { name: "order_id", type: "string", required: true, desc: "Unique order identifier" },
        { name: "order_description", type: "string", required: true, desc: "Order description" },
        { name: "amount", type: "integer", required: true, desc: "Amount in minor units" },
        { name: "currency", type: "string", required: true, desc: "ISO 4217 currency code" },
        { name: "cc_number", type: "string", required: true, desc: "Card PAN (13-19 digits)" },
        { name: "exp_month", type: "integer", required: true, desc: "Expiry month (1-12)" },
        { name: "exp_year", type: "integer", required: true, desc: "Expiry year (2020+)" },
        { name: "card_cvv", type: "string", required: true, desc: "CVV/CVC code" },
        { name: "customer_ip", type: "string", required: true, desc: "Customer's IP address" },
      ]}
      code={{
        curl: `curl -X POST -u pk_xxx:sk_xxx \\
  -d '{"order_id":"h2h_1","order_description":"H2H Pay","amount":100,"currency":"USD","cc_number":"4012000300001003","exp_month":1,"exp_year":2029,"card_cvv":"030","customer_ip":"1.2.3.4"}' \\
  https://api.matrixpaysolution.com/v1/h2h/payment`,
        node: `const { data } = await supabase.functions.invoke('matrix-process', {
  body: { action: 'h2h_payment', order_id: 'h2h_1',
    order_description: 'H2H Pay', amount: 100, currency: 'USD',
    cc_number: '4012000300001003', exp_month: 1,
    exp_year: 2029, card_cvv: '030', customer_ip: '1.2.3.4' }
});`,
        python: `r = requests.post('.../v1/h2h/payment', auth=('pk','sk'),
  json={"order_id":"h2h_1","order_description":"H2H Pay",
        "amount":100,"currency":"USD","cc_number":"4012000300001003",
        "exp_month":1,"exp_year":2029,"card_cvv":"030",
        "customer_ip":"1.2.3.4"})`,
      }}
      response={`{
  "status": "success",
  "code": 0,
  "transactions": [{
    "id": "tx_h2h_1",
    "status": "success",
    "amount": 100,
    "currency": "USD"
  }]
}`}
    />

    <ApiEndpoint
      method="POST" path="/v1/subscription/plan/create" title="Create Subscription Plan"
      description="Create a fixed billing plan with pricing, billing period, and retry logic."
      params={[
        { name: "name", type: "string", required: true, desc: "Plan name" },
        { name: "billing_period", type: "object", required: true, desc: "{ kind: 'DAYS'|'WEEKS'|'MONTHS'|'YEARS', value: number }" },
        { name: "retries", type: "array", required: true, desc: "Retry schedule array [{kind, value}]" },
        { name: "prices", type: "array", required: true, desc: "Price per currency [{currency, value}] in minor units" },
        { name: "default_price_currency", type: "string", required: true, desc: "Default currency code" },
      ]}
      code={{
        curl: `curl -X POST -u pk_xxx:sk_xxx \\
  -d '{"name":"Monthly Pro","billing_period":{"kind":"MONTHS","value":1},"retries":[{"kind":"N_DAY","value":3}],"prices":[{"currency":"USD","value":999}],"default_price_currency":"USD"}' \\
  https://api.matrixpaysolution.com/v1/subscription/plan/create`,
        node: `const { data } = await supabase.functions.invoke('matrix-process', {
  body: { action: 'plan_create', name: 'Monthly Pro',
    billing_period: { kind: 'MONTHS', value: 1 },
    retries: [{ kind: 'N_DAY', value: 3 }],
    prices: [{ currency: 'USD', value: 999 }],
    default_price_currency: 'USD' }
});`,
        python: `r = requests.post('.../v1/subscription/plan/create',
  auth=('pk','sk'),
  json={"name":"Monthly Pro",
        "billing_period":{"kind":"MONTHS","value":1},
        "retries":[{"kind":"N_DAY","value":3}],
        "prices":[{"currency":"USD","value":999}],
        "default_price_currency":"USD"})`,
      }}
      response={`{
  "status": "success",
  "code": 0,
  "plan": {
    "id": "plan_abc123",
    "name": "Monthly Pro",
    "status": "ACTIVE"
  }
}`}
    />
  </div>
);

export default MatrixApiPage;
