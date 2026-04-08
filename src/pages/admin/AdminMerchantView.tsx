import { AppLayout } from "@/components/AppLayout";
import { useStrategyProcessors, useStrategyFeeProfiles, useMarkups, useStrategyMerchants } from "@/hooks/useProcessorStrategy";
import { motion } from "framer-motion";
import { Store, Shield, TrendingUp, AlertTriangle, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function AdminMerchantView() {
  const { data: processors = [] } = useStrategyProcessors();
  const { data: feeProfiles = [] } = useStrategyFeeProfiles();
  const { data: markups = [] } = useMarkups();
  const { data: merchants = [] } = useStrategyMerchants();

  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMerchants = useMemo(() => {
    if (!searchQuery) return merchants;
    const q = searchQuery.toLowerCase();
    return merchants.filter((m: any) =>
      m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.id?.toLowerCase().includes(q)
    );
  }, [merchants, searchQuery]);

  const merchant = merchants.find((m: any) => m.id === selectedMerchantId);

  const merchantMarkup = merchant
    ? markups.find((m: any) => m.merchant_id === merchant.id) || markups.find((m: any) => !m.merchant_id && m.active)
    : null;
  const preferredProcessor = merchant
    ? processors.find((p: any) => p.id === (merchantMarkup?.processor_id)) || processors[0]
    : null;
  const fee = preferredProcessor
    ? feeProfiles.find((f: any) => f.provider === preferredProcessor.id)
    : null;
  const effectiveFee = Number(fee?.percentage_fee ?? 0) + Number(merchantMarkup?.markup_percentage ?? 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Merchant View</h1>
          <p className="text-sm text-muted-foreground mt-1">Select a merchant to view their fee dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Select Merchant</label>
            <Select value={selectedMerchantId ?? ""} onValueChange={(v) => setSelectedMerchantId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a merchant..." />
              </SelectTrigger>
              <SelectContent>
                {merchants.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2">
                      <Store className="h-3.5 w-3.5 text-muted-foreground" />
                      {m.name}
                      <span className="text-muted-foreground text-[10px] ml-1">{m.email || m.id.slice(0, 8)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Search Merchants</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>
        </div>

        {merchant ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                <Store className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{merchant.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {merchant.region || "GLOBAL"} · {merchant.currency || "USD"}
                  {merchant.email && <span className="ml-2">· {merchant.email}</span>}
                </p>
              </div>
              <div className="ml-auto">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${(merchant.status || "active") === "active" ? "bg-green-500/10 text-green-600" : (merchant.status || "active") === "review" ? "bg-yellow-500/10 text-yellow-600" : "bg-destructive/10 text-destructive"}`}>
                  {merchant.status || "active"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: TrendingUp, value: `${effectiveFee.toFixed(1)}%`, label: "Effective Processing Fee" },
                { icon: Shield, value: `${fee?.settlement_days ?? 0}d`, label: "Settlement Cycle" },
                { icon: Store, value: preferredProcessor?.name ?? "—", label: "Primary Processor" },
                { icon: AlertTriangle, value: merchant.risk_score ?? 0, label: "Risk Score" },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-lg border bg-card p-4">
                  <stat.icon className="h-4 w-4 text-muted-foreground mb-3" />
                  <p className="text-2xl font-bold font-mono text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {fee && (
              <div className="rounded-lg border bg-card p-5">
                <h3 className="text-sm font-semibold mb-4 text-foreground">Fee Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: "Processing Fee", value: `${Number(fee.percentage_fee)}%` },
                    { label: "Fixed Fee", value: `$${Number(fee.fixed_fee)}` },
                    { label: "Platform Fee (Everpay)", value: `${Number(merchantMarkup?.markup_percentage ?? 0)}%`, highlight: true },
                    { label: "Chargeback Fee", value: `$${Number(fee.chargeback_fee)}` },
                    { label: "Settlement", value: `${fee.settlement_days} days` },
                  ].map((item: any) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className={`text-sm font-mono font-medium ${item.highlight ? "text-primary" : "text-foreground"}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="rounded-lg border border-dashed bg-card p-12 text-center">
            <Store className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Select a merchant from the dropdown above.</p>
          </div>
        )}

        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 text-foreground">All Merchants ({filteredMerchants.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 font-medium">Merchant</th>
                  <th className="text-left py-2 font-medium">Region</th>
                  <th className="text-right py-2 font-medium">Risk Score</th>
                  <th className="text-left py-2 font-medium">Routing Tier</th>
                  <th className="text-left py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMerchants.map((m: any) => (
                  <tr key={m.id} className={`border-b border-border/50 cursor-pointer hover:bg-muted/50 ${selectedMerchantId === m.id ? "bg-accent/50" : ""}`} onClick={() => setSelectedMerchantId(m.id)}>
                    <td className="py-2.5 font-medium text-foreground">{m.name}</td>
                    <td className="py-2.5 text-foreground">{m.region || "GLOBAL"}</td>
                    <td className="text-right py-2.5 font-mono text-foreground">{m.risk_score ?? 0}</td>
                    <td className="py-2.5">
                      {(m.risk_score ?? 0) > 70 ? (
                        <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-destructive/10 text-destructive">Tier 3</span>
                      ) : (m.risk_score ?? 0) < 50 ? (
                        <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary">Tier 1</span>
                      ) : (
                        <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-yellow-500/10 text-yellow-600">Tier 2</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${(m.status || "active") === "active" ? "bg-green-500/10 text-green-600" : (m.status || "active") === "review" ? "bg-yellow-500/10 text-yellow-600" : "bg-destructive/10 text-destructive"}`}>{m.status || "active"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
