import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COURIER_API_URL = 'https://api.courier.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const COURIER_AUTH_TOKEN = Deno.env.get('COURIER_AUTH_TOKEN');
    if (!COURIER_AUTH_TOKEN) {
      throw new Error('COURIER_AUTH_TOKEN is not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case 'send': {
        const { recipientEmail, recipientPhone, recipientId, templateId, data: templateData, channel } = params;

        const body: Record<string, unknown> = {
          message: {
            to: {} as Record<string, unknown>,
            template: templateId,
            data: templateData || {},
          },
        };

        const to = body.message.to as Record<string, unknown>;
        if (recipientEmail) to.email = recipientEmail;
        if (recipientPhone) to.phone_number = recipientPhone;
        if (recipientId) to.user_id = recipientId;

        if (channel) {
          (body.message as Record<string, unknown>).routing = {
            method: 'single',
            channels: [channel],
          };
        }

        const response = await fetch(`${COURIER_API_URL}/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${COURIER_AUTH_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(`Courier send failed [${response.status}]: ${JSON.stringify(result)}`);
        }

        return new Response(JSON.stringify({ success: true, requestId: result.requestId }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'send_bulk': {
        const { recipients, templateId, data: templateData } = params;

        const messages = recipients.map((r: { email?: string; phone?: string; userId?: string; data?: Record<string, unknown> }) => ({
          to: {
            ...(r.email && { email: r.email }),
            ...(r.phone && { phone_number: r.phone }),
            ...(r.userId && { user_id: r.userId }),
          },
          template: templateId,
          data: { ...templateData, ...r.data },
        }));

        const response = await fetch(`${COURIER_API_URL}/bulk`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${COURIER_AUTH_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(`Courier bulk send failed [${response.status}]: ${JSON.stringify(result)}`);
        }

        return new Response(JSON.stringify({ success: true, ...result }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list_templates': {
        const response = await fetch(`${COURIER_API_URL}/notifications`, {
          headers: { 'Authorization': `Bearer ${COURIER_AUTH_TOKEN}` },
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(`Courier list failed [${response.status}]: ${JSON.stringify(result)}`);
        }

        return new Response(JSON.stringify(result), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Courier function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
