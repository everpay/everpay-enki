import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * BigCommerce OAuth Install Flow + Store Management
 * 
 * Actions:
 * - oauth_callback: Exchange code for access_token, store merchant, auto-register webhooks
 * - list_stores: List connected stores for authenticated user
 * - save_config: Save/update Everpay config for a BC store
 * - get_config: Get Everpay config for a BC store
 * - get_public_key: Return public key + base_url for checkout widget
 * - refresh_token: Refresh BigCommerce OAuth token
 * - register_webhooks: Re-register webhooks for a store
 * - uninstall: Handle app uninstall cleanup
 */

async function registerBCWebhooks(storeHash: string, accessToken: string, supabaseUrl: string) {
  const webhookScopes = [
    'store/order/created',
    'store/order/updated',
    'store/order/statusUpdated',
    'store/app/uninstalled',
  ];

  const results = [];
  for (const scope of webhookScopes) {
    try {
      const resp = await fetch(`https://api.bigcommerce.com/stores/${storeHash}/v3/hooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': accessToken,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          scope,
          destination: `${supabaseUrl}/functions/v1/bigcommerce-webhook`,
          is_active: true,
        }),
      });
      const data = await resp.json();
      results.push({ scope, status: resp.status, id: data?.data?.id });
    } catch (e) {
      console.error(`Failed to register webhook ${scope}:`, e);
      results.push({ scope, error: String(e) });
    }
  }
  return results;
}

async function injectCheckoutScript(storeHash: string, accessToken: string, supabaseUrl: string) {
  try {
    const resp = await fetch(`https://api.bigcommerce.com/stores/${storeHash}/v3/content/scripts`, {
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
    return { ok: resp.ok, status: resp.status };
  } catch (e) {
    console.error('Failed to inject checkout script:', e);
    return { ok: false, error: String(e) };
  }
}

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
      let refreshToken: string | null = null;
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
        refreshToken = tokenData.refresh_token || null;
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

      let storeId: string;

      if (existingStore) {
        await supabase
          .from('bigcommerce_stores')
          .update({
            access_token: accessToken,
            refresh_token: refreshToken,
            scope: grantedScopes,
            active: true,
            uninstalled: false,
            token_updated_at: new Date().toISOString(),
          })
          .eq('store_hash', storeHash);
        storeId = existingStore.id;
      } else {
        const merchantId = body.merchant_id;
        if (!merchantId) {
          throw new Error('merchant_id is required for new store installations');
        }

        const { data: newStore } = await supabase.from('bigcommerce_stores').insert({
          merchant_id: merchantId,
          store_hash: storeHash,
          access_token: accessToken,
          refresh_token: refreshToken,
          scope: grantedScopes,
          shop_domain: `store-${storeHash}.mybigcommerce.com`,
          token_updated_at: new Date().toISOString(),
        }).select('id').single();
        storeId = newStore?.id || '';
      }

      // Auto-register webhooks and inject checkout script (if live)
      let webhookResults = [];
      let scriptResult = {};
      if (bcClientId && accessToken && !accessToken.startsWith('sim_')) {
        webhookResults = await registerBCWebhooks(storeHash, accessToken, supabaseUrl);
        scriptResult = await injectCheckoutScript(storeHash, accessToken, supabaseUrl);

        await supabase
          .from('bigcommerce_stores')
          .update({ webhook_registered: true })
          .eq('store_hash', storeHash);
      }

      // Create default config if not exists
      if (storeId) {
        const merchantId = body.merchant_id || (existingStore ? 
          (await supabase.from('bigcommerce_stores').select('merchant_id').eq('id', storeId).single()).data?.merchant_id 
          : null);
        
        if (merchantId) {
          const { data: existingConfig } = await supabase
            .from('bigcommerce_configs')
            .select('id')
            .eq('store_id', storeId)
            .single();

          if (!existingConfig) {
            await supabase.from('bigcommerce_configs').insert({
              store_id: storeId,
              merchant_id: merchantId,
              test_mode: true,
            });
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          store_hash: storeHash,
          mode: accessToken.startsWith('sim_') ? 'simulation' : 'live',
          webhooks: webhookResults,
          script: scriptResult,
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
        .select('id, store_hash, shop_domain, active, installed_at, scope, access_token, webhook_registered, uninstalled, token_updated_at')
        .eq('merchant_id', merchant?.id || '')
        .eq('uninstalled', false);

      return new Response(
        JSON.stringify({ success: true, stores: stores || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Save Everpay config for BC store ──
    if (action === 'save_config') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Missing authorization');

      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) throw new Error('Unauthorized');

      const { store_id, everpay_public_key, everpay_secret, test_mode, button_text, button_bg_color, button_text_color, header_text, checkout_script_enabled } = body;

      const { data: store } = await supabase
        .from('bigcommerce_stores')
        .select('id, merchant_id')
        .eq('id', store_id)
        .single();

      if (!store) throw new Error('Store not found');

      // Verify ownership
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('id', store.merchant_id)
        .eq('user_id', user.id)
        .single();

      if (!merchant) throw new Error('Unauthorized');

      await supabase.from('bigcommerce_configs').upsert({
        store_id,
        merchant_id: merchant.id,
        everpay_public_key: everpay_public_key ?? null,
        everpay_secret_encrypted: everpay_secret ?? null,
        test_mode: test_mode ?? true,
        button_text: button_text ?? 'Pay with Everpay',
        button_bg_color: button_bg_color ?? '#0052cc',
        button_text_color: button_text_color ?? '#ffffff',
        header_text: header_text ?? 'Pay securely with Everpay',
        checkout_script_enabled: checkout_script_enabled ?? true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'store_id' });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Get config ──
    if (action === 'get_config') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Missing authorization');

      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) throw new Error('Unauthorized');

      const { store_id } = body;

      const { data: config } = await supabase
        .from('bigcommerce_configs')
        .select('*')
        .eq('store_id', store_id)
        .single();

      return new Response(
        JSON.stringify({ success: true, config }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Get public key (for checkout widget - no auth required) ──
    if (action === 'get_public_key') {
      const { store_hash } = body;
      if (!store_hash) throw new Error('Missing store_hash');

      const { data: store } = await supabase
        .from('bigcommerce_stores')
        .select('id')
        .eq('store_hash', store_hash)
        .eq('active', true)
        .single();

      if (!store) throw new Error('Store not found');

      const { data: config } = await supabase
        .from('bigcommerce_configs')
        .select('everpay_public_key, test_mode, button_text, button_bg_color, button_text_color, header_text')
        .eq('store_id', store.id)
        .single();

      const baseUrl = config?.test_mode
        ? 'https://sandbox.everpayinc.com'
        : 'https://api.everpayinc.com';

      return new Response(
        JSON.stringify({
          success: true,
          public_key: config?.everpay_public_key || null,
          base_url: baseUrl,
          theme: {
            button_text: config?.button_text || 'Pay with Everpay',
            button_bg_color: config?.button_bg_color || '#0052cc',
            button_text_color: config?.button_text_color || '#ffffff',
            header_text: config?.header_text || 'Pay securely with Everpay',
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Refresh BigCommerce token ──
    if (action === 'refresh_token') {
      const { store_hash } = body;
      const bcClientId = Deno.env.get('BIGCOMMERCE_CLIENT_ID');
      const bcClientSecret = Deno.env.get('BIGCOMMERCE_CLIENT_SECRET');

      if (!bcClientId || !bcClientSecret) {
        throw new Error('BigCommerce credentials not configured');
      }

      const { data: store } = await supabase
        .from('bigcommerce_stores')
        .select('*')
        .eq('store_hash', store_hash)
        .single();

      if (!store?.refresh_token) {
        throw new Error('No refresh token available');
      }

      const tokenResp = await fetch('https://login.bigcommerce.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: bcClientId,
          client_secret: bcClientSecret,
          refresh_token: store.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const tokenData = await tokenResp.json();
      if (!tokenResp.ok) {
        throw new Error(`Token refresh failed: ${JSON.stringify(tokenData)}`);
      }

      await supabase
        .from('bigcommerce_stores')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || store.refresh_token,
          token_updated_at: new Date().toISOString(),
        })
        .eq('store_hash', store_hash);

      return new Response(
        JSON.stringify({ success: true, message: 'Token refreshed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Register webhooks manually ──
    if (action === 'register_webhooks') {
      const { store_hash } = body;

      const { data: store } = await supabase
        .from('bigcommerce_stores')
        .select('access_token')
        .eq('store_hash', store_hash)
        .single();

      if (!store?.access_token || store.access_token.startsWith('sim_')) {
        throw new Error('No valid access token for webhook registration');
      }

      const results = await registerBCWebhooks(store_hash, store.access_token, supabaseUrl);

      await supabase
        .from('bigcommerce_stores')
        .update({ webhook_registered: true })
        .eq('store_hash', store_hash);

      return new Response(
        JSON.stringify({ success: true, webhooks: results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Handle uninstall ──
    if (action === 'uninstall') {
      const { store_hash } = body;

      await supabase
        .from('bigcommerce_stores')
        .update({
          active: false,
          uninstalled: true,
          webhook_registered: false,
        })
        .eq('store_hash', store_hash);

      // Log the uninstall event
      const { data: store } = await supabase
        .from('bigcommerce_stores')
        .select('id')
        .eq('store_hash', store_hash)
        .single();

      if (store) {
        await supabase.from('bigcommerce_webhook_logs').insert({
          store_id: store.id,
          source: 'bigcommerce',
          event_type: 'app/uninstalled',
          payload: { store_hash, uninstalled_at: new Date().toISOString() },
          processed: true,
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Store uninstalled and cleaned up' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Get webhook logs ──
    if (action === 'get_webhook_logs') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Missing authorization');

      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) throw new Error('Unauthorized');

      const { store_id } = body;

      const { data: logs } = await supabase
        .from('bigcommerce_webhook_logs')
        .select('*')
        .eq('store_id', store_id)
        .order('created_at', { ascending: false })
        .limit(100);

      return new Response(
        JSON.stringify({ success: true, logs: logs || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Get BC orders for a store ──
    if (action === 'get_orders') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Missing authorization');

      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) throw new Error('Unauthorized');

      const { store_id } = body;

      const { data: orders } = await supabase
        .from('bigcommerce_orders')
        .select('*')
        .eq('store_id', store_id)
        .order('created_at', { ascending: false })
        .limit(100);

      return new Response(
        JSON.stringify({ success: true, orders: orders || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error('BigCommerce OAuth error:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
