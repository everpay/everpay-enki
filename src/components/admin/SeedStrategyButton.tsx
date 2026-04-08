import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Database } from "lucide-react";

const from = (table: string) => supabase.from(table as any);

function mapProcessorTier(name: string): string {
  const tier1 = ["Stripe", "Adyen", "Global Payments", "Checkout.com"];
  const tier3 = ["ShieldHubPay", "PacoPay", "TSYS/Luqra", "Delos Financial", "Matrix"];
  if (tier1.includes(name)) return "1";
  if (tier3.includes(name)) return "3";
  return "2";
}

function mapRegion(region: string | null): string[] {
  if (!region) return ["GLOBAL"];
  const r = region.toLowerCase();
  if (r === "global") return ["GLOBAL"];
  if (r === "us" || r === "canada") return ["NA"];
  if (r === "eu") return ["EU"];
  if (r === "latam") return ["LATAM"];
  if (r === "africa") return ["AF"];
  return [region.toUpperCase()];
}

function generateApprovalRate(tier: string): number {
  if (tier === "1") return parseFloat((91 + Math.random() * 6).toFixed(1));
  if (tier === "2") return parseFloat((78 + Math.random() * 10).toFixed(1));
  return parseFloat((65 + Math.random() * 12).toFixed(1));
}

export function SeedStrategyButton() {
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const seed = async () => {
    setLoading(true);
    try {
      // Fetch from processor_fee_profiles since that's our existing table
      const { data: feeProfiles, error: fpErr } = await from("processor_fee_profiles").select("*");
      if (fpErr) throw fpErr;

      if (!feeProfiles || feeProfiles.length === 0) {
        toast.error("No processor fee profiles found in the database");
        setLoading(false);
        return;
      }

      // Map fee profiles → strategy processors
      const processors = feeProfiles.map((fp: any) => {
        const name = fp.provider || "Unknown";
        const id = name.toLowerCase().replace(/[\s/.]+/g, "").replace(/[^a-z0-9]/g, "");
        const tier = mapProcessorTier(name);
        return {
          id,
          name,
          tier,
          region: mapRegion(null),
          currencies: fp.currency ? [fp.currency] : ["USD"],
          approval_rate: generateApprovalRate(tier),
          active: true,
        };
      });

      // Deduplicate by ID
      const uniqueProcessors = Object.values(
        processors.reduce((acc: any, p: any) => {
          if (!acc[p.id]) {
            acc[p.id] = p;
          } else {
            // Merge currencies
            acc[p.id].currencies = [...new Set([...acc[p.id].currencies, ...p.currencies])];
          }
          return acc;
        }, {} as Record<string, any>)
      );

      // Build strategies (fallback chains by tier)
      const tier1 = (uniqueProcessors as any[]).filter((p: any) => p.tier === "1");
      const tier2 = (uniqueProcessors as any[]).filter((p: any) => p.tier === "2");
      const tier3 = (uniqueProcessors as any[]).filter((p: any) => p.tier === "3");

      const strategies: any[] = [];
      [tier1, tier2, tier3].forEach((tierGroup) => {
        tierGroup.forEach((p: any, i: number) => {
          strategies.push({
            processor_id: p.id,
            tier_level: p.tier,
            routing_priority: i + 1,
            fallback_processor_id: tierGroup[i + 1]?.id || null,
          });
        });
      });

      // Build markups
      const markups = (uniqueProcessors as any[]).map((p: any) => ({
        processor_id: p.id,
        merchant_id: null,
        markup_percentage: p.tier === "1" ? 0.8 : p.tier === "2" ? 1.2 : 1.5,
        markup_flat_fee: p.tier === "1" ? 0.05 : 0,
        active: true,
      }));

      // Generate routing logs
      const logs: any[] = [];
      const statuses = ["success", "declined", "error"];
      const responseCodes: Record<string, string[]> = {
        success: ["00"],
        declined: ["05", "14", "51", "54"],
        error: ["96", "91"],
      };
      for (let t = 1; t <= 12; t++) {
        const txnId = `txn-${String(t).padStart(3, "0")}`;
        const numAttempts = Math.random() > 0.4 ? 1 : Math.random() > 0.5 ? 2 : 3;
        for (let a = 1; a <= numAttempts; a++) {
          const isFinal = a === numAttempts;
          const status = isFinal ? (Math.random() > 0.15 ? "success" : "declined") : (Math.random() > 0.3 ? "declined" : "error");
          const pool = a === 1 ? tier1 : a === 2 ? tier2 : tier3;
          const proc = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : (uniqueProcessors as any[])[0];
          if (!proc) continue;
          const codes = responseCodes[status];
          logs.push({
            transaction_id: txnId,
            processor_id: proc.id,
            attempt_order: a,
            status,
            response_code: codes[Math.floor(Math.random() * codes.length)],
            response_time: status === "success" ? 200 + Math.floor(Math.random() * 600) : 500 + Math.floor(Math.random() * 4500),
          });
        }
      }

      // Clear and re-seed
      await from("routing_attempt_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await from("platform_fee_markups").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await from("processor_strategy").delete().neq("processor_id", "__none__");
      await from("processors").delete().neq("id", "__none__");

      const { error: e1 } = await from("processors").insert(uniqueProcessors);
      if (e1) throw e1;
      const { error: e2 } = await from("processor_strategy").insert(strategies);
      if (e2) throw e2;
      const { error: e3 } = await from("platform_fee_markups").insert(markups);
      if (e3) throw e3;
      const { error: e4 } = await from("routing_attempt_logs").insert(logs);
      if (e4) throw e4;

      qc.invalidateQueries();
      toast.success(`Seeded ${(uniqueProcessors as any[]).length} processors from fee profiles!`);
    } catch (e: any) {
      console.error("Seed error:", e);
      toast.error(e.message || "Failed to seed data");
    }
    setLoading(false);
  };

  return (
    <Button size="sm" onClick={seed} disabled={loading} variant="outline">
      <Database className="h-3.5 w-3.5 mr-1.5" />
      {loading ? "Syncing..." : "Sync from DB"}
    </Button>
  );
}
