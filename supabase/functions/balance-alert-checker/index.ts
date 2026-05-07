// Scheduled worker: scans active balance_alert_configs, compares against
// current accounts.balance per (merchant_id, currency), and fires alerts
// (history row + optional Resend email) when thresholds are crossed.
// Respects per-config cooldown_minutes.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: configs = [] } = await supabase
    .from("balance_alert_configs")
    .select("*")
    .eq("active", true);

  let fired = 0;
  const resendKey = Deno.env.get("RESEND_API_KEY");

  for (const cfg of configs as any[]) {
    // Cooldown check
    if (cfg.last_triggered_at) {
      const lastMs = new Date(cfg.last_triggered_at).getTime();
      const cooldownMs = (cfg.cooldown_minutes ?? 60) * 60_000;
      if (Date.now() - lastMs < cooldownMs) continue;
    }

    const { data: account } = await supabase
      .from("accounts")
      .select("balance")
      .eq("merchant_id", cfg.merchant_id)
      .eq("currency", cfg.currency)
      .maybeSingle();

    if (!account) continue;
    const balance = Number(account.balance);
    const threshold = Number(cfg.threshold_amount);

    const triggered =
      (cfg.threshold_type === "below" && balance < threshold) ||
      (cfg.threshold_type === "above" && balance > threshold);

    if (!triggered) continue;

    let notification_sent = false;
    let notification_channel: string | null = null;

    if (cfg.notify_email && resendKey) {
      // Look up merchant owner email
      const { data: merchant } = await supabase
        .from("merchants")
        .select("user_id, name")
        .eq("id", cfg.merchant_id)
        .maybeSingle();
      if (merchant?.user_id) {
        const { data: { user } } = await supabase.auth.admin.getUserById(merchant.user_id);
        if (user?.email) {
          try {
            const html = `
              <div style="font-family:Manrope,Arial,sans-serif;max-width:560px;margin:auto;padding:24px;background:#fff;color:#0f172a;">
                <h2 style="font-family:Sora,Arial,sans-serif;color:#1aa478;margin:0 0 8px;">Balance Alert</h2>
                <p style="margin:0 0 16px;color:#475569;">Your ${cfg.currency} balance has crossed a threshold you configured.</p>
                <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                  <tr><td style="padding:10px 14px;background:#f8fafc;font-weight:600;">Currency</td><td style="padding:10px 14px;">${cfg.currency}</td></tr>
                  <tr><td style="padding:10px 14px;background:#f8fafc;font-weight:600;">Rule</td><td style="padding:10px 14px;">Balance ${cfg.threshold_type} ${threshold.toLocaleString()}</td></tr>
                  <tr><td style="padding:10px 14px;background:#f8fafc;font-weight:600;">Current Balance</td><td style="padding:10px 14px;color:${cfg.threshold_type === 'below' ? '#dc2626' : '#1aa478'};font-weight:600;">${balance.toLocaleString()} ${cfg.currency}</td></tr>
                </table>
                <p style="margin:24px 0 0;color:#64748b;font-size:13px;">View details and history in your Everpay dashboard → Settings → Balance Alerts.</p>
              </div>`;
            const r = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: "Everpay Alerts <alerts@everpayinc.com>",
                to: [user.email],
                subject: `Balance Alert: ${cfg.currency} ${cfg.threshold_type} ${threshold}`,
                html,
              }),
            });
            notification_sent = r.ok;
            notification_channel = "email";
          } catch (e) {
            console.error("[balance-alert] email failed", e);
          }
        }
      }
    }

    await supabase.from("balance_alert_history").insert({
      config_id: cfg.id,
      merchant_id: cfg.merchant_id,
      currency: cfg.currency,
      threshold_type: cfg.threshold_type,
      threshold_amount: threshold,
      observed_balance: balance,
      notification_sent,
      notification_channel,
    });

    await supabase
      .from("balance_alert_configs")
      .update({ last_triggered_at: new Date().toISOString() })
      .eq("id", cfg.id);

    fired++;
  }

  return new Response(JSON.stringify({ checked: configs.length, fired }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
