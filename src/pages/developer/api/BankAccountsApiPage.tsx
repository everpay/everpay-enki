import { Badge } from "@/components/ui/badge";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";

const BankAccountsApiPage = () => (
  <div className="max-w-4xl mx-auto space-y-10">
    <div>
      <Badge variant="secondary" className="mb-3">API Reference</Badge>
      <h1 className="text-3xl font-bold tracking-tight">Bank Accounts API</h1>
      <p className="text-muted-foreground mt-2">Link, verify, and manage bank accounts for payouts.</p>
    </div>
    <ApiEndpoint method="POST" path="/v2/bank_accounts" title="Create a Bank Account" description="Link a new bank account."
      params={[
        { name: "account_holder_name", type: "string", required: true, desc: "Name on the account" },
        { name: "account_number", type: "string", required: true, desc: "Bank account number" },
        { name: "routing_number", type: "string", required: true, desc: "Bank routing number" },
        { name: "country", type: "string", required: true, desc: "Country code" },
        { name: "currency", type: "string", required: true, desc: "Account currency" },
      ]}
      code={{
        curl: `curl -X POST https://api.everpayinc.com/v2/bank_accounts \\\n  -H "Authorization: Bearer sk_test_your_key" \\\n  -d '{"account_holder_name": "Acme Corp", "account_number": "000123456789", "routing_number": "021000021", "country": "US", "currency": "usd"}'`,
        node: `const ba = await everpay.bankAccounts.create({ account_holder_name: 'Acme Corp', account_number: '000123456789', routing_number: '021000021', country: 'US', currency: 'usd' });`,
        python: `ba = everpay.BankAccount.create(account_holder_name="Acme Corp", account_number="000123456789", routing_number="021000021", country="US", currency="usd")`,
      }}
      response={`{\n  "id": "ba_abc123",\n  "bank_name": "Chase",\n  "last4": "6789",\n  "status": "new"\n}`}
    />
    <ApiEndpoint method="POST" path="/v2/bank_accounts/:id/verify" title="Verify a Bank Account" description="Verify via micro-deposits or instant verification."
      params={[
        { name: "method", type: "string", required: true, desc: "micro_deposits or instant" },
        { name: "amounts", type: "array", required: false, desc: "Two micro-deposit amounts in cents" },
      ]}
      code={{
        curl: `curl -X POST https://api.everpayinc.com/v2/bank_accounts/ba_abc123/verify \\\n  -H "Authorization: Bearer sk_test_your_key" \\\n  -d '{"method": "micro_deposits", "amounts": [32, 45]}'`,
        node: `const verified = await everpay.bankAccounts.verify('ba_abc123', { method: 'micro_deposits', amounts: [32, 45] });`,
        python: `verified = everpay.BankAccount.verify("ba_abc123", method="micro_deposits", amounts=[32, 45])`,
      }}
      response={`{\n  "id": "ba_abc123",\n  "status": "verified"\n}`}
    />
  </div>
);

export default BankAccountsApiPage;