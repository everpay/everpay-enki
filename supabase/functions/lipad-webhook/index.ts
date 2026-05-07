import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { recordAlert } from "../_shared/alerts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-lipad-signature',
};

async function verifySignature(rawBody: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const digest = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return digest === signature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-lipad-signature');
    const webhookSecret = Deno.env.get('LIPAD_WEBHOOK_SECRET');

    // Fail-closed signature verification.
    if (!webhookSecret) {
      console.error('LIPAD_WEBHOOK_SECRET not configured — refusing webhook');
      await recordAlert({
        severity: 'critical', category: 'webhook_signature', source: 'lipad-webhook',
        message: 'LIPAD_WEBHOOK_SECRET not configured',
      });
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const valid = await verifySignature(rawBody, signature, webhookSecret);
    if (!valid) {
      console.error('Invalid Lipad webhook signature');
      await recordAlert({
        severity: 'critical', category: 'webhook_signature', source: 'lipad-webhook',
        message: 'Invalid Lipad webhook signature',
        details: { ip: req.headers.get('x-forwarded-for') || null, has_sig: !!signature },
      });
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.parse(rawBody);
    const {
      transaction_id, status, amount, currency,
      event, payment_method, customer_phone,
      customer_email, mpesa_receipt, country, ...rest
    } = payload;

    if (!transaction_id || !status) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Idempotency check
    const { data: existing } = await supabase
      .from('provider_events')
      .select('id')
      .eq('provider', 'lipad')
      .eq('transaction_id', transaction_id)
      .eq('event_type', event || status)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log provider event
    await supabase.from('provider_events').insert({
      provider: 'lipad',
      event_type: event || status,
      transaction_id,
      payload: { amount, currency, payment_method, customer_phone, customer_email, mpesa_receipt, country, ...rest },
    });

    // Map Lipad status to internal status
    const statusMap: Record<string, string> = {
      'SUCCESS': 'completed',
      'COMPLETED': 'completed',
      'FAILED': 'failed',
      'DECLINED': 'failed',
      'PENDING': 'processing',
      'REVERSED': 'refunded',
    };
    const internalStatus = statusMap[status.toUpperCase()] || 'processing';

    // Update transaction if it exists
    const { data: tx } = await supabase
      .from('transactions')
      .select('id, merchant_id')
      .eq('provider_ref', transaction_id)
      .single();

    if (tx) {
      await supabase
        .from('transactions')
        .update({
          status: internalStatus,
          metadata: { lipad_receipt: mpesa_receipt, payment_method, country },
        })
        .eq('id', tx.id);

      // Handle chargebacks
      if (event === 'chargeback.created' || event === 'dispute.opened') {
        await supabase
          .from('transactions')
          .update({ status: 'chargeback' })
          .eq('id', tx.id);

        await supabase.from('disputes').insert({
          merchant_id: tx.merchant_id,
          transaction_id: tx.id,
          amount: parseFloat(amount) || 0,
          currency: currency || 'KES',
          status: 'open',
          reason: rest.reason || 'fraud',
          description: `Lipad chargeback - ${rest.reason || 'Unknown'}`,
          provider: 'lipad',
        });
      }

      // Dispatch merchant webhook
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        await fetch(`${supabaseUrl}/functions/v1/api-v2-webhooks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchant_id: tx.merchant_id,
            event: `payment.${internalStatus}`,
            data: { transaction_id: tx.id, amount, currency, provider: 'lipad', payment_method },
          }),
        });
      } catch (err) {
        console.error('Failed to dispatch merchant webhook:', err);
      }
    }

    // Send email alerts for failures/chargebacks
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey && (internalStatus === 'failed' || event === 'chargeback.created')) {
      const { data: adminEmails } = await supabase
        .from('admin_notification_emails')
        .select('email_address')
        .eq('enabled', true)
        .or('notify_on_failure.eq.true,notify_on_chargeback.eq.true');

      if (adminEmails) {
        for (const admin of adminEmails) {
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
              body: JSON.stringify({
                from: 'alerts@everpayinc.com',
                to: admin.email_address,
                subject: `Lipad ${event || status} - ${transaction_id}`,
                text: `Lipad webhook event:\n\nTransaction: ${transaction_id}\nStatus: ${status}\nAmount: ${amount} ${currency}\nPayment Method: ${payment_method || 'N/A'}\nCountry: ${country || 'N/A'}`,
              }),
            });
          } catch (_) {}
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Lipad webhook error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
