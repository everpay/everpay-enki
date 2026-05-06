import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GATEWAY = Deno.env.get("EVERPAY_OS_GATEWAY_URL") || ""
const GATEWAY_TOKEN = Deno.env.get("PLATFORM_OS_ADMIN_TOKEN") || ""
async function gw(op: string, params: Record<string, unknown> = {}) {
  if (!GATEWAY || !GATEWAY_TOKEN) return { skipped: true }
  const r = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${GATEWAY_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ op, params, actor: "create-merchant-user" }),
  })
  if (!r.ok) throw new Error(`gateway ${r.status}`)
  return await r.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // Decode caller from JWT (from external DB)
    const token = authHeader.replace('Bearer ', '')
    let callerId: string | null = null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      callerId = payload.sub
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verify admin role on local DB
    const { data: callerRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)

    const isAuthorized = callerRoles?.some(r => r.role === 'super_admin' || r.role === 'admin')
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Admin access required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const {
      business_name, contact_name, email, phone, website,
      business_type, business_category, business_description,
      tax_id, employee_count, annual_revenue,
      address, payment_setup
    } = body

    if (!business_name || !contact_name || !email || !phone) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: business_name, contact_name, email, phone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Creation now happens against the local Admin OS DB. Mirroring to the
    // external Everpay OS project is performed via the platform admin gateway
    // (no direct service-role exposure).
    const targetClient = supabaseAdmin

    const tempPassword = `Merchant${crypto.randomUUID().slice(0, 8)}!`
    const nameParts = contact_name.trim().split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || ''

    const { data: authData, error: authError } = await targetClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        display_name: contact_name,
        created_by: callerId,
      }
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = authData.user.id

    // Assign merchant role on local DB
    await supabaseAdmin.from('user_roles').insert({ user_id: userId, role: 'merchant' })

    // Create merchant record on local DB
    const { data: merchantRecord } = await supabaseAdmin.from('merchants').insert({
      name: business_name,
      email,
      phone,
      user_id: userId,
    }).select('id').single()

    // Create merchant_profile with onboarding data
    if (merchantRecord) {
      await supabaseAdmin.from('merchant_profiles').insert({
        merchant_id: merchantRecord.id,
        onboarding_status: 'pending',
        business_type: business_type || null,
        business_category: business_category || null,
        business_description: business_description || null,
        website: website || null,
        tax_id: tax_id || null,
        employee_count: employee_count || null,
        annual_revenue: annual_revenue || null,
        address: address ? JSON.stringify(address) : null,
        payment_setup: payment_setup ? JSON.stringify(payment_setup) : null,
      }).catch(e => console.error('Profile insert error:', e))
    }

    // Mirror merchant row to the external Everpay OS project via the gateway
    try {
      await gw("db.insert", {
        table: "merchants",
        data: { user_id: userId, name: business_name, email, phone },
      })
    } catch (mirrorErr) {
      console.error("Gateway mirror failed:", mirrorErr)
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: callerId!,
      action: 'merchant_user_created',
      entity_type: 'merchant',
      entity_id: userId,
      metadata: { business_name, email, business_type, business_category }
    })

    // Send onboarding email
    try {
      await supabaseAdmin.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'merchant-onboarding',
          recipientEmail: email,
          idempotencyKey: `merchant-onboarding-${userId}`,
          templateData: {
            merchantName: business_name,
            email,
            dashboardUrl: 'https://enki.everpayinc.com',
          },
        },
      })
    } catch (emailErr) {
      console.error('Onboarding email failed:', emailErr)
      // Don't fail the entire operation if email fails
    }

    // Send password reset so merchant can claim their account
    try {
      await targetClient.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: 'https://enki.everpayinc.com/reset-password',
        }
      })
    } catch (resetErr) {
      console.error('Password reset link generation failed:', resetErr)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        merchantId: merchantRecord?.id,
        message: 'Merchant created successfully. Onboarding invitation sent.'
      }),
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
