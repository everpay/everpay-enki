import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-everpay-signature',
};

/**
 * Everpay Webhook Handler
 * 
 * 1. Verify X-Everpay-Signature (HMAC-SHA256)
 * 2. Insert into everpay_webhooks (trigger syncs to transactions)
 * 3. Send email alerts via Resend for configured events
 */

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

async function sendEmailAlert(
  resendKey: string,
  to: string,
  transactionId: string,
  status: string,
  amount?: string,
  currency?: string,
  orderId?: string
) {
  const subject = `Payment ${status.toUpperCase()} - ${transactionId}`;
  const body = `A payment update has been received from Everpay:

- Order ID: ${orderId || 'N/A'}
- Transaction ID: ${transactionId}
- Amount: ${amount || 'Unknown'} ${currency || 'USD'}
- Status: ${status.toUpperCase()}
- Timestamp: ${new Date().toISOString()}`;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'alerts@everpayinc.com',
        to,
        subject,
        text: body,
      }),
    });
    console.log(`Email alert sent to ${to}`);
  } catch (err) {
    console.error('Failed to send email alert:', err);
  }
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
    const signature = req.headers.get('x-everpay-signature');
    const webhookSecret = Deno.env.get('EVERPAY_WEBHOOK_SECRET');

    // Verify HMAC if secret is configured
    if (webhookSecret) {
      const valid = await verifySignature(rawBody, signature, webhookSecret);
      if (!valid) {
        console.error('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const payload = JSON.parse(rawBody);
    const { transaction_id, status, amount, currency, order_id, event, ...rest } = payload;

    if (!transaction_id || !status) {
      return new Response(JSON.stringify({ error: 'Invalid webhook payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Idempotency: check if webhook already processed
    const { data: existing } = await supabase
      .from('everpay_webhooks')
      .select('id')
      .eq('transaction_id', transaction_id)
      .eq('status', status)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert webhook record (trigger will sync to transactions)
    const { error: insertError } = await supabase.from('everpay_webhooks').insert({
      transaction_id,
      status,
      payload: { amount, currency, order_id, event, ...rest },
    });

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Database insert failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle chargeback events — update transaction status
    if (event === 'chargeback.created') {
      await supabase
        .from('transactions')
        .update({ status: 'chargeback' })
        .eq('provider_ref', transaction_id);
    }

    // Send email notifications
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      // Determine notification type
      const isSuccess = status === 'succeeded' || status === 'completed' || status === 'Approved';
      const isFailure = status === 'failed' || status === 'Failed' || status === 'Declined';
      const isRefund = event === 'refund.created' || status === 'refunded';
      const isChargeback = event === 'chargeback.created';

      // Admin notification emails
      const { data: adminEmails } = await supabase
        .from('admin_notification_emails')
        .select('email_address, notify_on_success, notify_on_failure, notify_on_refund, notify_on_chargeback')
        .eq('enabled', true);

      if (adminEmails) {
        for (const admin of adminEmails) {
          const shouldNotify =
            (isSuccess && admin.notify_on_success) ||
            (isFailure && admin.notify_on_failure) ||
            (isRefund && admin.notify_on_refund) ||
            (isChargeback && admin.notify_on_chargeback);

          if (shouldNotify) {
            await sendEmailAlert(resendKey, admin.email_address, transaction_id, status, amount, currency, order_id);
          }
        }
      }

      // Merchant webhook notification settings
      // Find the merchant from the transaction
      const { data: tx } = await supabase
        .from('transactions')
        .select('merchant_id')
        .eq('provider_ref', transaction_id)
        .single();

      if (tx?.merchant_id) {
        const { data: merchantSettings } = await supabase
          .from('webhook_notification_settings')
          .select('*')
          .eq('merchant_id', tx.merchant_id)
          .eq('enabled', true)
          .single();

        if (merchantSettings?.email_address) {
          const shouldNotifyMerchant =
            (isSuccess && merchantSettings.notify_on_success) ||
            (isFailure && merchantSettings.notify_on_failure) ||
            (isRefund && merchantSettings.notify_on_refund) ||
            (isChargeback && merchantSettings.notify_on_chargeback);

          if (shouldNotifyMerchant) {
            await sendEmailAlert(resendKey, merchantSettings.email_address, transaction_id, status, amount, currency, order_id);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true, notified: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
