import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/developer/CodeBlock";
import { ApiEndpoint } from "@/components/developer/ApiEndpoint";
import { ShieldAlert, Clock, Upload } from "lucide-react";

const DisputesApiPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <Badge variant="secondary" className="mb-3">API Reference</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Disputes API</h1>
        <p className="text-muted-foreground mt-2">Manage chargebacks and disputes programmatically. Submit evidence, track outcomes, and automate dispute responses with Everpay's dispute management system.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" /> Dispute Lifecycle</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['open', 'needs_response', 'under_review', 'won', 'lost'].map((status, i) => (
              <div key={status} className="border rounded-lg p-3 text-center space-y-1">
                <Badge variant="outline" className="text-[10px]">{i + 1}</Badge>
                <p className="font-medium text-foreground capitalize text-xs">{status.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
          <p>When a cardholder disputes a charge, their bank creates a chargeback. You have a limited window (typically 7–21 days) to submit evidence proving the charge was legitimate.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">The Dispute Object</CardTitle></CardHeader>
        <CardContent>
          <CodeBlock code={`{
  "id": "dsp_abc123",
  "object": "dispute",
  "amount": 5000,
  "currency": "usd",
  "status": "needs_response",
  "reason": "fraudulent",
  "payment_id": "pay_xyz789",
  "transaction_id": "txn_456",
  "customer_email": "customer@example.com",
  "evidence_due_date": "2026-04-10T00:00:00Z",
  "evidence": {
    "receipt": null,
    "shipping_documentation": null,
    "customer_communication": null
  },
  "outcome": null,
  "provider": "shieldhub",
  "metadata": {},
  "created_at": "2026-03-25T12:00:00Z",
  "updated_at": "2026-03-25T12:00:00Z"
}`} language="curl" />
        </CardContent>
      </Card>

      <ApiEndpoint
        method="GET"
        path="/v1/disputes"
        title="List Disputes"
        description="Retrieve a paginated list of disputes for the authenticated merchant."
        params={[
          { name: "limit", type: "integer", required: false, desc: "Number of results (1-100, default 10)" },
          { name: "offset", type: "integer", required: false, desc: "Pagination offset" },
          { name: "status", type: "string", required: false, desc: "Filter: open, needs_response, under_review, won, lost" },
          { name: "reason", type: "string", required: false, desc: "Filter: fraudulent, duplicate, product_not_received, etc." },
        ]}
        code={{
          curl: `curl https://api.everpayinc.com/v1/disputes?status=needs_response \\
  -H "Authorization: Bearer sk_test_your_key"`,
          node: `const disputes = await everpay.disputes.list({
  status: 'needs_response',
  limit: 20,
});`,
          python: `disputes = everpay.Dispute.list(
  status="needs_response",
  limit=20,
)`,
        }}
        response={`{
  "object": "list",
  "data": [...],
  "has_more": false,
  "total_count": 3
}`}
      />

      <ApiEndpoint
        method="GET"
        path="/v1/disputes/:id"
        title="Retrieve a Dispute"
        description="Retrieve the full details of a specific dispute including evidence status and deadlines."
        params={[
          { name: "id", type: "string", required: true, desc: "The dispute ID" },
        ]}
        code={{
          curl: `curl https://api.everpayinc.com/v1/disputes/dsp_abc123 \\
  -H "Authorization: Bearer sk_test_your_key"`,
          node: `const dispute = await everpay.disputes.retrieve('dsp_abc123');`,
          python: `dispute = everpay.Dispute.retrieve("dsp_abc123")`,
        }}
        response={`{
  "id": "dsp_abc123",
  "status": "needs_response",
  "amount": 5000,
  "currency": "usd",
  "reason": "fraudulent",
  "evidence_due_date": "2026-04-10T00:00:00Z",
  "payment_id": "pay_xyz789"
}`}
      />

      <ApiEndpoint
        method="POST"
        path="/v1/disputes/:id/evidence"
        title="Submit Evidence"
        description="Upload evidence to respond to a dispute. Accepts file uploads and text evidence. Evidence must be submitted before the evidence_due_date."
        params={[
          { name: "receipt", type: "file", required: false, desc: "Receipt or proof of purchase (PDF, PNG, JPG)" },
          { name: "shipping_documentation", type: "file", required: false, desc: "Shipping confirmation or tracking info" },
          { name: "customer_communication", type: "file", required: false, desc: "Email/chat logs with customer" },
          { name: "uncategorized_text", type: "string", required: false, desc: "Additional evidence or explanation" },
          { name: "refund_policy", type: "string", required: false, desc: "Your refund/return policy text or URL" },
          { name: "submit", type: "boolean", required: false, desc: "Set true to finalize submission. Cannot be undone." },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v1/disputes/dsp_abc123/evidence \\
  -H "Authorization: Bearer sk_test_your_key" \\
  -F "receipt=@receipt.pdf" \\
  -F "uncategorized_text=Customer received item on March 15" \\
  -F "submit=true"`,
          node: `const evidence = await everpay.disputes.submitEvidence('dsp_abc123', {
  uncategorized_text: 'Customer received item on March 15',
  submit: true,
});`,
          python: `evidence = everpay.Dispute.submit_evidence(
  "dsp_abc123",
  uncategorized_text="Customer received item on March 15",
  submit=True,
)`,
        }}
        response={`{
  "id": "dsp_abc123",
  "status": "under_review",
  "evidence": {
    "receipt": "file_abc123.pdf",
    "uncategorized_text": "Customer received item on March 15"
  },
  "evidence_submitted_at": "2026-03-25T14:30:00Z"
}`}
      />

      <ApiEndpoint
        method="POST"
        path="/v1/disputes/:id/accept"
        title="Accept a Dispute"
        description="Accept (concede) a dispute. The disputed amount will be deducted from your balance. This action cannot be undone."
        params={[
          { name: "id", type: "string", required: true, desc: "The dispute ID to accept" },
        ]}
        code={{
          curl: `curl -X POST https://api.everpayinc.com/v1/disputes/dsp_abc123/accept \\
  -H "Authorization: Bearer sk_test_your_key"`,
          node: `const result = await everpay.disputes.accept('dsp_abc123');`,
          python: `result = everpay.Dispute.accept("dsp_abc123")`,
        }}
        response={`{
  "id": "dsp_abc123",
  "status": "lost",
  "outcome": "accepted",
  "amount": 5000,
  "currency": "usd"
}`}
      />

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" /> Reason Codes</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden text-sm">
            {[
              ['fraudulent', 'Customer claims they did not authorize the charge'],
              ['duplicate', 'Customer was charged multiple times'],
              ['product_not_received', 'Customer claims product/service was not delivered'],
              ['product_unacceptable', 'Product was defective or not as described'],
              ['subscription_canceled', 'Customer claims they canceled a subscription'],
              ['unrecognized', 'Customer does not recognize the charge'],
              ['credit_not_processed', 'Customer claims a refund was not processed'],
              ['general', 'General dispute with no specific reason'],
            ].map(([code, desc], i) => (
              <div key={code} className={`flex items-start gap-4 px-4 py-3 ${i > 0 ? 'border-t' : ''}`}>
                <code className="text-xs font-mono font-semibold min-w-[180px] text-foreground">{code}</code>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> Webhooks</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          {[
            ['dispute.created', 'A new dispute has been opened against a payment'],
            ['dispute.updated', 'Dispute status or evidence has changed'],
            ['dispute.won', 'Dispute resolved in your favor — funds returned'],
            ['dispute.lost', 'Dispute resolved against you — funds deducted'],
            ['dispute.evidence_required', 'Evidence deadline approaching (3 days before due)'],
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

export default DisputesApiPage;
