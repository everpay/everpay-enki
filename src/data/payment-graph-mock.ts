export interface GraphNode {
  id: string;
  payment_id: string;
  event_type: string;
  entity_type: "payment" | "ledger" | "treasury" | "payout" | "refund" | "chargeback" | "processor";
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  amount?: number;
  currency?: string;
  status?: string;
}

export interface GraphEdge {
  id: string;
  from_node: string;
  to_node: string;
  relationship_type: string;
}

export interface RefundRecord {
  id: string;
  payment_id: string;
  merchant_id: string;
  merchant_name: string;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "processing" | "completed" | "cancelled" | "failed";
  reason: string;
  processor_reference: string;
  created_at: string;
  updated_at: string;
  processor: string;
  timeline: RefundEvent[];
}

export interface RefundEvent {
  id: string;
  event: string;
  timestamp: string;
  actor: string;
  details?: string;
}

const now = new Date();
const h = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();

export const mockGraphNodes: GraphNode[] = [
  { id: "n1", payment_id: "pay_4kX9mN2", event_type: "payment.created", entity_type: "payment", entity_id: "pay_4kX9mN2", metadata: { customer: "cus_8Jq2", method: "card" }, created_at: h(72), amount: 24999, currency: "USD", status: "created" },
  { id: "n2", payment_id: "pay_4kX9mN2", event_type: "payment.authorized", entity_type: "processor", entity_id: "proc_stripe_auth_1", metadata: { processor: "shieldhub", auth_code: "A12345" }, created_at: h(71.9), amount: 24999, currency: "USD", status: "authorized" },
  { id: "n3", payment_id: "pay_4kX9mN2", event_type: "payment.captured", entity_type: "payment", entity_id: "pay_4kX9mN2", metadata: { capture_id: "cap_99x" }, created_at: h(71), amount: 24999, currency: "USD", status: "captured" },
  { id: "n4", payment_id: "pay_4kX9mN2", event_type: "ledger.entry.created", entity_type: "ledger", entity_id: "led_a1b2", metadata: { debit: "customer_receivable", credit: "merchant_payable" }, created_at: h(70.5), amount: 24999, currency: "USD" },
  { id: "n5", payment_id: "pay_4kX9mN2", event_type: "payment.settled", entity_type: "treasury", entity_id: "tres_pool_1", metadata: { settlement_batch: "batch_2024_03" }, created_at: h(48), amount: 24999, currency: "USD", status: "settled" },
  { id: "n6", payment_id: "pay_4kX9mN2", event_type: "payout.created", entity_type: "payout", entity_id: "po_7mK3", metadata: { merchant: "merch_acme" }, created_at: h(24), amount: 24249, currency: "USD", status: "created" },
  { id: "n7", payment_id: "pay_4kX9mN2", event_type: "payout.completed", entity_type: "payout", entity_id: "po_7mK3", metadata: { bank_ref: "BNK_REF_001" }, created_at: h(12), amount: 24249, currency: "USD", status: "completed" },
  { id: "n8", payment_id: "pay_4kX9mN2", event_type: "payment.refunded", entity_type: "refund", entity_id: "ref_xY3z", metadata: { reason: "customer_request", partial: false }, created_at: h(6), amount: 24999, currency: "USD", status: "refunded" },
  { id: "n9", payment_id: "pay_8rT5vB7", event_type: "payment.created", entity_type: "payment", entity_id: "pay_8rT5vB7", metadata: { customer: "cus_3Kp9", method: "card" }, created_at: h(96), amount: 8500, currency: "EUR", status: "created" },
  { id: "n10", payment_id: "pay_8rT5vB7", event_type: "payment.authorized", entity_type: "processor", entity_id: "proc_adyen_auth_2", metadata: { processor: "shieldhub", auth_code: "B67890" }, created_at: h(95.9), amount: 8500, currency: "EUR", status: "authorized" },
  { id: "n11", payment_id: "pay_8rT5vB7", event_type: "payment.captured", entity_type: "payment", entity_id: "pay_8rT5vB7", metadata: {}, created_at: h(95), amount: 8500, currency: "EUR", status: "captured" },
  { id: "n12", payment_id: "pay_8rT5vB7", event_type: "chargeback.created", entity_type: "chargeback", entity_id: "cb_mN4q", metadata: { reason_code: "10.4", network: "visa" }, created_at: h(24), amount: 8500, currency: "EUR", status: "disputed" },
];

