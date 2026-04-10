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

    const body = await req.json().catch(() => ({}));
    const merchantFilter = body.merchant_id;

    // Find open billing periods
    let query = supabase.from("billing_periods").select("*").eq("status", "open");
    if (merchantFilter) query = query.eq("merchant_id", merchantFilter);

    const { data: periods, error: pErr } = await query;
    if (pErr) throw pErr;
    if (!periods || periods.length === 0) {
      return new Response(JSON.stringify({ message: "No open billing periods", invoices_created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const period of periods) {
      // Aggregate fee breakdowns for this period
      const { data: fees } = await supabase
        .from("fee_breakdowns")
        .select("*")
        .eq("merchant_id", period.merchant_id)
        .gte("created_at", period.period_start)
        .lte("created_at", period.period_end);

      const agg = (fees || []).reduce(
        (acc, f) => ({
          count: acc.count + 1,
          volume: acc.volume + Number(f.transaction_amount),
          totalFees: acc.totalFees + Number(f.total_fee),
          processorFees: acc.processorFees + Number(f.processor_fee),
          sponsorFees: acc.sponsorFees + Number(f.sponsor_fee),
          everpayFees: acc.everpayFees + Number(f.everpay_fee),
        }),
        { count: 0, volume: 0, totalFees: 0, processorFees: 0, sponsorFees: 0, everpayFees: 0 }
      );

      // Create invoice
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const items = [
        { description: "Processing fees", amount: Number(agg.processorFees.toFixed(2)), quantity: 1 },
        { description: "Platform fees", amount: Number(agg.everpayFees.toFixed(2)), quantity: 1 },
      ];
      if (agg.sponsorFees > 0) {
        items.push({ description: "Sponsor fees", amount: Number(agg.sponsorFees.toFixed(2)), quantity: 1 });
      }

      const { data: invoice, error: invErr } = await supabase
        .from("invoices")
        .insert({
          merchant_id: period.merchant_id,
          amount: Number(agg.totalFees.toFixed(2)),
          currency: "USD",
          status: "issued",
          items,
          due_date: dueDate.toISOString().split("T")[0],
        })
        .select("id")
        .single();

      if (invErr) {
        console.error("Invoice creation error:", invErr);
        continue;
      }

      // Update billing period
      await supabase
        .from("billing_periods")
        .update({
          status: "invoiced",
          invoice_id: invoice.id,
          total_transactions: agg.count,
          total_volume: Number(agg.volume.toFixed(2)),
          total_fees: Number(agg.totalFees.toFixed(2)),
          total_processor_fees: Number(agg.processorFees.toFixed(2)),
          total_sponsor_fees: Number(agg.sponsorFees.toFixed(2)),
          total_everpay_fees: Number(agg.everpayFees.toFixed(2)),
        })
        .eq("id", period.id);

      // Enqueue invoice email
      try {
        await supabase.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            template: "invoice-created",
            merchant_id: period.merchant_id,
            invoice_id: invoice.id,
            amount: agg.totalFees.toFixed(2),
          },
        });
      } catch (_) { /* email optional */ }

      results.push({ merchant_id: period.merchant_id, invoice_id: invoice.id, total_fees: agg.totalFees });
    }

    return new Response(JSON.stringify({ invoices_created: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-billing error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
