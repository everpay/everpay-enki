import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * BigCommerce OAuth Install Flow
 * 
 * 1. Merchant clicks "Install" on BigCommerce → redirected here with code + store_hash
 * 2. Exchange code for access_token
 * 3. Store merchant in Supabase
 * 4. Auto-register scripts + webhooks on BigCommerce store
 * 5. Redirect to /admin
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action } = body;

    // ── OAuth callback: exchange code for token ──
    if (action === 'oauth_callback') {
      const { code, scope, context } = body;
      const storeHash = context?.replace('stores/', '') || body.store_hash;

      if (!code || !storeHash) {
        throw new Error('Missing code or store_hash');
      }

      const bcClientId = Deno.env.get('BIGCOMMERCE_CLIENT_ID');
      const bcClientSecret = Deno.env.get('BIGCOMMERCE_CLIENT_SECRET');

      let accessToken: string;
      let grantedScopes: string;

      if (bcClientId && bcClientSecret) {
        // Live OAuth exchange
        const tokenResponse = await fetch('https://login.bigcommerce.com/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: bcClientId,
            client_secret: bcClientSecret,
            code,
            scope,
            grant_type: 'authorization_code',
            redirect_uri: `${supabaseUrl}/functions/v1/bigcommerce-oauth`,
            context,
          }),
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
          throw new Error(`BigCommerce OAuth error: ${JSON.stringify(tokenData)}`);
        }
        accessToken = tokenData.access_token;
        grantedScopes = tokenData.scope;
      } else {
        // Simulation mode
        accessToken = `sim_bc_token_${crypto.randomUUID().substring(0, 8)}`;
        grantedScopes = scope || 'store_v2_products store_v2_orders';
        console.log('BigCommerce OAuth running in SIMULATION mode');
      }

      // Store in Supabase (upsert by store_hash)
      const { data: existingStore } = await supabase
        .from('bigcommerce_stores')
        .select('id')
        .eq('store_hash', storeHash)
        .single();

      if (existingStore) {
        await supabase
          .from('bigcommerce_stores')
          .update({
            access_token: accessToken,
            scope: grantedScopes,
            active: true,
          })
          .eq('store_hash', storeHash);
      } else {
        // Need merchant_id from auth context or body
        const merchantId = body.merchant_id;
        if (!merchantId) {
          throw new Error('merchant_id is required for new store installations');
        }

        await supabase.from('bigcommerce_stores').insert({
          merchant_id: merchantId,
          store_hash: storeHash,
          access_token: accessToken,
          scope: grantedScopes,
          shop_domain: `store-${storeHash}.mybigcommerce.com`,
        });
      }

      // Auto-register checkout script + webhooks (if live)
      if (bcClientId && accessToken && !accessToken.startsWith('sim_')) {
        // Inject Everpay checkout script
        await fetch(`https://api.bigcommerce.com/stores/${storeHash}/v3/content/scripts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': accessToken,
          },
          body: JSON.stringify({
            name: 'Everpay Checkout',
            src: `${supabaseUrl}/functions/v1/bigcommerce-checkout-script`,
            auto_uninstall: true,
            location: 'footer',
            visibility: 'checkout',
            kind: 'script_tag',
            consent_category: 'essential',
          }),
        });

        // Register order webhooks
        for (const scope of ['store/order/created', 'store/order/updated']) {
          await fetch(`https://api.bigcommerce.com/stores/${storeHash}/v3/hooks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Auth-Token': accessToken,
            },
            body: JSON.stringify({
              scope,
              destination: `${supabaseUrl}/functions/v1/bigcommerce-webhook`,
              is_active: true,
            }),
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          store_hash: storeHash,
          mode: accessToken.startsWith('sim_') ? 'simulation' : 'live',
          message: 'BigCommerce store connected successfully',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── List stores ──
    if (action === 'list_stores') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Missing authorization');

      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) throw new Error('Unauthorized');

      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { data: stores } = await supabase
        .from('bigcommerce_stores')
        .select('id, store_hash, shop_domain, active, installed_at, scope')
        .eq('merchant_id', merchant?.id || '');

      return new Response(
        JSON.stringify({ success: true, stores: stores || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error('BigCommerce OAuth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
