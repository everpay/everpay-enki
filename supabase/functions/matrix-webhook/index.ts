import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Matrix Pay Solution Webhook Handler
 * 
 * Receives callbacks from Matrix with transaction status updates.
 * Auth: HMAC-SHA256 signature in Authorization header
 * Format: TH-HMAC public_key:sign
 * sign = base64(HMAC_SHA256(request_body, secret_key))
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const authHeader = req.headers.get('Authorization') || '';

    console.log('[Matrix Webhook] Received callback');

    // Fail-closed HMAC verification. Reject the request if the secret is not
    // configured or the signature header is missing/invalid.
    const MATRIX_SECRET_KEY = Deno.env.get('MATRIX_SECRET_KEY');
    if (!MATRIX_SECRET_KEY) {
      console.error('[Matrix Webhook] MATRIX_SECRET_KEY not configured — rejecting');
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!authHeader.startsWith('TH-HMAC ')) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    {
      const [, sigPart] = authHeader.split(' ');
      const [, signature] = (sigPart || '').split(':');
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(MATRIX_SECRET_KEY),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
      );
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
      const expectedSig = btoa(String.fromCharCode(...new Uint8Array(sig)));
      if (!signature || signature !== expectedSig) {
        console.warn('[Matrix Webhook] HMAC verification failed');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const payload = JSON.parse(body);
    const { id, status, code, reason, transactions, card } = payload;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Map Matrix status to our status
    const statusMap: Record<string, string> = {
      success: 'completed',
      error: 'failed',
      declined: 'failed',
      pending: 'processing',
      initial: 'pending',
      suspended: 'pending',
      blocked: 'failed',
    };

    const mappedStatus = statusMap[status] || 'processing';

    // Update transaction by provider_ref
    if (id) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: mappedStatus,
          metadata: {
            provider_response: {
              status: status === 'success' ? 'Approved' : status === 'declined' ? 'Declined' : status,
              respcode: String(code),
              message: reason,
              transaction_reference: transactions?.[0]?.id,
              card_mask: card?.mask,
              card_brand: card?.brand,
            },
          },
          updated_at: new Date().toISOString(),
        })
        .eq('provider_ref', id);

      if (updateError) {
        console.error('[Matrix Webhook] Update error:', updateError);
      }
    }

    // Log the webhook
    await supabase.from('everpay_webhooks').insert({
      transaction_id: id,
      status: mappedStatus,
      payload,
      processed: true,
    });

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[Matrix Webhook] Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
