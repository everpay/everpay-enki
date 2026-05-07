// Shared runtime alerting helper. Logs to public.security_alerts via the
// log_security_alert RPC (service role) and optionally emails super_admins
// via Resend when severity = 'critical'.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export type AlertSeverity = "info" | "warn" | "critical";
export type AlertCategory =
  | "payment_failure"
  | "vgs_validation"
  | "webhook_signature"
  | "auth"
  | "rate_limit"
  | "other";

export interface RecordAlertInput {
  severity: AlertSeverity;
  category: AlertCategory;
  source: string;
  message: string;
  details?: Record<string, unknown>;
  merchantId?: string | null;
}

let cached: ReturnType<typeof createClient> | null = null;
function admin() {
  if (cached) return cached;
  cached = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  return cached;
}

export async function recordAlert(input: RecordAlertInput): Promise<void> {
  try {
    const sb = admin();
    await sb.rpc("log_security_alert", {
      _severity: input.severity,
      _category: input.category,
      _source: input.source,
      _message: input.message,
      _details: input.details ?? {},
      _merchant_id: input.merchantId ?? null,
    });

    if (input.severity === "critical") {
      // Best-effort fan-out email to super_admins.
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (!resendKey) return;
      const { data: roles } = await sb
        .from("user_roles")
        .select("user_id")
        .eq("role", "super_admin");
      if (!roles?.length) return;
      const ids = roles.map((r: any) => r.user_id);
      // Resolve emails via auth admin
      const emails: string[] = [];
      for (const id of ids) {
        try {
          const { data } = await (sb as any).auth.admin.getUserById(id);
          const e = data?.user?.email;
          if (e) emails.push(e);
        } catch { /* ignore */ }
      }
      if (!emails.length) return;
      const subject = `🚨 Enki critical alert: ${input.category} — ${input.source}`;
      const text = `Severity: CRITICAL\nCategory: ${input.category}\nSource: ${input.source}\nMessage: ${input.message}\n\nDetails:\n${JSON.stringify(input.details ?? {}, null, 2)}\n\nTime: ${new Date().toISOString()}`;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: "alerts@everpayinc.com",
          to: emails,
          subject,
          text,
        }),
      }).catch((e) => console.error("alert email failed", e));
    }
  } catch (e) {
    console.error("recordAlert failed:", e);
  }
}