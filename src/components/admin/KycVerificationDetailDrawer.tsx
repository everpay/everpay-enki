import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Clock, FileText, Shield, User, Activity, AlertTriangle, ExternalLink } from "lucide-react";

interface Verification {
  id?: string;
  merchant_id?: string;
  provider?: string;
  country?: string;
  verification_type?: string;
  type?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  applicant?: any;
  documents?: any[];
  checks?: any;
  decision?: any;
  risk_score?: number | null;
  reason?: string | null;
  raw?: any;
  [k: string]: any;
}

function statusBadge(status?: string) {
  const s = (status || "").toLowerCase();
  if (s === "approved" || s === "verified" || s === "completed") {
    return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3.5 w-3.5 mr-1" />{status}</Badge>;
  }
  if (s === "rejected" || s === "failed" || s === "declined") {
    return <Badge variant="destructive"><XCircle className="h-3.5 w-3.5 mr-1" />{status}</Badge>;
  }
  if (s === "in_progress" || s === "pending" || s === "review") {
    return <Badge variant="secondary"><Clock className="h-3.5 w-3.5 mr-1" />{status}</Badge>;
  }
  return <Badge variant="outline">{status || "unknown"}</Badge>;
}

function KV({ label, value }: { label: string; value?: any }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground text-right break-all">{value ?? "—"}</span>
    </div>
  );
}

export function KycVerificationDetailDrawer({
  verification,
  open,
  onOpenChange,
}: {
  verification: Verification | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  if (!verification) return null;
  const v = verification;
  const applicant = v.applicant || v.raw?.applicant || {};
  const documents: any[] = v.documents || v.raw?.documents || [];
  const checks = v.checks || v.raw?.checks || {};
  const decision = v.decision || v.raw?.decision || {};
  const risk = v.risk_score ?? v.raw?.risk_score ?? null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            <SheetHeader className="mb-4">
              <div className="flex items-center justify-between gap-2">
                <SheetTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Verification {v.id?.slice(0, 8)}
                </SheetTitle>
                {statusBadge(v.status)}
              </div>
              <SheetDescription className="flex flex-wrap items-center gap-2 text-xs">
                <span className="capitalize">{v.provider || "—"}</span>
                <span>·</span>
                <span>{v.country || "—"}</span>
                <span>·</span>
                <span>{v.verification_type || v.type || "—"}</span>
                {v.created_at && (<><span>·</span><span>{new Date(v.created_at).toLocaleString()}</span></>)}
              </SheetDescription>
            </SheetHeader>

            <Tabs defaultValue="overview">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="overview"><User className="h-3.5 w-3.5 mr-1" />Profile</TabsTrigger>
                <TabsTrigger value="documents"><FileText className="h-3.5 w-3.5 mr-1" />Docs</TabsTrigger>
                <TabsTrigger value="checks"><Shield className="h-3.5 w-3.5 mr-1" />Checks</TabsTrigger>
                <TabsTrigger value="decision"><AlertTriangle className="h-3.5 w-3.5 mr-1" />Decision</TabsTrigger>
                <TabsTrigger value="activity"><Activity className="h-3.5 w-3.5 mr-1" />Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Applicant</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <KV label="First name" value={applicant.first_name || applicant.firstName} />
                    <KV label="Last name" value={applicant.last_name || applicant.lastName} />
                    <KV label="Email" value={applicant.email} />
                    <KV label="Phone" value={applicant.phone} />
                    <KV label="DOB" value={applicant.dob || applicant.date_of_birth} />
                    <KV label="Country" value={applicant.country || v.country} />
                    <KV label="Address" value={applicant.address || applicant.full_address} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Merchant</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <KV label="Merchant ID" value={v.merchant_id} />
                    <KV label="Provider" value={v.provider} />
                    <KV label="Created" value={v.created_at && new Date(v.created_at).toLocaleString()} />
                    <KV label="Updated" value={v.updated_at && new Date(v.updated_at).toLocaleString()} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-4 space-y-3">
                {documents.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-md">
                    No documents on file.
                  </div>
                ) : documents.map((d: any, i: number) => (
                  <Card key={i}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{d.type || d.doc_type || "Document"}</p>
                          <p className="text-xs text-muted-foreground">{d.file_name || d.id}</p>
                        </div>
                        {statusBadge(d.status)}
                      </div>
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" /> Open document
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="checks" className="mt-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Verification checks</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    {Object.keys(checks).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No check results.</p>
                    ) : Object.entries(checks).map(([k, val]: [string, any]) => (
                      <KV key={k} label={k.replace(/_/g, " ")} value={typeof val === "object" ? JSON.stringify(val) : String(val)} />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="decision" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Decision</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <KV label="Outcome" value={decision.outcome || v.status} />
                    <KV label="Reason" value={decision.reason || v.reason} />
                    <KV label="Reviewed by" value={decision.reviewer || decision.by} />
                    <KV label="Reviewed at" value={decision.at && new Date(decision.at).toLocaleString()} />
                  </CardContent>
                </Card>
                {risk !== null && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Risk score</CardTitle></CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{risk}</span>
                        <span className="text-xs text-muted-foreground">/ 100</span>
                      </div>
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${Number(risk) > 70 ? "bg-destructive" : Number(risk) > 40 ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(100, Math.max(0, Number(risk)))}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Raw payload</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <pre className="text-[10px] font-mono bg-muted/40 p-3 rounded-md overflow-x-auto max-h-96">
{JSON.stringify(v, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            <Separator className="my-4" />
            <p className="text-[10px] text-muted-foreground text-center">
              KYCAID-style verification view · Provider data shown read-only
            </p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}