import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBillingPeriods } from "@/hooks/useBillingPeriods";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { Receipt, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-600",
  closed: "bg-muted text-muted-foreground",
  invoiced: "bg-emerald-500/15 text-emerald-600",
};

export default function AdminBilling() {
  const { data: periods, isLoading, generateBilling } = useBillingPeriods();

  const handleGenerate = () => {
    generateBilling.mutate(undefined, {
      onSuccess: (data) => toast.success(`Generated ${data?.invoices_created || 0} invoice(s)`),
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Receipt className="h-6 w-6 text-primary" /> Billing Management</h1>
            <p className="text-muted-foreground text-sm">Monthly billing periods, fee aggregation, and invoice generation</p>
          </div>
          <Button onClick={handleGenerate} disabled={generateBilling.isPending}>
            {generateBilling.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
            Generate Invoices
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Billing Periods</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-muted-foreground text-sm">Loading…</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Total Fees</TableHead>
                    <TableHead>Platform Fees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(periods || []).map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{(p.merchants as any)?.name || p.merchant_id?.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">{format(new Date(p.period_start), "MMM d")} – {format(new Date(p.period_end), "MMM d, yyyy")}</TableCell>
                      <TableCell>{p.total_transactions}</TableCell>
                      <TableCell>{formatCurrency(p.total_volume)}</TableCell>
                      <TableCell>{formatCurrency(p.total_fees)}</TableCell>
                      <TableCell className="text-primary font-semibold">{formatCurrency(p.total_everpay_fees)}</TableCell>
                      <TableCell><Badge className={statusColors[p.status] || ""}>{p.status}</Badge></TableCell>
                      <TableCell>{p.invoice_id ? <span className="text-xs text-muted-foreground">{p.invoice_id.slice(0, 8)}…</span> : "—"}</TableCell>
                    </TableRow>
                  ))}
                  {(!periods || periods.length === 0) && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No billing periods yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
