import { Badge } from "@/components/ui/badge";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";

const WalletsApiPage = () => (
  <div className="max-w-4xl mx-auto space-y-10">
    <div>
      <Badge variant="secondary" className="mb-3">API Reference</Badge>
      <h1 className="text-3xl font-bold tracking-tight">Wallets API</h1>
      <p className="text-muted-foreground mt-2">Manage digital wallets, balances, and transfers.</p>
    </div>
    <ApiEndpoint method="POST" path="/v2/wallets" title="Create a Wallet" description="Create a new digital wallet."
      params={[
        { name: "user_id", type: "string", required: true, desc: "Owner user or merchant ID" },
        { name: "currency", type: "string", required: true, desc: "Wallet currency" },
      ]}
      code={{
        curl: `curl -X POST https://api.everpayinc.com/v2/wallets \\\n  -H "Authorization: Bearer sk_test_your_key" \\\n  -d '{"user_id": "usr_abc123", "currency": "usd"}'`,
        node: `const wallet = await everpay.wallets.create({ user_id: 'usr_abc123', currency: 'usd' });`,
        python: `wallet = everpay.Wallet.create(user_id="usr_abc123", currency="usd")`,
      }}
      response={`{\n  "id": "wal_abc123",\n  "balance": 0,\n  "currency": "usd",\n  "status": "active"\n}`}
    />
    <ApiEndpoint method="POST" path="/v2/wallets/transfer" title="Transfer Between Wallets" description="Move funds between two wallets."
      params={[
        { name: "from_wallet_id", type: "string", required: true, desc: "Source wallet" },
        { name: "to_wallet_id", type: "string", required: true, desc: "Destination wallet" },
        { name: "amount", type: "integer", required: true, desc: "Amount to transfer" },
      ]}
      code={{
        curl: `curl -X POST https://api.everpayinc.com/v2/wallets/transfer \\\n  -H "Authorization: Bearer sk_test_your_key" \\\n  -d '{"from_wallet_id": "wal_abc", "to_wallet_id": "wal_def", "amount": 25000}'`,
        node: `const transfer = await everpay.wallets.transfer({ from_wallet_id: 'wal_abc', to_wallet_id: 'wal_def', amount: 25000 });`,
        python: `transfer = everpay.Wallet.transfer(from_wallet_id="wal_abc", to_wallet_id="wal_def", amount=25000)`,
      }}
      response={`{\n  "id": "trf_xyz789",\n  "amount": 25000,\n  "status": "completed"\n}`}
    />
  </div>
);

export default WalletsApiPage;