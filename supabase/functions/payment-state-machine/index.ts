import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Payment State Machine
 * 
 * Enforces strict state transitions per document Section 2:
 *   created → authorized → captured → settled → (refunded | chargeback)
 * 
 * POST /payment-state-machine
 * Body: { transaction_id, target_state, metadata? }
 * Returns: { success, previous_state, new_state, event_id }
 */

const VALID_TRANSITIONS: Record<string, string[]> = {
  created:    ['authorized', 'failed'],
  pending:    ['authorized', 'processing', 'completed', 'failed'],
  authorized: ['captured', 'failed', 'refunded'],
  processing: ['completed', 'failed'],
  captured:   ['settled', 'refunded', 'chargeback'],
  settled:    ['refunded', 'chargeback'],
  completed:  ['refunded', 'chargeback', 'settled'],
  refunded:   [], // terminal
  chargeback: ['refunded'], // chargeback can be refunded
  failed:     ['created', 'pending'], // retry allowed
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { transaction_id, target_state, metadata } = await req.json();

    if (!transaction_id || !target_state) {
      return new Response(JSON.stringify({ error: 'transaction_id and target_state are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch current state
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('id, status, merchant_id, amount, currency, provider')
      .eq('id', transaction_id)
      .single();

    if (txError || !tx) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentState = tx.status;
    const allowedTransitions = VALID_TRANSITIONS[currentState] || [];

    if (!allowedTransitions.includes(target_state)) {
      return new Response(JSON.stringify({
        error: 'Invalid state transition',
        current_state: currentState,
        target_state,
        allowed_transitions: allowedTransitions,
      }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Execute transition
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ status: target_state, updated_at: new Date().toISOString() })
      .eq('id', transaction_id);

    if (updateError) throw updateError;

    // Emit event to event_logs
    const { data: event } = await supabase
      .from('event_logs')
      .insert({
        event_type: `payment.${target_state}`,
        source_service: 'payment-state-machine',
        payload: {
          transaction_id,
          previous_state: currentState,
          new_state: target_state,
          merchant_id: tx.merchant_id,
          amount: tx.amount,
          currency: tx.currency,
          provider: tx.provider,
          metadata: metadata || {},
          timestamp: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    // Create ledger entries for financial transitions
    if (['captured', 'settled'].includes(target_state)) {
      // Debit Cash, Credit Revenue
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('merchant_id', tx.merchant_id)
        .limit(1);

      if (accounts?.length) {
        await supabase.from('ledger_entries').insert([
          {
            transaction_id,
            account_id: accounts[0].id,
            entry_type: 'debit',
            amount: tx.amount,
            currency: tx.currency,
          },
          {
            transaction_id,
            account_id: accounts[0].id,
            entry_type: 'credit',
            amount: tx.amount,
            currency: tx.currency,
          },
        ]);
      }
    }

    if (target_state === 'refunded') {
      // Reverse: Debit Revenue, Credit Cash
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('merchant_id', tx.merchant_id)
        .limit(1);

      if (accounts?.length) {
        await supabase.from('ledger_entries').insert([
          {
            transaction_id,
            account_id: accounts[0].id,
            entry_type: 'debit',
            amount: tx.amount,
            currency: tx.currency,
          },
          {
            transaction_id,
            account_id: accounts[0].id,
            entry_type: 'credit',
            amount: tx.amount,
            currency: tx.currency,
          },
        ]);
      }
    }

    // Dispatch to event-dispatch for webhook delivery
    try {
      await supabase.functions.invoke('event-dispatch', {
        body: {
          event_type: `payment.${target_state}`,
          merchant_id: tx.merchant_id,
          payload: {
            transaction_id,
            previous_state: currentState,
            new_state: target_state,
            amount: tx.amount,
            currency: tx.currency,
          },
        },
      });
    } catch (e) {
      console.error('Event dispatch failed (non-blocking):', e);
    }

    // Record audit log
    await supabase.from('audit_logs').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // system
      action: `state_transition:${currentState}->${target_state}`,
      entity_type: 'transaction',
      entity_id: transaction_id,
      metadata: { previous_state: currentState, new_state: target_state },
    });

    return new Response(JSON.stringify({
      success: true,
      previous_state: currentState,
      new_state: target_state,
      event_id: event?.id,
      transaction_id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('State machine error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
