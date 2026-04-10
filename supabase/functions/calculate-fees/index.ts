import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { transaction_id, merchant_id, amount, currency } = await req.json();
    if (!transaction_id || !merchant_id || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get merchant pricing
    const { data: pricing } = await supabase
      .from("merchant_pricing")
      .select("*")
      .eq("merchant_id", merchant_id)
      .eq("currency", currency || "USD")
      .eq("active", true)
      .maybeSingle();

    // Fallback defaults
    const pricingModel = pricing?.model_type || "percentage";
    const pctFee = pricing?.percentage_fee ?? 2.9;
    const fixedFee = pricing?.fixed_fee ?? 0.30;
    const sponsorPct = pricing?.sponsor_fee_pct ?? 0;
    const tiers = pricing?.tiers as Array<{ min: number; max: number; percentage: number; fixed: number }> | null;

    let everpayFee = 0;

    if (pricingModel === "tiered" && tiers && tiers.length > 0) {
      // Get monthly volume for tier lookup
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("merchant_id", merchant_id)
        .gte("created_at", monthStart);

      const volume = count || 0;
      const tier = tiers.find(t => volume >= t.min && volume <= t.max) || tiers[tiers.length - 1];
      everpayFee = (amount * (tier.percentage / 100)) + tier.fixed;
    } else if (pricingModel === "fixed") {
      everpayFee = fixedFee;
    } else {
      // percentage or blended
      everpayFee = (amount * (pctFee / 100)) + fixedFee;
    }

    // 2. Get processor fee from processor_fee_profiles
    let processorFee = 0;
    const { data: procProfile } = await supabase
      .from("processor_fee_profiles")
      .select("*")
      .eq("merchant_id", merchant_id)
      .maybeSingle();

    if (procProfile) {
      processorFee = (amount * ((procProfile.percentage_fee || 0) / 100)) + (procProfile.fixed_fee || 0);
    }

    // 3. Calculate sponsor fee
    const sponsorFee = amount * (sponsorPct / 100);

    const totalFee = Number((processorFee + sponsorFee + everpayFee).toFixed(2));
    const netAmount = Number((amount - totalFee).toFixed(2));

    // 4. Insert fee breakdown
    const { error: insertError } = await supabase
      .from("fee_breakdowns")
      .insert({
        transaction_id,
        merchant_id,
        transaction_amount: amount,
        processor_fee: Number(processorFee.toFixed(2)),
        sponsor_fee: Number(sponsorFee.toFixed(2)),
        everpay_fee: Number(everpayFee.toFixed(2)),
        total_fee: totalFee,
        net_amount: netAmount,
        pricing_model: pricingModel,
        pricing_snapshot: pricing || { default: true, percentage_fee: pctFee, fixed_fee: fixedFee },
      });

    if (insertError) throw insertError;

    // 5. Create ledger entries
    await supabase.from("ledger_entries").insert([
      {
        merchant_id,
        type: "debit",
        amount: totalFee,
        currency: currency || "USD",
        description: `Platform fees for txn ${transaction_id}`,
        reference_id: transaction_id,
        reference_type: "fee_breakdown",
      },
      {
        merchant_id,
        type: "credit",
        amount: totalFee,
        currency: currency || "USD",
        description: `Fee revenue from txn ${transaction_id}`,
        reference_id: transaction_id,
        reference_type: "platform_revenue",
      },
    ]);

    return new Response(JSON.stringify({
      transaction_id,
      processor_fee: Number(processorFee.toFixed(2)),
      sponsor_fee: Number(sponsorFee.toFixed(2)),
      everpay_fee: Number(everpayFee.toFixed(2)),
      total_fee: totalFee,
      net_amount: netAmount,
      pricing_model: pricingModel,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("calculate-fees error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
