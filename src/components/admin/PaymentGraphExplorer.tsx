import { useState, useCallback, useMemo } from "react";
import { mockGraphNodes, mockGraphEdges, type GraphNode } from "@/data/payment-graph-mock";
import { Filter, ZoomIn, ZoomOut, Maximize, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const entityColors: Record<string, string> = {
  payment: "hsl(var(--primary))",
  processor: "hsl(262 83% 58%)",
  ledger: "hsl(217 91% 60%)",
  treasury: "hsl(217 91% 60%)",
  payout: "hsl(160 84% 39%)",
  refund: "hsl(0 84% 60%)",
  chargeback: "hsl(0 84% 60%)",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount / 100);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function NodeDetailPanel({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  return (
    <div className="absolute top-0 right-0 h-full w-[380px] border-l border-border bg-card overflow-y-auto shadow-lg animate-in slide-in-from-right duration-200 z-10">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Node Details</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="p-4 space-y-5">
        <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-mono font-medium text-primary">{node.event_type}</span>
        <div className="space-y-3">
          <Field label="Node ID" value={node.id} mono copy />
          <Field label="Payment ID" value={node.payment_id} mono copy />
          <Field label="Entity Type" value={node.entity_type} />
          <Field label="Entity ID" value={node.entity_id} mono copy />
          {node.amount && node.currency && <Field label="Amount" value={formatCurrency(node.amount, node.currency)} />}
          {node.status && <Field label="Status" value={node.status} />}
          <Field label="Timestamp" value={format(new Date(node.created_at), "PPpp")} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Raw Metadata</p>
          <pre className="rounded-md bg-muted p-3 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">{JSON.stringify(node.metadata, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono, copy }: { label: string; value: string; mono?: boolean; copy?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`text-xs text-foreground text-right ${mono ? "font-mono" : ""}`}>{value}</span>
        {copy && <CopyButton text={value} />}
      </div>
    </div>
  );
}

export default function PaymentGraphExplorer() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterPayment, setFilterPayment] = useState("all");

  const paymentIds = useMemo(() => [...new Set(mockGraphNodes.map(n => n.payment_id))], []);
  const filteredNodes = filterPayment === "all" ? mockGraphNodes : mockGraphNodes.filter(n => n.payment_id === filterPayment);
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = mockGraphEdges.filter(e => filteredNodeIds.has(e.from_node) && filteredNodeIds.has(e.to_node));

  // Simple SVG-based graph without D3 dependency
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const grouped: Record<string, GraphNode[]> = {};
    filteredNodes.forEach(n => {
      if (!grouped[n.payment_id]) grouped[n.payment_id] = [];
      grouped[n.payment_id].push(n);
    });
    let groupIdx = 0;
    Object.values(grouped).forEach(group => {
      group.forEach((node, i) => {
        positions[node.id] = {
          x: 120 + i * 140,
          y: 100 + groupIdx * 200,
        };
      });
      groupIdx++;
    });
    return positions;
  }, [filteredNodes]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Payment Graph Explorer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Trace money flow across the payment lifecycle</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="rounded-md border border-input bg-card px-3 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Payments</option>
            {paymentIds.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
        </div>
      </div>

      <div className="relative rounded-lg border border-border bg-card overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
        <svg className="w-full h-full" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arrowhead" viewBox="0 -5 10 10" refX="30" refY="0" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,-5L10,0L0,5" fill="hsl(var(--muted-foreground))" opacity="0.4" />
            </marker>
          </defs>
          {/* Edges */}
          {filteredEdges.map(edge => {
            const from = nodePositions[edge.from_node];
            const to = nodePositions[edge.to_node];
            if (!from || !to) return null;
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2 - 10;
            return (
              <g key={edge.id}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="hsl(var(--border))" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                <text x={midX} y={midY} fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle" fontFamily="monospace">{edge.relationship_type.replace(/_/g, " ")}</text>
              </g>
            );
          })}
          {/* Nodes */}
          {filteredNodes.map(node => {
            const pos = nodePositions[node.id];
            if (!pos) return null;
            const r = node.entity_type === "payment" ? 28 : 22;
            const iconMap: Record<string, string> = { payment: "₽", processor: "⚡", ledger: "📒", treasury: "🏦", payout: "↗", refund: "↩", chargeback: "⚠" };
            return (
              <g key={node.id} style={{ cursor: "pointer" }} onClick={() => setSelectedNode(node)}>
                <circle cx={pos.x} cy={pos.y} r={r} fill={entityColors[node.entity_type] || "#6B7280"} stroke="white" strokeWidth="2.5" opacity="0.9" />
                <text x={pos.x} y={pos.y} textAnchor="middle" dy="0.35em" fontSize="14">{iconMap[node.entity_type] || "•"}</text>
                <text x={pos.x} y={pos.y + r + 14} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))" fontFamily="monospace">{node.event_type.split(".").slice(-1)[0]}</text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute top-4 left-4 rounded-md border border-border bg-card/95 p-3 text-xs space-y-1.5">
          {Object.entries(entityColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground capitalize">{type}</span>
            </div>
          ))}
        </div>

        {selectedNode && <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />}
      </div>
    </div>
  );
}
