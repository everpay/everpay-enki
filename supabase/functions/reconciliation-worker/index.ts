import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Reconciliation Engine
 * 
 * Matches internal ledger totals against processor settlement data
 * and generates reconciliation_reports with discrepancy detection.
 * 
 * Flow: Ledger Entries → Group by currency → Compare with settlement_batches → Report
 */

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

    const body = await req.json().catch(() => ({}));
    const { merchant_id, report_date } = body;

    if (!merchant_id) {
      return new Response(
        JSON.stringify({ error: 'merchant_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetDate = report_date || new Date().toISOString().split('T')[0];

    // 1. Get internal ledger totals (credits = revenue) grouped by currency
    const { data: ledgerCredits, error: ledgerError } = await supabase
      .from('ledger_entries')
      .select('currency, amount, entry_type, created_at')
      .gte('created_at', `${targetDate}T00:00:00Z`)
      .lt('created_at', `${targetDate}T23:59:59Z`);

    if (ledgerError) throw ledgerError;

    // Group ledger by currency
    const internalTotals: Record<string, number> = {};
    for (const entry of ledgerCredits || []) {
      const curr = entry.currency || 'USD';
      if (!internalTotals[curr]) internalTotals[curr] = 0;
      if (entry.entry_type === 'credit') {
        internalTotals[curr] += Number(entry.amount);
      } else {
        internalTotals[curr] -= Number(entry.amount);
      }
    }

    // 2. Get processor settlement totals from settlement_batches
    const { data: settlements } = await supabase
      .from('settlement_batches')
      .select('currency, total_amount, status')
      .gte('created_at', `${targetDate}T00:00:00Z`)
      .lt('created_at', `${targetDate}T23:59:59Z`);

    const processorTotals: Record<string, number> = {};
    for (const batch of settlements || []) {
      const curr = batch.currency || 'USD';
      if (!processorTotals[curr]) processorTotals[curr] = 0;
      processorTotals[curr] += Number(batch.total_amount);
    }

    // 3. Generate reconciliation reports per currency
    const allCurrencies = new Set([
      ...Object.keys(internalTotals),
      ...Object.keys(processorTotals),
    ]);

    const reports = [];
    for (const currency of allCurrencies) {
      const internal = Math.round((internalTotals[currency] || 0) * 100) / 100;
      const processor = Math.round((processorTotals[currency] || 0) * 100) / 100;
      const difference = Math.round((internal - processor) * 100) / 100;
      const status = Math.abs(difference) < 0.01 ? 'matched' : 'discrepancy';

      reports.push({
        merchant_id,
        report_date: targetDate,
        currency,
        internal_total: internal,
        processor_total: processor,
        difference,
        status,
        metadata: {
          ledger_entries_count: (ledgerCredits || []).filter(e => e.currency === currency).length,
          settlement_batches_count: (settlements || []).filter(s => s.currency === currency).length,
          generated_at: new Date().toISOString(),
        },
      });
    }

    // 4. Insert reports
    if (reports.length > 0) {
      const { error: insertError } = await supabase
        .from('reconciliation_reports')
        .insert(reports);
      if (insertError) throw insertError;
    }

    // 5. Log event
    await supabase.from('event_logs').insert({
      event_type: 'reconciliation.completed',
      source_service: 'reconciliation-worker',
      payload: {
        merchant_id,
        report_date: targetDate,
        currencies: Array.from(allCurrencies),
        reports_count: reports.length,
        has_discrepancies: reports.some(r => r.status === 'discrepancy'),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        report_date: targetDate,
        reports_count: reports.length,
        reports,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Reconciliation error:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
