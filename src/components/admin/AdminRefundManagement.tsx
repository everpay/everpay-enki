import { useState } from "react";
import { mockRefundRecords, type RefundRecord } from "@/data/payment-graph-mock";
import { format } from "date-fns";
import { Copy, Check, Eye, CheckCircle, XCircle, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount / 100);
}

function statusColor(status: string) {
  switch (status) {
    case "completed": return "bg-emerald-500/10 text-emerald-600";
    case "approved": return "bg-blue-500/10 text-blue-600";
    case "pending": return "bg-amber-500/10 text-amber-600";
    case "processing": return "bg-sky-500/10 text-sky-600";
    case "cancelled": return "bg-muted text-muted-foreground";
    case "failed": return "bg-destructive/10 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
}

function IdCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs text-foreground">{value}</span>
      <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="text-muted-foreground hover:text-foreground transition-colors">
        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

function RefundDetailDrawer({ refund, onClose }: { refund: RefundRecord; onClose: () => void }) {
  const emitRefundEvent = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.functions.invoke("event-dispatch", {
        body: {
          event_type: "payment.refunded",
          source_service: "refund-management",
          payload: {
            refund_id: refund.id,
            payment_id: refund.payment_id,
            amount: refund.amount,
            currency: refund.currency,
            reason: refund.reason,
          },
        },
      });
      toast.success("payment.refunded event emitted");
    } catch {
      toast.error("Failed to emit event");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/20" onClick={onClose} />
      <div className="w-[440px] bg-card border-l border-border overflow-y-auto animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Refund Details</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-5 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-foreground">{refund.id}</span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(refund.status)}`}>{refund.status}</span>
            </div>
            <p className="text-3xl font-semibold text-foreground">{formatCurrency(refund.amount, refund.currency)}</p>
          </div>

          <div className="space-y-2.5 text-sm">
            <Row label="Payment ID" value={refund.payment_id} mono />
            <Row label="Merchant" value={refund.merchant_name} />
            <Row label="Processor" value={refund.processor} />
            <Row label="Processor Ref" value={refund.processor_reference} mono />
            <Row label="Reason" value={refund.reason} />
          </div>

          {/* Chargeback Correlation Panel */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Related Disputes</p>
            <div className="rounded-md border border-border bg-muted/50 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Chargeback cb_mN4q</span>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-destructive/10 text-destructive text-[10px] font-medium">disputed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reason: 10.4 - Other Fraud</span>
                <span className="text-muted-foreground">Visa</span>
              </div>
              <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                This refund may be related to the above dispute. Consider submitting evidence if not already resolved.
              </p>
            </div>
          </div>

          {/* Ledger reversal */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Ledger Reversal Preview</p>
            <div className="rounded-md border border-border bg-muted/50 p-3 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Debit: merchant_payable</span>
                <span className="text-destructive">-{formatCurrency(refund.amount, refund.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credit: customer_receivable</span>
                <span className="text-emerald-600">+{formatCurrency(refund.amount, refund.currency)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">Timeline</p>
            <div className="space-y-0">
              {refund.timeline.map((event, i) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                    {i < refund.timeline.length - 1 && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-xs font-medium text-foreground font-mono">{event.event}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(event.timestamp), "PPpp")}</p>
                    <p className="text-xs text-muted-foreground">{event.actor}</p>
                    {event.details && <p className="text-xs text-muted-foreground mt-0.5">{event.details}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button size="sm" variant="outline" onClick={emitRefundEvent} className="flex-1">
              Emit Refund Event
            </Button>
            {refund.status === "pending" && <Button size="sm" className="flex-1">Approve</Button>}
            {refund.status === "approved" && <Button size="sm" className="flex-1">Process</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-xs text-foreground text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

const processors = ["All", "ShieldHub", "PacoPay", "MakaPay", "Mondo"];
const statuses = ["All", "pending", "approved", "processing", "completed", "cancelled", "failed"];

export default function AdminRefundManagement() {
  const [filterProcessor, setFilterProcessor] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedRefund, setSelectedRefund] = useState<RefundRecord | null>(null);

  const filtered = mockRefundRecords.filter(r => {
    if (filterProcessor !== "All" && r.processor !== filterProcessor) return false;
    if (filterStatus !== "All" && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Refund Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Review, approve, and process refunds across all merchants</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <SummaryCard label="Total Refunds" value={mockRefundRecords.length.toString()} />
        <SummaryCard label="Pending Approval" value={mockRefundRecords.filter(r => r.status === "pending").length.toString()} accent="warning" />
        <SummaryCard label="Processing" value={mockRefundRecords.filter(r => r.status === "processing").length.toString()} accent="info" />
        <SummaryCard label="Total Volume" value={formatCurrency(mockRefundRecords.reduce((s, r) => s + r.amount, 0), "USD")} />
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
        <FilterSelect label="Processor" value={filterProcessor} options={processors} onChange={setFilterProcessor} />
        <FilterSelect label="Status" value={filterStatus} options={statuses} onChange={setFilterStatus} />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Refund ID</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Payment</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Merchant</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Amount</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Processor</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Created</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(refund => (
                <tr key={refund.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3"><IdCell value={refund.id} /></td>
                  <td className="px-4 py-3"><IdCell value={refund.payment_id} /></td>
                  <td className="px-4 py-3 text-foreground">{refund.merchant_name}</td>
                  <td className="px-4 py-3 font-mono text-foreground">{formatCurrency(refund.amount, refund.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor(refund.status)}`}>{refund.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{refund.processor}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(refund.created_at), "MMM d, HH:mm")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedRefund(refund)}><Eye className="h-3.5 w-3.5" /></Button>
                      {refund.status === "pending" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-600"><CheckCircle className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><XCircle className="h-3.5 w-3.5" /></Button>
                        </>
                      )}
                      {refund.status === "approved" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:text-blue-600"><Play className="h-3.5 w-3.5" /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRefund && <RefundDetailDrawer refund={selectedRefund} onClose={() => setSelectedRefund(null)} />}
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${accent === "warning" ? "text-amber-600" : accent === "info" ? "text-blue-600" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
