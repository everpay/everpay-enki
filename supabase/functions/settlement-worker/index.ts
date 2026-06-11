import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Restrict to internal callers (service_role / cron).
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  const svc = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!svc || token !== svc) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create settlement batches from captured transactions
    const { data: batches, error: batchError } = await supabase.rpc('create_settlement_batches');
    
    // Fallback: direct insert if RPC doesn't exist
    if (batchError) {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('provider, currency, amount')
        .eq('status', 'completed');

      if (!transactions?.length) {
        return new Response(
          JSON.stringify({ message: 'No transactions to settle', batches: 0 }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Group by processor + currency
      const groups: Record<string, { processor: string; currency: string; total: number; count: number }> = {};
      for (const tx of transactions) {
        const key = `${tx.provider}_${tx.currency}`;
        if (!groups[key]) {
          groups[key] = { processor: tx.provider, currency: tx.currency, total: 0, count: 0 };
        }
        groups[key].total += Number(tx.amount);
        groups[key].count += 1;
      }

      const batchInserts = Object.values(groups).map((g) => ({
        processor: g.processor,
        currency: g.currency,
        total_amount: g.total,
        transaction_count: g.count,
        status: 'pending',
      }));

      const { data: inserted, error: insertError } = await supabase
        .from('settlement_batches')
        .insert(batchInserts)
        .select();

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ message: 'Settlement batches created', batches: inserted?.length || 0, data: inserted }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Settlement batches created via RPC', data: batches }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Settlement worker error:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
