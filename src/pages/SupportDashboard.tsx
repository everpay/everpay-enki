import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Headphones, AlertTriangle, Users, ArrowLeftRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";

export default function SupportDashboard() {
  const [search, setSearch] = useState("");

  const { data: recentTransactions } = useQuery({
    queryKey: ["support-transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const { data: openDisputes } = useQuery({
    queryKey: ["support-disputes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("disputes")
        .select("*")
        .in("status", ["open", "under_review"])
        .order("created_at", { ascending: false })
        .limit(30);
      return data || [];
    },
  });

  const { data: recentRefunds } = useQuery({
    queryKey: ["support-refunds"],
    queryFn: async () => {
      const { data } = await supabase
        .from("refunds")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      return data || [];
    },
  });

  const filteredTx = recentTransactions?.filter(
    (t) =>
      !search ||
      t.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.provider_ref?.toLowerCase().includes(search.toLowerCase())
  );

  const openDisputeCount = openDisputes?.length || 0;
  const pendingRefunds = recentRefunds?.filter((r) => r.status === "pending").length || 0;
  const failedTx = recentTransactions?.filter((t) => t.status === "failed").length || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Headphones className="h-6 w-6 text-primary" />
            Support Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            View-only operational dashboard for customer support
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Open Disputes</p>
                  <p className="text-2xl font-bold text-foreground">{openDisputeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <ArrowLeftRight className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending Refunds</p>
                  <p className="text-2xl font-bold text-foreground">{pendingRefunds}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Failed Transactions</p>
                  <p className="text-2xl font-bold text-foreground">{failedTx}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="refunds">Refunds</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, ID, or provider ref…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[500px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card border-b border-border">
                      <tr>
                        <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Email</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Amount</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Provider</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTx?.map((tx) => (
                        <tr key={tx.id} className="border-b border-border hover:bg-muted/30">
                          <td className="p-3 font-mono text-xs">
                            {format(new Date(tx.created_at), "MMM d, HH:mm")}
                          </td>
                          <td className="p-3">{tx.customer_email || "—"}</td>
                          <td className="p-3 font-medium">
                            {tx.currency} {Number(tx.amount).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                tx.status === "completed" ? "default" :
                                tx.status === "failed" ? "destructive" : "secondary"
                              }
                              className="text-xs"
                            >
                              {tx.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">{tx.provider}</td>
                        </tr>
                      ))}
                      {(!filteredTx || filteredTx.length === 0) && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-muted-foreground">
                            No transactions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disputes">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[500px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card border-b border-border">
                      <tr>
                        <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Customer</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Amount</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Reason</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openDisputes?.map((d) => (
                        <tr key={d.id} className="border-b border-border hover:bg-muted/30">
                          <td className="p-3 font-mono text-xs">
                            {format(new Date(d.created_at), "MMM d, HH:mm")}
                          </td>
                          <td className="p-3">{d.customer_email || "—"}</td>
                          <td className="p-3 font-medium">
                            {d.currency} {Number(d.amount).toLocaleString()}
                          </td>
                          <td className="p-3 text-muted-foreground">{d.reason || "—"}</td>
                          <td className="p-3">
                            <Badge variant="destructive" className="text-xs">{d.status}</Badge>
                          </td>
                        </tr>
                      ))}
                      {(!openDisputes || openDisputes.length === 0) && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-muted-foreground">
                            No open disputes
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refunds">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[500px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card border-b border-border">
                      <tr>
                        <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Amount</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Provider</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRefunds?.map((r) => (
                        <tr key={r.id} className="border-b border-border hover:bg-muted/30">
                          <td className="p-3 font-mono text-xs">
                            {format(new Date(r.created_at), "MMM d, HH:mm")}
                          </td>
                          <td className="p-3 font-medium">
                            {r.currency} {Number(r.amount).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={r.status === "completed" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {r.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">{r.provider || "—"}</td>
                          <td className="p-3 text-muted-foreground">{r.reason || "—"}</td>
                        </tr>
                      ))}
                      {(!recentRefunds || recentRefunds.length === 0) && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-muted-foreground">
                            No refunds found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
