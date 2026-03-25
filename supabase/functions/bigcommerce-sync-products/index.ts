import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function stripHtml(text: string | null | undefined): string {
  return (text || '').replace(/<[^>]*>/g, '').trim().slice(0, 1000);
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
    const { store_id, merchant_id } = body;

    if (!store_id || !merchant_id) {
      return new Response(JSON.stringify({ error: 'store_id and merchant_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: store, error: storeError } = await supabase
      .from('bigcommerce_stores')
      .select('id, store_hash, access_token, merchant_id')
      .eq('id', store_id)
      .eq('merchant_id', merchant_id)
      .single();

    if (storeError || !store) {
      return new Response(JSON.stringify({ error: 'Store not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!store.access_token || store.access_token.startsWith('sim_')) {
      return new Response(JSON.stringify({ error: 'Store must be connected with a live OAuth token before importing products' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fetchedProducts: any[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const productsRes = await fetch(
        `https://api.bigcommerce.com/stores/${store.store_hash}/v3/catalog/products?limit=250&page=${page}&include=primary_image,variants`,
        {
          method: 'GET',
          headers: {
            'X-Auth-Token': store.access_token,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      if (!productsRes.ok) {
        const errText = await productsRes.text();
        console.error('BigCommerce products API error:', errText);
        return new Response(JSON.stringify({ error: 'Failed to fetch products from BigCommerce' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const payload = await productsRes.json();
      const pageData = payload?.data || [];
      fetchedProducts.push(...pageData);
      totalPages = payload?.meta?.pagination?.total_pages || 1;
      page += 1;
    } while (page <= totalPages);

    let imported = 0;
    let updated = 0;
    let errors = 0;

    for (const product of fetchedProducts) {
      try {
        const variant = product?.variants?.[0];
        const imageUrl = product?.primary_image?.url_standard || null;
        const price = Number(variant?.price ?? product?.price ?? 0);
        const stock = Number(variant?.inventory_level ?? product?.inventory_level ?? 0);

        const productData: Record<string, unknown> = {
          merchant_id,
          name: product?.name || `BigCommerce Product ${product?.id}`,
          description: stripHtml(product?.description),
          price: Number.isFinite(price) ? price : 0,
          stock: Number.isFinite(stock) ? stock : 0,
          sku: `bigcommerce_${product.id}`,
          category: 'Imported',
          product_type: 'physical',
          image_url: imageUrl,
          metadata: {
            source: 'bigcommerce',
            bigcommerce_product_id: String(product.id),
            bigcommerce_store_id: store_id,
            bigcommerce_store_hash: store.store_hash,
            bigcommerce_sku: variant?.sku || product?.sku || null,
            bigcommerce_status: product?.is_visible === false ? 'hidden' : 'visible',
            bigcommerce_variant_count: product?.variants?.length || 0,
          },
        };

        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('merchant_id', merchant_id)
          .eq('sku', `bigcommerce_${product.id}`)
          .maybeSingle();

        if (existing?.id) {
          const { error: updateErr } = await supabase
            .from('products')
            .update(productData)
            .eq('id', existing.id);

          if (updateErr) throw updateErr;
          updated += 1;
        } else {
          const { error: insertErr } = await supabase
            .from('products')
            .insert(productData);

          if (insertErr) throw insertErr;
          imported += 1;
        }
      } catch (productError) {
        errors += 1;
        console.error('Failed to import BigCommerce product:', productError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total: fetchedProducts.length,
      imported,
      updated,
      errors,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('BigCommerce sync products error:', error);
    return new Response(JSON.stringify({ error: 'An internal error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});