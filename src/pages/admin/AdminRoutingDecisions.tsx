import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { extSelect } from "@/hooks/useExternalData";
import { formatRelativeTime } from "@/lib/format";
import { ArrowRight, Search, Activity, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv";

interface DecisionRow {
  id: string;
  transaction_id: string | null;
  merchant_id: string | null;
  selected_provider: string;
  fallback_chain: string[];
  decision_reason: string;
  rule_matched_id: string | null;
  inputs: Record<string, any>;
  created_at: string;
}

interface PSPEventRow {
  id: string;
  provider: string;
  event_type: string;
  payload: any;
  transaction_id: string | null;
  created_at: string;
}

export default function AdminRoutingDecisions() {
  const [decisions, setDecisions] = useState<DecisionRow[]>([]);
  const [pspEvents, setPspEvents] = useState<PSPEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [d, e] = await Promise.all([
          extSelect("routing_decisions", { order: { column: "created_at", ascending: false }, limit: 500 }),
          extSelect("provider_events", {
            select: "id, provider, event_type, payload, transaction_id, created_at",
            order: { column: "created_at", ascending: false },
            limit: 200,
          }),
        ]);
        if (!active) return;
        setDecisions((d as DecisionRow[]) || []);
        setPspEvents((e as PSPEventRow[]) || []);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filtered = decisions.filter((d) => {
    if (providerFilter !== "all" && d.selected_provider !== providerFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        d.transaction_id?.toLowerCase().includes(s) ||
        d.decision_reason?.toLowerCase().includes(s) ||
        d.selected_provider?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const reasonVariant = (reason: string) => {
    if (reason?.startsWith("merchant_rule")) return "default" as const;
    if (reason?.startsWith("ofac")) return "destructive" as const;
    return "secondary" as const;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Routing Decisions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Audit log of every processor selection plus live provider request/response history.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle>Decisions ({decisions.length})</CardTitle>
                <CardDescription>Server-side routing chosen at payment time. Persisted for compliance & audit.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCsv(
                  `routing-decisions-${new Date().toISOString().slice(0,10)}.csv`,
                  ["Created At", "Decision ID", "Transaction ID", "Merchant ID", "Selected Provider", "Fallback Chain", "Reason", "Rule ID", "Currency", "Amount", "Country", "EU/EEA", "OFAC", "Inputs JSON"],
                  filtered.map((d) => [
                    d.created_at, d.id, d.transaction_id ?? "", d.merchant_id ?? "",
                    d.selected_provider, (d.fallback_chain || []).join(" → "),
                    d.decision_reason, d.rule_matched_id ?? "",
                    d.inputs?.currency ?? "", d.inputs?.amount ?? "", d.inputs?.country ?? "",
                    d.inputs?.eu_eea ? "yes" : "no", d.inputs?.ofac ? "yes" : "no",
                    d.inputs ?? {},
                  ])
                )}
              >
                <Download className="mr-2 h-4 w-4" />Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search transaction id, provider, reason…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All providers</SelectItem>
                  <SelectItem value="shieldhub">ShieldHub</SelectItem>
                  <SelectItem value="mondo">Mondo</SelectItem>
                  <SelectItem value="matrix">Matrix</SelectItem>
                  <SelectItem value="paygate10">PayGate10</SelectItem>
                  <SelectItem value="makapay">MakaPay</SelectItem>
                  <SelectItem value="pacopay">PacoPay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Selected</TableHead>
                    <TableHead>Fallback chain</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Inputs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No routing decisions match the filter.</TableCell></TableRow>
                  ) : filtered.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-xs text-muted-foreground">{formatRelativeTime(d.created_at)}</TableCell>
                      <TableCell className="font-mono text-xs">{d.transaction_id?.slice(0, 8) ?? "—"}…</TableCell>
                      <TableCell><Badge>{d.selected_provider}</Badge></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          {(d.fallback_chain || []).map((p, i) => (
                            <span key={i} className="inline-flex items-center gap-1">
                              {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                              <Badge variant="outline" className="font-mono text-[10px]">{p}</Badge>
                            </span>
                          ))}
                          {(!d.fallback_chain || d.fallback_chain.length === 0) && (
                            <span className="text-xs text-muted-foreground">— blocked —</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={reasonVariant(d.decision_reason)} className="font-mono text-[10px]">{d.decision_reason}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono max-w-[260px] truncate">
                        {`${d.inputs?.currency ?? "—"} · ${Number(d.inputs?.amount ?? 0).toFixed(2)} · ${d.inputs?.country || "??"}${d.inputs?.eu_eea ? " · EU" : ""}${d.inputs?.ofac ? " · OFAC" : ""}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Provider request / response history</CardTitle>
            <CardDescription>Recent inbound webhook events and outbound submissions across PSPs.</CardDescription>
          </CardHeader>
          <CardContent>
            {pspEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No provider events yet.</p>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {pspEvents.map((ev) => (
                  <div key={ev.id} className="rounded-md border bg-background p-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="outline" className="font-mono text-[10px]">{ev.provider}</Badge>
                      <Badge variant="secondary" className="font-mono text-[10px]">{ev.event_type}</Badge>
                      {ev.transaction_id && <span className="font-mono text-muted-foreground">tx: {ev.transaction_id.slice(0, 8)}…</span>}
                      <span className="ml-auto text-muted-foreground">{formatRelativeTime(ev.created_at)}</span>
                    </div>
                    <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted/50 p-2 text-[10px] font-mono leading-tight">{JSON.stringify(ev.payload, null, 2)}</pre>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}