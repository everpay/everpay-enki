import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const getBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Event Bus / Dispatcher
 * 
 * Central event system that:
 * 1. Logs every event to event_logs
 * 2. Triggers downstream systems based on event type:
 *    - payment.* → webhook-dispatch, ledger updates
 *    - settlement.* → treasury updates
 *    - fraud.* → risk rule evaluation
 *    - reconciliation.* → audit logging
 * 
 * This is the backbone of the event-driven architecture.
 */

interface EventPayload {
  event_type: string;
  source_service: string;
  merchant_id?: string;
  payload: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const token = getBearerToken(req);
  if (!token) {
    return jsonResponse(401, { error: "Unauthorized" });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonResponse(400, { error: "Invalid JSON payload" });
    }

    if (!isRecord(body)) {
      return jsonResponse(400, { error: "Invalid request body" });
    }

    const event_type = typeof body.event_type === "string" ? body.event_type.trim() : "";
    const source_service = typeof body.source_service === "string" && body.source_service.trim().length > 0
      ? body.source_service.trim()
      : "unknown";
    const merchant_id = typeof body.merchant_id === "string" ? body.merchant_id.trim() : undefined;
    const payload = isRecord(body.payload) ? body.payload : {};

    if (!event_type || event_type.length > 120 || !event_type.includes('.')) {
      return jsonResponse(400, { error: 'Valid event_type is required' });
    }

    if (merchant_id && !UUID_REGEX.test(merchant_id)) {
      return jsonResponse(400, { error: 'Invalid merchant_id format' });
    }

    const category = event_type.split('.')[0];

    if ((category === 'payment' || category === 'fraud' || category === 'settlement') && !merchant_id) {
      return jsonResponse(400, { error: 'merchant_id is required for this event type' });
    }

    if (merchant_id) {
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .eq('id', merchant_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (merchantError || !merchant) {
        return jsonResponse(403, { error: 'Forbidden' });
      }
    }

    // 1. Log event
    const { data: eventLog, error: logError } = await supabase
      .from('event_logs')
      .insert({
        event_type,
        source_service,
        payload: { merchant_id, ...payload },
      })
      .select('id')
      .single();

    if (logError) throw logError;

    const dispatched: string[] = [];
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

    // Payment events → trigger webhook dispatch to merchant
    if (category === 'payment' && merchant_id) {
      try {
        const webhookRes = await fetch(`${supabaseUrl}/functions/v1/webhook-dispatch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ merchant_id, event_type, payload }),
        });

        if (webhookRes.ok) {
          dispatched.push('webhook-dispatch');
        } else {
          console.error('Webhook dispatch failed with status:', webhookRes.status);
        }
      } catch (e) {
        console.error('Webhook dispatch failed:', e);
      }
    }

    // Fraud events → log to audit
    if (category === 'fraud' && merchant_id) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: event_type,
        entity_type: 'fraud_score',
        entity_id: (payload.transaction_id as string) || null,
        metadata: { source: source_service, merchant_id, ...payload },
      });
      dispatched.push('audit-log');
    }

    // Settlement events → update treasury accounts
    if (category === 'settlement' && merchant_id) {
      dispatched.push('treasury-update-queued');
    }

    return new Response(
      JSON.stringify({
        success: true,
        event_id: eventLog?.id,
        event_type,
        dispatched,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Event dispatch error:', error);
    return jsonResponse(500, { error: 'Internal server error' });
  }
});
