import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertTriangle, CircleDot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Event = {
  id: string;
  event_type: string;
  provider: string | null;
  payload: any;
  created_at: string;
};

const STATUS_MAP: Record<string, { label: string; tone: "ok" | "warn" | "err" | "muted" }> = {
  "payment.created":   { label: "Created",   tone: "muted" },
  "payout.created":    { label: "Initiated", tone: "muted" },
  "payment.confirmed": { label: "Confirmed", tone: "ok" },
  "payment.completed": { label: "Completed", tone: "ok" },
  "payout.completed":  { label: "Paid out",  tone: "ok" },
  "payment.expired":   { label: "Expired",   tone: "warn" },
  "payment.failed":    { label: "Failed",    tone: "err" },
  "payout.failed":     { label: "Failed",    tone: "err" },
};

function Icon({ tone }: { tone: string }) {
  if (tone === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (tone === "warn") return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  if (tone === "err") return <XCircle className="h-4 w-4 text-destructive" />;
  return <CircleDot className="h-4 w-4 text-muted-foreground" />;
}

export function PayoutTimeline({ payoutId, transactionId }: { payoutId?: string; transactionId?: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const refId = transactionId || payoutId;

  useEffect(() => {
    if (!refId) return;
    let mounted = true;
    const load = async () => {
      const { data } = await supabase
        .from("provider_events")
        .select("*")
        .eq("transaction_id", refId)
        .order("created_at", { ascending: true });
      if (mounted) { setEvents((data as any) || []); setLoading(false); }
    };
    load();
    const ch = supabase
      .channel(`payout-timeline-${refId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "provider_events", filter: `transaction_id=eq.${refId}` },
          (p) => setEvents((prev) => [...prev, p.new as Event]))
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [refId]);

  if (!refId) return <div className="text-xs text-muted-foreground">Select a payout to see its timeline.</div>;
  if (loading) return <div className="text-xs text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5 animate-pulse" />Loading timeline…</div>;
  if (events.length === 0) return <div className="text-xs text-muted-foreground">No provider events yet — waiting for webhook.</div>;

  return (
    <ol className="relative ml-2 border-l border-border space-y-4">
      {events.map((e) => {
        const map = STATUS_MAP[e.event_type] || { label: e.event_type, tone: "muted" };
        return (
          <li key={e.id} className="ml-4">
            <span className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-background border border-border" />
            <div className="flex items-center gap-2">
              <Icon tone={map.tone} />
              <span className="text-sm font-medium">{map.label}</span>
              {e.provider && <Badge variant="outline" className="text-[10px]">{e.provider}</Badge>}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })} · <span className="font-mono">{e.event_type}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}