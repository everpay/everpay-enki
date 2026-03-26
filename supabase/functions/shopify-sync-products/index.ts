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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { store_id, merchant_id } = body;

    if (!store_id || !merchant_id) {
      return new Response(JSON.stringify({ error: 'store_id and merchant_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get store with access token
    const { data: store, error: storeErr } = await supabase
      .from('shopify_stores')
      .select('shop_domain, access_token')
      .eq('id', store_id)
      .eq('merchant_id', merchant_id)
      .single();

    if (storeErr || !store) {
      return new Response(JSON.stringify({ error: 'Store not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!store.access_token) {
      return new Response(JSON.stringify({ error: 'No access token. Connect via OAuth first.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate token format - shpat_ = valid OAuth token, shpss_ = API secret (wrong)
    if (store.access_token.startsWith('shpss_')) {
      return new Response(JSON.stringify({ 
        error: 'Invalid token: the stored value is your App Secret, not an OAuth access token. Please re-connect your store via the OAuth flow to obtain a valid access token (shpat_...).' 
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch products from Shopify
    const shopDomain = store.shop_domain;
    const productsRes = await fetch(
      `https://${shopDomain}/admin/api/2025-01/products.json?limit=250&fields=id,title,body_html,product_type,variants,images,tags,status`,
      {
        headers: {
          'X-Shopify-Access-Token': store.access_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!productsRes.ok) {
      const errText = await productsRes.text();
      console.error('Shopify API error:', errText);
      // Parse the actual Shopify error message
      let shopifyError = 'Failed to fetch products from Shopify';
      try {
        const errJson = JSON.parse(errText);
        shopifyError = typeof errJson.errors === 'string' ? errJson.errors : JSON.stringify(errJson.errors);
      } catch { shopifyError = errText || shopifyError; }
      return new Response(JSON.stringify({ error: shopifyError }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { products: shopifyProducts } = await productsRes.json();

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const sp of shopifyProducts) {
      try {
        // Use first variant for price/sku/inventory
        const variant = sp.variants?.[0];
        const price = variant ? parseFloat(variant.price) : 0;
        const sku = variant?.sku || '';
        const stock = variant?.inventory_quantity ?? 0;
        const imageUrl = sp.images?.[0]?.src || null;

        // Check if product already imported (by metadata.shopify_product_id)
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('merchant_id', merchant_id)
          .eq('sku', `shopify_${sp.id}`)
          .maybeSingle();

        const productData: Record<string, any> = {
          merchant_id,
          name: sp.title,
          description: sp.body_html?.replace(/<[^>]*>/g, '').slice(0, 500) || '',
          price,
          stock: stock > 0 ? stock : 0,
          sku: `shopify_${sp.id}`,
          category: sp.product_type || 'Imported',
          product_type: 'physical',
          image_url: imageUrl,
          metadata: {
            shopify_product_id: String(sp.id),
            shopify_store_id: store_id,
            shopify_tags: sp.tags,
            shopify_status: sp.status,
            variant_count: sp.variants?.length || 0,
          },
        };

        if (existing) {
          // Update existing
          await supabase.from('products').update(productData).eq('id', existing.id);
          skipped++;
        } else {
          // Insert new
          await supabase.from('products').insert(productData);
          imported++;
        }
      } catch (err) {
        console.error('Product import error:', err);
        errors++;
      }
    }

    // Also sync to shopify_products table for reference
    for (const sp of shopifyProducts) {
      const variant = sp.variants?.[0];
      await supabase.from('shopify_products').upsert({
        store_id,
        shopify_product_id: String(sp.id),
        title: sp.title,
        price: variant ? parseFloat(variant.price) : 0,
      }, { onConflict: 'store_id,shopify_product_id' }).select();
    }

    return new Response(JSON.stringify({
      success: true,
      total: shopifyProducts.length,
      imported,
      updated: skipped,
      errors,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sync products error:', error);
    return new Response(JSON.stringify({ error: 'An internal error occurred' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
