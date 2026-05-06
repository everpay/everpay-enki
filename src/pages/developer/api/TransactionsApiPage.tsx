import { Badge } from "@/components/ui/badge";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";

const TransactionsApiPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <Badge variant="secondary" className="mb-3">API Reference</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Transactions API</h1>
        <p className="text-muted-foreground mt-2">Query and filter transaction records across all payment methods.</p>
      </div>

      <ApiEndpoint method="GET" path="/v1/transactions" title="List Transactions" description="Retrieve a filtered list of transactions."
        params={[
          { name: "limit", type: "integer", required: false, desc: "Results per page (1-100)" },
          { name: "status", type: "string", required: false, desc: "succeeded, pending, failed, refunded" },
          { name: "currency", type: "string", required: false, desc: "Filter by currency" },
        ]}
        code={{
          curl: `curl "https://api.everpayinc.com/v1/transactions?status=succeeded&limit=25" \\\n  -H "Authorization: Bearer sk_test_your_key"`,
          node: `const txns = await everpay.transactions.list({ status: 'succeeded', limit: 25 });`,
          python: `txns = everpay.Transaction.list(status="succeeded", limit=25)`,
        }}
        response={`{\n  "object": "list",\n  "data": [\n    {\n      "id": "txn_abc123",\n      "type": "payment",\n      "amount": 5000,\n      "currency": "usd",\n      "status": "succeeded",\n      "created_at": "2026-03-09T12:00:00Z"\n    }\n  ],\n  "has_more": true,\n  "total_count": 1432\n}`}
      />

      <ApiEndpoint method="GET" path="/v1/transactions/:id" title="Retrieve a Transaction" description="Get full details of a specific transaction."
        params={[]}
        code={{
          curl: `curl https://api.everpayinc.com/v1/transactions/txn_abc123 \\\n  -H "Authorization: Bearer sk_test_your_key"`,
          node: `const txn = await everpay.transactions.retrieve('txn_abc123');`,
          python: `txn = everpay.Transaction.retrieve("txn_abc123")`,
        }}
        response={`{\n  "id": "txn_abc123",\n  "type": "payment",\n  "amount": 5000,\n  "net_amount": 4850,\n  "fee": 150,\n  "currency": "usd",\n  "status": "succeeded",\n  "processor": "shieldhub",\n  "created_at": "2026-03-09T12:00:00Z"\n}`}
      />
    </div>
  );
};

export default TransactionsApiPage;