import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-shop-domain, x-shopify-topic',
};

/**
 * Shopify App Uninstall Webhook
 *
 * Handles the app/uninstalled topic:
 * - Marks store as uninstalled
 * - Clears sensitive tokens
 * - Logs the event
 */

async function verifyShopifyHmac(rawBody: string, hmac: string | null, secret: string): Promise<boolean> {
  if (!hmac) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const digest = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return digest === hmac;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const shopDomain = req.headers.get('x-shopify-shop-domain') || '';
    const shopifyHmac = req.headers.get('x-shopify-hmac-sha256') || null;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to verify HMAC using the Shopify API secret
    const shopifyApiSecret = Deno.env.get('SHOPIFY_API_SECRET');
    if (shopifyApiSecret && shopifyHmac) {
      const valid = await verifyShopifyHmac(rawBody, shopifyHmac, shopifyApiSecret);
      if (!valid) {
        console.error('Invalid HMAC on uninstall webhook for', shopDomain);
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Mark store as uninstalled + clear tokens
    const { error } = await supabase
      .from('shopify_stores')
      .update({
        uninstalled: true,
        access_token: null,
        encrypted_token: null,
        iv: null,
        auth_tag: null,
      })
      .eq('shop_domain', shopDomain);

    if (error) {
      console.error('Failed to mark store as uninstalled:', error);
    } else {
      console.log(`Shopify store ${shopDomain} marked as uninstalled, tokens cleared`);
    }

    // Log the event
    await supabase.from('event_logs').insert({
      event_type: 'shopify.app_uninstalled',
      source_service: 'shopify-uninstall',
      payload: { shop: shopDomain, timestamp: new Date().toISOString() },
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Shopify uninstall webhook error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
