import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Subscription Billing Worker
 * 
 * Processes active subscriptions whose current_period_end has passed.
 * Creates payment_intents and processes them through the payment flow with retry logic.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date().toISOString();

    // Find active subscriptions that need billing
    const { data: dueSubs, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        customer:customers(id, email, first_name, last_name, merchant_id),
        plan:subscription_plans(name, amount, currency, interval, interval_count),
        payment_method:payment_methods(id, vgs_alias, card_last4, card_brand)
      `)
      .eq('status', 'active')
      .lt('current_period_end', now);

    if (error) throw error;

    const results = [];

    for (const sub of (dueSubs || [])) {
      if (!sub.plan || !sub.customer?.merchant_id) {
        results.push({ id: sub.id, action: 'skipped', reason: 'missing_plan_or_merchant' });
        continue;
      }

      const merchantId = sub.customer.merchant_id;

      // 1. Create payment intent
      const { data: intent, error: intentError } = await supabase
        .from('payment_intents')
        .insert({
          merchant_id: merchantId,
          amount: sub.plan.amount,
          currency: sub.plan.currency || 'USD',
          status: 'requires_payment_method',
          payment_method: 'card',
          metadata: {
            subscription_id: sub.id,
            customer_id: sub.customer_id,
            plan_name: sub.plan.name,
            billing_cycle: true,
          },
        })
        .select()
        .single();

      if (intentError) {
        console.error(`Failed to create intent for sub ${sub.id}:`, intentError);
        results.push({ id: sub.id, action: 'error', reason: 'intent_creation_failed' });
        continue;
      }

      // 2. Get routing stack from routing_rules
      const { data: routingRules } = await supabase
        .from('routing_rules')
        .select('target_provider, fallback_provider')
        .eq('merchant_id', merchantId)
        .eq('active', true)
        .order('priority', { ascending: false })
        .limit(5);

      const processors = routingRules?.map(r => r.target_provider) || ['shieldhub'];
      if (routingRules?.[0]?.fallback_provider) {
        processors.push(routingRules[0].fallback_provider);
      }

      // 3. Process with retry across processors
      let paymentSucceeded = false;
      let attemptNumber = 0;

      for (const processor of processors) {
        attemptNumber++;

        // Simulate payment processing (in production, calls actual PSP)
        const processingStart = Date.now();
        const success = Math.random() > 0.25; // 75% success rate simulation
        const latencyMs = Date.now() - processingStart + Math.floor(Math.random() * 500);

        // Record payment attempt
        await supabase.from('payment_attempts').insert({
          transaction_id: intent.id, // Using intent ID as reference
          provider: processor,
          attempt_number: attemptNumber,
          status: success ? 'completed' : 'failed',
          latency_ms: latencyMs,
          response_code: success ? '00' : 'D1',
          response_message: success ? 'Approved' : 'Insufficient funds',
        });

        if (success) {
          paymentSucceeded = true;

          // Create transaction record
          await supabase.from('transactions').insert({
            merchant_id: merchantId,
            amount: sub.plan.amount,
            currency: sub.plan.currency || 'USD',
            provider: processor,
            status: 'completed',
            customer_email: sub.customer?.email,
            description: `Subscription renewal: ${sub.plan.name}`,
            metadata: {
              subscription_id: sub.id,
              payment_intent_id: intent.id,
              billing_cycle: true,
            },
          });

          // Update intent
          await supabase.from('payment_intents')
            .update({ status: 'succeeded', processor_id: processor })
            .eq('id', intent.id);

          // Advance subscription period
          const periodEnd = new Date(sub.current_period_end);
          const interval = sub.plan.interval || 'month';
          const count = sub.plan.interval_count || 1;

          if (interval === 'year') {
            periodEnd.setFullYear(periodEnd.getFullYear() + count);
          } else if (interval === 'week') {
            periodEnd.setDate(periodEnd.getDate() + 7 * count);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + count);
          }

          await supabase.from('subscriptions').update({
            current_period_start: sub.current_period_end,
            current_period_end: periodEnd.toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('id', sub.id);

          // Log success event
          await supabase.from('provider_events').insert({
            merchant_id: merchantId,
            provider: processor,
            event_type: 'subscription.renewed',
            payload: {
              subscription_id: sub.id,
              amount: sub.plan.amount,
              currency: sub.plan.currency,
              attempt: attemptNumber,
            },
          });

          results.push({ id: sub.id, action: 'renewed', processor, attempt: attemptNumber });
          break;
        }
      }

      if (!paymentSucceeded) {
        // Mark subscription as past_due for dunning
        await supabase.from('subscriptions').update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        }).eq('id', sub.id);

        await supabase.from('payment_intents')
          .update({ status: 'failed' })
          .eq('id', intent.id);

        // Send payment failed alert
        try {
          await supabase.functions.invoke('subscription-alerts', {
            body: {
              type: 'payment_failed',
              subscription_id: sub.id,
              customer_email: sub.customer?.email,
              retry_attempt: 0,
            },
          });
        } catch (e) {
          console.error('Failed to send alert:', e);
        }

        results.push({ id: sub.id, action: 'past_due', attempts: attemptNumber });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Subscription billing error:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});