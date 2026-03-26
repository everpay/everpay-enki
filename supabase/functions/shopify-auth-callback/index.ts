import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * Shopify OAuth Callback Handler (GET)
 *
 * Shopify redirects here after merchant approves the app.
 * This function:
 *   1. Verifies HMAC
 *   2. Exchanges code for access token
 *   3. Encrypts & stores the token
 *   4. Registers webhooks
 *   5. Redirects merchant back to the app dashboard
 */

const PRODUCTION_APP_URL = 'https://everpayinc.com';
const FALLBACK_APP_URL = 'https://everpay-os.lovable.app';

// ── AES-256-GCM helpers ──

async function getEncryptionKey(): Promise<CryptoKey> {
  const raw = Deno.env.get('SHOPIFY_ENCRYPTION_KEY');
  const keyBytes = raw
    ? new Uint8Array(raw.match(/.{1,2}/g)!.map(b => parseInt(b, 16)))
    : crypto.getRandomValues(new Uint8Array(32));
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptToken(plaintext: string): Promise<{ encrypted: string; iv: string; tag: string }> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const cipher = new Uint8Array(cipherBuf);
  const encryptedBytes = cipher.slice(0, cipher.length - 16);
  const tagBytes = cipher.slice(cipher.length - 16);
  return {
    encrypted: toHex(encryptedBytes),
    iv: toHex(iv),
    tag: toHex(tagBytes),
  };
}

function toHex(buf: Uint8Array): string {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}
function fromHex(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
}

function normalizeShopDomain(shop: string): string {
  return shop.trim().replace(/^https?:\/\//i, '').replace(/\/.*/, '').toLowerCase();
}

function isValidShopDomain(shop: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(shop);
}

// ── HMAC verification ──

async function verifyHmac(params: URLSearchParams, secret: string): Promise<boolean> {
  const hmac = params.get('hmac');
  if (!hmac) return false;

  const entries: [string, string][] = [];
  params.forEach((value, key) => {
    if (key !== 'hmac' && key !== 'signature') {
      entries.push([key, value]);
    }
  });
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  const message = entries.map(([k, v]) => `${k}=${v}`).join('&');

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  const digest = toHex(new Uint8Array(sig));
  return digest === hmac;
}

// ── Webhook auto-registration ──

async function registerWebhooks(shop: string, accessToken: string, hostUrl: string) {
  const topics = [
    { topic: 'app/uninstalled', address: `${hostUrl}/functions/v1/shopify-uninstall` },
    { topic: 'orders/create', address: `${hostUrl}/functions/v1/shopify-refund-webhook` },
    { topic: 'refunds/create', address: `${hostUrl}/functions/v1/shopify-refund-webhook` },
    { topic: 'disputes/create', address: `${hostUrl}/functions/v1/shopify-refund-webhook` },
  ];

  for (const wh of topics) {
    try {
      await fetch(`https://${shop}/admin/api/2025-01/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhook: { topic: wh.topic, address: wh.address, format: 'json' } }),
      });
    } catch (err) {
      console.error(`Failed to register webhook ${wh.topic}:`, err);
    }
  }
}

serve(async (req) => {
  const url = new URL(req.url);

  // Handle GET requests (Shopify OAuth redirect)
  if (req.method === 'GET') {
    const params = url.searchParams;
    const shop = params.get('shop');
    const code = params.get('code');
    const state = params.get('state');

    // Determine where to redirect the merchant after completion
    const appUrl = PRODUCTION_APP_URL;
    const dashboardUrl = `${appUrl}/shopify`;

    if (!shop || !code) {
      return Response.redirect(`${dashboardUrl}?error=missing_params`, 302);
    }

    const normalizedShop = normalizeShopDomain(shop);
    if (!isValidShopDomain(normalizedShop)) {
      return Response.redirect(`${dashboardUrl}?error=invalid_shop`, 302);
    }

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY') || '';
      const shopifyApiSecret = Deno.env.get('SHOPIFY_API_SECRET') || '';
      const appScopes = 'read_orders,write_orders,read_draft_orders,write_draft_orders,read_products,read_customers';

      // 1. Verify HMAC
      if (shopifyApiSecret && params.get('hmac')) {
        const valid = await verifyHmac(params, shopifyApiSecret);
        if (!valid) {
          console.error('HMAC validation failed for shop:', normalizedShop);
          return Response.redirect(`${dashboardUrl}?error=hmac_failed`, 302);
        }
      }

      // 2. Exchange code for access token
      let accessToken: string;
      let grantedScopes: string;

      if (shopifyApiKey && shopifyApiSecret) {
        const tokenRes = await fetch(`https://${normalizedShop}/admin/oauth/access_token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: shopifyApiKey,
            client_secret: shopifyApiSecret,
            code,
          }),
        });

        if (!tokenRes.ok) {
          const errText = await tokenRes.text();
          console.error('Token exchange failed:', errText);
          return Response.redirect(`${dashboardUrl}?error=token_exchange_failed`, 302);
        }

        const tokenData = await tokenRes.json();
        accessToken = tokenData.access_token;
        grantedScopes = tokenData.scope || appScopes;
      } else {
        // Simulation mode
        accessToken = `sim_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
        grantedScopes = appScopes;
      }

      // 3. Encrypt token
      const { encrypted, iv, tag } = await encryptToken(accessToken);

      // 4. Upsert store record
      const storeData: Record<string, any> = {
        shop_domain: normalizedShop,
        scope: grantedScopes,
        installed_at: new Date().toISOString(),
        encrypted_token: encrypted,
        iv,
        auth_tag: tag,
        uninstalled: false,
        access_token: accessToken,
      };

      // Try to find existing store by domain
      const { data: existingStore } = await supabase
        .from('shopify_stores')
        .select('id, merchant_id')
        .eq('shop_domain', normalizedShop)
        .order('installed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingStore) {
        await supabase
          .from('shopify_stores')
          .update(storeData)
          .eq('id', existingStore.id);
      } else {
        await supabase
          .from('shopify_stores')
          .insert(storeData);
      }

      // 5. Register webhooks
      if (shopifyApiKey && shopifyApiSecret) {
        await registerWebhooks(normalizedShop, accessToken, supabaseUrl);
      }

      // 6. Log the event
      await supabase.from('event_logs').insert({
        event_type: 'shopify.oauth_callback_success',
        source_service: 'shopify-auth-callback',
        payload: { shop: normalizedShop, mode: shopifyApiKey ? 'live' : 'simulation' },
      });

      // 7. Redirect merchant back to app with success
      return Response.redirect(`${dashboardUrl}?shop=${encodeURIComponent(normalizedShop)}&connected=true`, 302);

    } catch (err) {
      console.error('OAuth callback error:', err);
      return Response.redirect(`${dashboardUrl}?error=server_error`, 302);
    }
  }

  // Handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
});
