import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Shopify OAuth Install + Callback Flow
 *
 * Actions:
 *   install   → redirect merchant to Shopify OAuth consent screen
 *   callback  → verify HMAC, exchange code for token, encrypt & store, register webhooks
 */

// ── AES-256-GCM helpers (Web Crypto / Deno) ──

async function getEncryptionKey(): Promise<CryptoKey> {
  const raw = Deno.env.get('SHOPIFY_ENCRYPTION_KEY');
  // 32-byte hex key → 64 hex chars
  const keyBytes = raw
    ? new Uint8Array(raw.match(/.{1,2}/g)!.map(b => parseInt(b, 16)))
    : crypto.getRandomValues(new Uint8Array(32)); // fallback for dev
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptToken(plaintext: string): Promise<{ encrypted: string; iv: string; tag: string }> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  // AES-GCM appends 16-byte auth tag at the end
  const cipher = new Uint8Array(cipherBuf);
  const encryptedBytes = cipher.slice(0, cipher.length - 16);
  const tagBytes = cipher.slice(cipher.length - 16);
  return {
    encrypted: toHex(encryptedBytes),
    iv: toHex(iv),
    tag: toHex(tagBytes),
  };
}

async function decryptToken(encrypted: string, iv: string, tag: string): Promise<string> {
  const key = await getEncryptionKey();
  const cipherWithTag = new Uint8Array([...fromHex(encrypted), ...fromHex(tag)]);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromHex(iv) }, key, cipherWithTag);
  return new TextDecoder().decode(plainBuf);
}

function toHex(buf: Uint8Array): string {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}
function fromHex(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
}

function normalizeShopDomain(shop: string): string {
  return shop
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*/, '')
    .toLowerCase();
}

function isValidShopDomain(shop: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(shop);
}

// ── HMAC verification ──

