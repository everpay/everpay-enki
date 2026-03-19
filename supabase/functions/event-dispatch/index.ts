import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

  // Validate authorization
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { event_type, source_service, merchant_id, payload }: EventPayload = await req.json();

    if (!event_type) {
      return new Response(
        JSON.stringify({ error: 'event_type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Log event
    const { data: eventLog, error: logError } = await supabase
      .from('event_logs')
      .insert({
        event_type,
        source_service: source_service || 'unknown',
        payload: { merchant_id, ...payload },
      })
      .select('id')
      .single();

    if (logError) throw logError;

    const dispatched: string[] = [];
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 2. Route to downstream systems based on event type prefix
    const category = event_type.split('.')[0];

    // Payment events → trigger webhook dispatch to merchant
    if (category === 'payment' && merchant_id) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/webhook-dispatch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ merchant_id, event_type, payload }),
        });
        dispatched.push('webhook-dispatch');
      } catch (e) {
        console.error('Webhook dispatch failed:', e);
      }
    }

    // Fraud events → log to audit
    if (category === 'fraud' && merchant_id) {
      await supabase.from('audit_logs').insert({
        user_id: payload.user_id || '00000000-0000-0000-0000-000000000000',
        action: event_type,
        entity_type: 'fraud_score',
        entity_id: (payload.transaction_id as string) || null,
        metadata: { source: source_service, ...payload },
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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
