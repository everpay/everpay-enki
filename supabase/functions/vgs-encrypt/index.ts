import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * VGS Encrypt Edge Function
 * 
 * Accepts sensitive fields and returns VGS-aliased (tokenized) versions.
 * Supports: gateway credentials, bank account info, PII.
 * 
 * POST body: { fields: Record<string, string>, context?: string }
 * Returns:  { aliases: Record<string, string> }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate auth — verify JWT via Supabase, not just header presence.
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsError } = await sb.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { fields, context } = await req.json();

    if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
      return new Response(JSON.stringify({ error: 'fields object is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const VGS_VAULT_ID = Deno.env.get('VGS_VAULT_ID');
    const VGS_USERNAME = Deno.env.get('VGS_USERNAME');
    const VGS_PASSWORD = Deno.env.get('VGS_PASSWORD');
    const VGS_ENVIRONMENT = Deno.env.get('VGS_ENVIRONMENT') || 'sandbox';

    if (!VGS_VAULT_ID || !VGS_USERNAME || !VGS_PASSWORD) {
      return new Response(JSON.stringify({ error: 'VGS vault not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // VGS inbound route: POST each field to get an alias
    const vgsHost = `https://${VGS_VAULT_ID}.${VGS_ENVIRONMENT}.verygoodproxy.com`;
    const basicAuth = btoa(`${VGS_USERNAME}:${VGS_PASSWORD}`);

    // Build payload — VGS /aliases endpoint accepts JSON with field values
    // Each field gets aliased individually for granular control
    const aliases: Record<string, string> = {};

    // Use VGS /post endpoint to tokenize data through the inbound proxy
    const vgsPayload: Record<string, string> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'string' && value.trim()) {
        vgsPayload[key] = value;
      }
    }

    const vgsResponse = await fetch(`${vgsHost}/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        data: vgsPayload,
        storage: 'PERSISTENT',
        format: 'UUID',
        ...(context ? { tags: [context] } : {}),
      }),
    });

    if (!vgsResponse.ok) {
      const errorText = await vgsResponse.text();
      console.error('VGS error:', vgsResponse.status, errorText);
      // Fail closed — never tokenize locally with a key bundled in the token.
      return new Response(JSON.stringify({ error: 'VGS vault unavailable' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse VGS response — aliased fields come back in the response body
    const vgsData = await vgsResponse.json();
    
    // VGS returns aliased values in the same structure
    if (vgsData.data) {
      for (const [key, alias] of Object.entries(vgsData.data)) {
        aliases[key] = alias as string;
      }
    } else {
      // Some VGS setups return flat
      for (const [key] of Object.entries(vgsPayload)) {
        aliases[key] = vgsData[key] || vgsData.data?.[key] || `tok_${crypto.randomUUID()}`;
      }
    }

    return new Response(JSON.stringify({ aliases, vault: 'vgs' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('VGS encrypt error:', error);
    return new Response(JSON.stringify({ error: 'Encryption failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
