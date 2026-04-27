import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { extSelect } from "@/hooks/useExternalData";
import { useAccessControl } from "@/hooks/useAccessControl";
import Unauthorized from "@/components/admin/Unauthorized";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function AdminDisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, isLoading } = useAccessControl();

  const dispute = useQuery({
    queryKey: ["admin-dispute", id],
    queryFn: async () => {
      const rows = await extSelect("disputes", { filters: { id } });
      return rows[0] || null;
    },
    enabled: !!id,
  });

  if (isLoading) return <AppLayout><div className="p-6">Loading...</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  const d = dispute.data as any;

  return (
    <AppLayout>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dispute</h1>
        <p className="mt-1 text-sm text-muted-foreground font-mono">{id}</p>
      </div>
      {dispute.isLoading ? (
        <div className="p-6">Loading dispute...</div>
      ) : !d ? (
        <div className="p-6 text-muted-foreground">Dispute not found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row k="Reason" v={d.reason || "—"} />
              <Row k="Status" v={<Badge variant={d.status === "won" ? "default" : d.status === "lost" ? "destructive" : "secondary"}>{d.status || "open"}</Badge>} />
              <Row k="Amount" v={`${Number(d.amount || 0).toFixed(2)} ${d.currency || ""}`} />
              <Row k="Customer" v={d.customer_email || "—"} />
              <Row k="Description" v={d.description || "—"} />
              <Row k="Evidence due" v={d.evidence_due_date ? new Date(d.evidence_due_date).toLocaleString() : "—"} />
              <Row k="Created" v={d.created_at ? new Date(d.created_at).toLocaleString() : "—"} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Chargeflow</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row k="ID" v={<span className="font-mono text-xs">{d.chargeflow_id || "—"}</span>} />
              <pre className="text-[10px] bg-muted/30 p-3 rounded-md overflow-auto max-h-[280px]">{d.chargeflow_payload ? JSON.stringify(d.chargeflow_payload, null, 2) : "No payload"}</pre>
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-2 last:border-0"><span className="text-muted-foreground">{k}</span><span className="text-right">{v}</span></div>;
}
