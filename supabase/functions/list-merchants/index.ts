import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Auth required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Decode the JWT to get the user ID (the JWT is from the external DB, but user_roles are on local DB)
    // We check user_roles on the local DB using the sub claim
    const token = authHeader.replace('Bearer ', '')
    let callerId: string | null = null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      callerId = payload.sub
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!callerId) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: callerRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)

    const isAdmin = callerRoles?.some(r => r.role === 'super_admin' || r.role === 'admin')
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Fetch all merchants from local DB using service role (bypasses RLS)
    const { data: merchants, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, name, user_id, email, phone, created_at')
      .order('created_at', { ascending: false })

    if (merchantError) throw merchantError

    // Fetch merchant profiles
    const merchantIds = (merchants || []).map(m => m.id)
    let profileMap: Record<string, any> = {}

    if (merchantIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('merchant_profiles')
        .select('merchant_id, onboarding_status, business_type, business_category')
        .in('merchant_id', merchantIds)

      profiles?.forEach(p => { profileMap[p.merchant_id] = p })
    }

    // Also try to fetch from external DB if configured
    const externalUrl = 'https://dhobjuetzkvnkdoqeavy.supabase.co'
    const externalServiceKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')
    
    let externalMerchants: any[] = []
    if (externalServiceKey) {
      try {
        const externalClient = createClient(externalUrl, externalServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })
        const { data: extMerchants } = await externalClient
          .from('merchants')
          .select('id, name, user_id, email, phone, created_at')
          .order('created_at', { ascending: false })

        if (extMerchants) {
          // Deduplicate by email
          const localEmails = new Set((merchants || []).map(m => m.email).filter(Boolean))
          externalMerchants = extMerchants.filter(m => !localEmails.has(m.email))
        }
      } catch (e) {
        console.error('External DB fetch failed:', e)
      }
    }

    const allMerchants = [...(merchants || []), ...externalMerchants].map(m => ({
      ...m,
      profile: profileMap[m.id] || null,
      source: externalMerchants.includes(m) ? 'platform' : 'local',
    }))

    return new Response(
      JSON.stringify({ merchants: allMerchants }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
