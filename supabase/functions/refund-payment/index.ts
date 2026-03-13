import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claims.claims.sub;

    const { transaction_id, amount, reason } = await req.json();

    if (!transaction_id || !amount) {
      return new Response(JSON.stringify({ error: "transaction_id and amount required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get merchant
    const { data: merchant } = await supabaseAdmin
      .from("merchants")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!merchant) {
      return new Response(JSON.stringify({ error: "Merchant not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get transaction
    const { data: transaction } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("id", transaction_id)
      .eq("merchant_id", merchant.id)
      .single();

    if (!transaction) {
      return new Response(JSON.stringify({ error: "Transaction not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (amount > transaction.amount) {
      return new Response(JSON.stringify({ error: "Refund amount exceeds transaction amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create refund record
    const { data: refund, error: refundError } = await supabaseAdmin
      .from("refunds")
      .insert({
        transaction_id,
        merchant_id: merchant.id,
        amount,
        currency: transaction.currency,
        reason,
        provider: transaction.provider,
        status: "pending",
      })
      .select()
      .single();

    if (refundError) throw refundError;

    // Update transaction status
    if (amount === transaction.amount) {
      await supabaseAdmin.from("transactions").update({ status: "refunded" }).eq("id", transaction_id);
    }

    // Create ledger entry for refund
    const { data: account } = await supabaseAdmin
      .from("accounts")
      .select("id")
      .eq("merchant_id", merchant.id)
      .eq("currency", transaction.currency)
      .single();

    if (account) {
      await supabaseAdmin.from("ledger_entries").insert({
        account_id: account.id,
        transaction_id,
        amount: -amount,
        entry_type: "refund",
        currency: transaction.currency,
      });

      // Update account balance
      await supabaseAdmin.rpc("", {}).catch(() => {});
      await supabaseAdmin
        .from("accounts")
        .update({
          balance: (account as any).balance - amount,
          available_balance: (account as any).available_balance - amount,
        })
        .eq("id", account.id);
    }

    // Mark refund as completed
    await supabaseAdmin.from("refunds").update({ status: "completed" }).eq("id", refund.id);

    // Dispatch webhook
    await supabaseAdmin.functions.invoke("webhook-dispatch", {
      body: {
        merchant_id: merchant.id,
        event_type: "refund.created",
        payload: {
          refund_id: refund.id,
          transaction_id,
          amount,
          currency: transaction.currency,
          status: "completed",
        },
      },
    });

    return new Response(
      JSON.stringify({ refund_id: refund.id, status: "completed", amount, currency: transaction.currency }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