async function verifyHmac(query: Record<string, string>, secret: string): Promise<boolean> {
  const { hmac, signature, ...rest } = query;
  if (!hmac) return false;
  const message = Object.keys(rest).sort().map(k => `${k}=${rest[k]}`).join('&');
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

  const results: any[] = [];
  for (const wh of topics) {
    try {
      const res = await fetch(`https://${shop}/admin/api/2025-01/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhook: { topic: wh.topic, address: wh.address, format: 'json' } }),
      });
      const data = await res.json();
      results.push({ topic: wh.topic, ok: res.ok, id: data?.webhook?.id });
    } catch (err) {
      results.push({ topic: wh.topic, ok: false, error: String(err) });
    }
  }
  return results;
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

    const shopifyApiKey = Deno.env.get('SHOPIFY_API_KEY') || '';
    const shopifyApiSecret = Deno.env.get('SHOPIFY_API_SECRET') || '';
    const appScopes = 'read_orders,write_orders,read_draft_orders,write_draft_orders,read_products,read_customers';

    // ── INSTALL: redirect URL ──
    if (action === 'install') {
      const { shop, redirect_uri } = body;
      if (!shop) throw new Error('shop is required');

      const normalizedShop = normalizeShopDomain(shop);
      if (!isValidShopDomain(normalizedShop)) {
        return new Response(JSON.stringify({ error: 'Invalid Shopify domain. Use format: your-store.myshopify.com' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!shopifyApiKey || !shopifyApiSecret) {
        // Simulation mode — just store the shop
        return new Response(JSON.stringify({
          success: true,
          mode: 'simulation',
          message: 'Shopify API credentials not configured. Store registered in simulation mode.',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const nonce = crypto.randomUUID();
      const installUrl = `https://${normalizedShop}/admin/oauth/authorize?client_id=${shopifyApiKey}&scope=${appScopes}&redirect_uri=${encodeURIComponent(redirect_uri || `${supabaseUrl}/functions/v1/shopify-oauth`)}&state=${nonce}`;

      return new Response(JSON.stringify({ success: true, install_url: installUrl, nonce }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── CALLBACK: verify HMAC, exchange code, encrypt token, register webhooks ──
    if (action === 'callback') {
      const { query, merchant_id } = body;
      // query = { code, hmac, shop, state, timestamp, ... }

      if (!query?.shop || !query?.code) {
        throw new Error('Missing shop or code in callback query');
      }

      const normalizedShop = normalizeShopDomain(query.shop);
      if (!isValidShopDomain(normalizedShop)) {
        return new Response(JSON.stringify({ error: 'Invalid Shopify domain in callback' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 1. HMAC verification
      if (shopifyApiSecret && query.hmac) {
        const valid = await verifyHmac(query, shopifyApiSecret);
        if (!valid) {
          return new Response(JSON.stringify({ error: 'HMAC validation failed' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      let accessToken: string;
      let grantedScopes: string;

      if (shopifyApiKey && shopifyApiSecret) {
        // 2. Exchange code for access token
        const tokenRes = await fetch(`https://${normalizedShop}/admin/oauth/access_token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: shopifyApiKey,
            client_secret: shopifyApiSecret,
            code: query.code,
          }),
        });

        if (!tokenRes.ok) {
          const errText = await tokenRes.text();
          throw new Error(`Token exchange failed: ${errText}`);
        }

        const tokenData = await tokenRes.json();
        accessToken = tokenData.access_token;
        grantedScopes = tokenData.scope || appScopes;
      } else {
        // Simulation mode
        accessToken = `sim_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
        grantedScopes = appScopes;
      }

      // 3. Encrypt token using AES-256-GCM
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
        // Store plaintext token for API calls (same as before for backwards compat)
        access_token: accessToken,
      };

      if (merchant_id) {
        storeData.merchant_id = merchant_id;
      }

      let targetStoreId: string | null = null;

      if (merchant_id) {
        const { data: merchantStore } = await supabase
          .from('shopify_stores')
          .select('id')
          .eq('merchant_id', merchant_id)
          .eq('shop_domain', normalizedShop)
          .order('installed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        targetStoreId = merchantStore?.id || null;
      }

      if (!targetStoreId) {
        const { data: domainStore } = await supabase
          .from('shopify_stores')
          .select('id, merchant_id')
          .eq('shop_domain', normalizedShop)
          .order('installed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (domainStore && (!merchant_id || domainStore.merchant_id === merchant_id)) {
          targetStoreId = domainStore.id;
        }
      }

      if (targetStoreId) {
        const { error: updateErr } = await supabase
          .from('shopify_stores')
          .update({
            ...storeData,
            merchant_id: merchant_id || storeData.merchant_id,
          })
          .eq('id', targetStoreId);

        if (updateErr) throw updateErr;
      } else {
        const { data: insertedStore, error: insertErr } = await supabase
          .from('shopify_stores')
          .insert(storeData)
          .select('id')
          .single();

        if (insertErr) throw insertErr;
        targetStoreId = insertedStore?.id || null;
      }

      if (merchant_id && targetStoreId) {
        // Clean up accidental duplicate rows for the same merchant + domain.
        await supabase
          .from('shopify_stores')
          .delete()
          .eq('merchant_id', merchant_id)
          .eq('shop_domain', normalizedShop)
          .neq('id', targetStoreId);
      }

      // 5. Register webhooks
      let webhookResults: any[] = [];
      if (shopifyApiKey && shopifyApiSecret) {
        webhookResults = await registerWebhooks(normalizedShop, accessToken, supabaseUrl);
      }

      return new Response(JSON.stringify({
        success: true,
        mode: shopifyApiKey ? 'live' : 'simulation',
        shop: normalizedShop,
        scopes: grantedScopes,
        webhooks_registered: webhookResults,
        token_encrypted: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── DECRYPT: retrieve plaintext token (internal use) ──
    if (action === 'decrypt_token') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Authorization required');

      const { data: { user }, error: userErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (userErr || !user) throw new Error('Unauthorized');

      const { store_id } = body;
      if (!store_id) throw new Error('store_id required');

      // Verify merchant ownership
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('Merchant not found');

      const { data: store } = await supabase
        .from('shopify_stores')
        .select('encrypted_token, iv, auth_tag')
        .eq('id', store_id)
        .eq('merchant_id', merchant.id)
        .single();

      if (!store?.encrypted_token || !store?.iv || !store?.auth_tag) {
        throw new Error('No encrypted token found');
      }

      const token = await decryptToken(store.encrypted_token, store.iv, store.auth_tag);

      return new Response(JSON.stringify({ success: true, access_token: token }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error('Shopify OAuth error:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
