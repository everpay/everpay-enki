import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const VGS_VAULT_ID = Deno.env.get('VGS_VAULT_ID');
    const VGS_USERNAME = Deno.env.get('VGS_USERNAME');
    const VGS_PASSWORD = Deno.env.get('VGS_PASSWORD');

    if (!VGS_VAULT_ID) {
      return new Response(JSON.stringify({ error: 'VGS not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { action, data } = body;

    if (action === 'tokenize') {
      const vgsInboundUrl = `https://${VGS_VAULT_ID}.sandbox.verygoodproxy.com`;
      const response = await fetch(`${vgsInboundUrl}/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${VGS_USERNAME}:${VGS_PASSWORD}`)}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Tokenization failed' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const result = await response.json();
      return new Response(JSON.stringify({ success: true, tokens: result }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'detokenize') {
      const { destination_url, method = 'POST', payload, headers: customHeaders } = data;
      if (!destination_url) {
        return new Response(JSON.stringify({ error: 'destination_url required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // SSRF guard — only allow https requests to a small allowlist of
      // payment-processor hostnames. Reject everything else (file://, internal
      // IPs, cloud metadata, etc).
      const ALLOWED_HOSTS = new Set<string>([
        'sandbox.verygoodvault.com',
        'live.verygoodvault.com',
        'api.everpayinc.com',
        'sandbox.shieldhubpay.com',
        'api.shieldhubpay.com',
        'sandbox.paco-pay.com',
        'api.paco-pay.com',
        'sandboxwebapi.paygate10.com',
        'api.paygate10.com',
        'server-to-server.getmondo.co',
        'api-dev.lipad.io',
        'api.lipad.io',
        'apiv3.elektropay.com',
      ]);
      let parsed: URL;
      try { parsed = new URL(destination_url); } catch {
        return new Response(JSON.stringify({ error: 'Invalid destination_url' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) {
        return new Response(JSON.stringify({ error: 'Destination not allowed' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const safeMethod = String(method || 'POST').toUpperCase();
      if (!['GET','POST','PUT','PATCH','DELETE'].includes(safeMethod)) {
        return new Response(JSON.stringify({ error: 'Invalid method' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const response = await fetch(parsed.toString(), {
        method: safeMethod,
        headers: { 'Content-Type': 'application/json', ...customHeaders },
        body: safeMethod === 'GET' ? undefined : JSON.stringify(payload),
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Outbound request failed' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const result = await response.json();
      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'health') {
      return new Response(JSON.stringify({ success: true, vault_id: VGS_VAULT_ID, status: 'connected', environment: 'sandbox' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: tokenize, detokenize, health' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('VGS proxy error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
