import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart3, FileText, TrendingUp, Users, Scale, Landmark, ShieldCheck, AlertTriangle } from "lucide-react";

export default function AdminReports() {
  const navigate = useNavigate();
  const cards = [
    { title: "Transaction Analytics", description: "Volume, methods, success rates.", icon: BarChart3, link: "/enki/analytics" },
    { title: "Merchant Performance", description: "Per-merchant revenue, fees, chargebacks.", icon: Users, link: "/enki/merchants" },
    { title: "Settlement Reports", description: "Batch breakdowns and fee analysis.", icon: Landmark, link: "/enki/treasury-360" },
    { title: "Reconciliation", description: "Variance analysis and matching.", icon: Scale, link: "/enki/reconciliation" },
    { title: "Processor Analytics", description: "Auth rate, latency, decline reasons.", icon: TrendingUp, link: "/enki/strategy" },
    { title: "Routing Decisions", description: "Audit log of routing engine selections.", icon: TrendingUp, link: "/enki/routing-decisions" },
    { title: "Refund Activity", description: "All refund history across merchants.", icon: FileText, link: "/enki/refund-management" },
    { title: "Disputes", description: "Chargeback resolution & evidence scoring.", icon: AlertTriangle, link: "/enki/transaction-monitoring" },
    { title: "Regulatory Export", description: "Compliance exports — PSD2, FINTRAC, UIF/COAF.", icon: ShieldCheck, link: "/enki/regulatory" },
    { title: "Audit Trail", description: "Platform-wide activity logs.", icon: FileText, link: "/enki/audit-trail" },
  ];
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Operational and regulatory reports across the platform</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((c) => (
          <Card key={c.title} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate(c.link)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><c.icon className="h-5 w-5 text-primary" /></div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{c.title}</CardTitle>
                  <CardDescription>{c.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="rounded-full">Open →</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}