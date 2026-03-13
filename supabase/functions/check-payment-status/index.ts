import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { transaction_id } = await req.json();
    if (!transaction_id) throw new Error('transaction_id is required');

    // Get merchant
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!merchant) throw new Error('Merchant not found');

    // Fetch transaction with merchant scope
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('id, status, amount, currency, provider, provider_ref, metadata, created_at, updated_at')
      .eq('id', transaction_id)
      .eq('merchant_id', merchant.id)
      .single();

    if (txError || !transaction) throw new Error('Transaction not found');

    // If still pending and has a provider_ref, check with the provider
    if (transaction.status === 'pending' && transaction.provider_ref) {
      const provider = transaction.provider;

      if (provider === 'mondo') {
        // Check Mondo transaction status via their API
        const gatewaySecret = Deno.env.get('MONDO_GATEWAY_SECRET_KEY');
        const accountId = Deno.env.get('MONDO_ACCOUNT_ID');

        if (gatewaySecret && accountId) {
          try {
            const response = await fetch('https://server-to-server.getmondo.co/payment/status/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                company_account_id: accountId,
                gateway_secret_key: gatewaySecret,
                gateway_session_id: transaction.provider_ref,
              }),
            });

            const statusData = await response.json();
            console.log('Mondo status check:', statusData);

            const statusMap: Record<string, string> = {
              'Approved': 'completed', 'approved': 'completed', 'success': 'completed',
              'Declined': 'failed', 'declined': 'failed', 'Failed': 'failed',
              'Redirect': 'pending', 'pending': 'pending',
            };

            const newStatus = statusMap[statusData.status] || transaction.status;

            if (newStatus !== transaction.status) {
              await supabase
                .from('transactions')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', transaction_id);

              // Log status change
              await supabase.from('provider_events').insert({
                merchant_id: merchant.id,
                transaction_id: transaction.id,
                provider: 'mondo',
                event_type: 'payment.status_updated',
                payload: { previous_status: transaction.status, new_status: newStatus, provider_response: statusData },
              });

              return new Response(
                JSON.stringify({ status: newStatus, transaction: { ...transaction, status: newStatus }, updated: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } catch (err) {
            console.warn('Mondo status check failed:', err);
          }
        }
      }

      if (provider === 'shieldhub') {
        // ShieldHub status is typically updated via webhook, return current status
        console.log('ShieldHub status check — using stored status');
      }
    }

    return new Response(
      JSON.stringify({ status: transaction.status, transaction, updated: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Status check error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