export const mockGraphEdges: GraphEdge[] = [
  { id: "e1", from_node: "n1", to_node: "n2", relationship_type: "authorized_by" },
  { id: "e2", from_node: "n2", to_node: "n3", relationship_type: "captured" },
  { id: "e3", from_node: "n3", to_node: "n4", relationship_type: "ledger_entry" },
  { id: "e4", from_node: "n4", to_node: "n5", relationship_type: "settled_to" },
  { id: "e5", from_node: "n5", to_node: "n6", relationship_type: "payout_created" },
  { id: "e6", from_node: "n6", to_node: "n7", relationship_type: "payout_completed" },
  { id: "e7", from_node: "n3", to_node: "n8", relationship_type: "refunded" },
  { id: "e8", from_node: "n9", to_node: "n10", relationship_type: "authorized_by" },
  { id: "e9", from_node: "n10", to_node: "n11", relationship_type: "captured" },
  { id: "e10", from_node: "n11", to_node: "n12", relationship_type: "chargeback" },
];

export const mockRefundRecords: RefundRecord[] = [
  {
    id: "ref_xY3z9K", payment_id: "pay_4kX9mN2", merchant_id: "merch_acme", merchant_name: "Acme Corp",
    amount: 24999, currency: "USD", status: "completed", reason: "Customer request - item not as described",
    processor_reference: "re_3Ns8xQ2pV7kL", created_at: h(6), updated_at: h(2), processor: "ShieldHub",
    timeline: [
      { id: "te1", event: "refund.initiated", timestamp: h(6), actor: "admin@everpay.io", details: "Refund initiated for full amount" },
      { id: "te2", event: "refund.approved", timestamp: h(5.5), actor: "finance@everpay.io" },
      { id: "te3", event: "refund.processing", timestamp: h(5), actor: "system", details: "Sent to processor" },
      { id: "te4", event: "refund.completed", timestamp: h(2), actor: "system", details: "Processor confirmed refund" },
    ],
  },
  {
    id: "ref_aB7w2M", payment_id: "pay_9pL3kR8", merchant_id: "merch_globex", merchant_name: "Globex Inc",
    amount: 15000, currency: "USD", status: "pending", reason: "Duplicate charge",
    processor_reference: "re_7Kp2mN5xQ3jR", created_at: h(3), updated_at: h(3), processor: "ShieldHub",
    timeline: [
      { id: "te5", event: "refund.initiated", timestamp: h(3), actor: "merchant_admin@globex.com", details: "Merchant initiated refund" },
    ],
  },
  {
    id: "ref_cD4e8P", payment_id: "pay_2mN7vX5", merchant_id: "merch_acme", merchant_name: "Acme Corp",
    amount: 4299, currency: "EUR", status: "approved", reason: "Service not rendered",
    processor_reference: "re_9Lm4pQ7xN2kR", created_at: h(12), updated_at: h(8), processor: "PacoPay",
    timeline: [
      { id: "te6", event: "refund.initiated", timestamp: h(12), actor: "support@everpay.io" },
      { id: "te7", event: "refund.approved", timestamp: h(8), actor: "finance@everpay.io", details: "Approved after review" },
    ],
  },
  {
    id: "ref_eF2g6R", payment_id: "pay_5kR9mB3", merchant_id: "merch_initech", merchant_name: "Initech LLC",
    amount: 67800, currency: "USD", status: "processing", reason: "Chargeback prevention - proactive refund",
    processor_reference: "re_2Np8kM3xQ7jL", created_at: h(24), updated_at: h(4), processor: "MakaPay",
    timeline: [
      { id: "te8", event: "refund.initiated", timestamp: h(24), actor: "system", details: "Auto-initiated from chargeback alert" },
      { id: "te9", event: "refund.approved", timestamp: h(20), actor: "finance@everpay.io" },
      { id: "te10", event: "refund.processing", timestamp: h(4), actor: "system" },
    ],
  },
  {
    id: "ref_gH9i3T", payment_id: "pay_7nQ4xK1", merchant_id: "merch_globex", merchant_name: "Globex Inc",
    amount: 2100, currency: "GBP", status: "cancelled", reason: "Customer withdrew request",
    processor_reference: "re_5Qp9nK2xM8jR", created_at: h(48), updated_at: h(36), processor: "Mondo",
    timeline: [
      { id: "te11", event: "refund.initiated", timestamp: h(48), actor: "support@everpay.io" },
      { id: "te12", event: "refund.cancelled", timestamp: h(36), actor: "support@everpay.io", details: "Customer withdrew refund request" },
    ],
  },
  {
    id: "ref_jK1l5V", payment_id: "pay_3bM8nP6", merchant_id: "merch_acme", merchant_name: "Acme Corp",
    amount: 9950, currency: "USD", status: "failed", reason: "Original payment already reversed",
    processor_reference: "re_8Rm3pL6xQ2kN", created_at: h(72), updated_at: h(70), processor: "ShieldHub",
    timeline: [
      { id: "te13", event: "refund.initiated", timestamp: h(72), actor: "admin@everpay.io" },
      { id: "te14", event: "refund.failed", timestamp: h(70), actor: "system", details: "Processor rejected: original payment already reversed" },
    ],
  },
];
