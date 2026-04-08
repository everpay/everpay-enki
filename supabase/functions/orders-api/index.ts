import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-everpay-api-key, x-request-id",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { data: merchant } = await supabase.from("merchants").select("id").eq("user_id", user.id).single();
  if (!merchant) return new Response(JSON.stringify({ error: "Merchant not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const orderId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;

  try {
    if (req.method === "GET" && !orderId) {
      // List orders
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const status = url.searchParams.get("status");

      let query = supabase.from("orders").select("*", { count: "exact" })
        .eq("merchant_id", merchant.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) query = query.eq("status", status);

      const { data, count, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify({ object: "list", data, total_count: count, has_more: (count || 0) > offset + limit }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET" && orderId) {
      const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).eq("merchant_id", merchant.id).single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { data, error } = await supabase.from("orders").insert({
        merchant_id: merchant.id,
        order_number: body.order_number || "",
        customer_id: body.customer_id || null,
        customer_email: body.customer_email || null,
        customer_name: body.customer_name || null,
        status: body.status || "pending",
        currency: body.currency || "USD",
        subtotal: body.subtotal || 0,
        tax_amount: body.tax_amount || 0,
        shipping_amount: body.shipping_amount || 0,
        discount_amount: body.discount_amount || 0,
        total_amount: body.total_amount || 0,
        payment_intent_id: body.payment_intent_id || null,
        invoice_id: body.invoice_id || null,
        transaction_id: body.transaction_id || null,
        payment_method: body.payment_method || null,
        notes: body.notes || null,
        metadata: body.metadata || {},
      }).select().single();

      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "PUT" && orderId) {
      const body = await req.json();
      const { data, error } = await supabase.from("orders").update(body).eq("id", orderId).eq("merchant_id", merchant.id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "DELETE" && orderId) {
      const { error } = await supabase.from("orders").delete().eq("id", orderId).eq("merchant_id", merchant.id);
      if (error) throw error;
      return new Response(JSON.stringify({ deleted: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
