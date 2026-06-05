// ValensPay edge function — allow-listed proxy. Ported from Everpay Platform OS.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { valensFetch } from "../_shared/valenspay.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const ALLOWED = new Set<string>([
  'banking/{customerId}/create-internal-transfer',
  'banking/{customerId}/create-external-transfer',
  'banking/{customerId}/create-transaction-deposit',
  'banking/{customerId}/find-customer-transactions',
  'banking/{customerId}/transaction-detail/{transactionId}',
  'banking/find-transaction-detail/{transactionId}',
  'banking/{customerId}/cancel-customer-transaction/{transactionId}',
  'banking/{customerId}/create-customer-FX-conversion',
  'banking/{customerId}/get-customer-FX-conversion/{transactionId}',
  'beneficiary/customer-beneficiaries/{customerId}',
  'beneficiary/create-individual-beneficiary/{customerId}',
  'beneficiary/create-company-beneficiary/{customerId}',
  'beneficiary/{beneficiaryId}/beneficiary-detail/{customerId}',
  'payment-gateway-6/create-customer',
  'payment-gateway-6/update-customer/{customerId}',
  'payment-gateway-6/customer',
  'payment-gateway-6/customer_by_phone',
  'payment-gateway-6/{customerId}/request-transfer',
  'payment-gateway-6/{customerId}/find-payment-transactions',
  'payment-gateway-6/{customerId}/payment-transaction-detail/{orderId}',
  'payment-gateway-6/payment-detail/{correlationId}',
  'payment-gateway-6/{customerId}/chargeback-counter-info/{orderIdOrCorrelationId}',
  'payment-gateway-6/configure-payment-network',
  'payment-gateway-6/TransactionReport',
  'partner-setting/update-callback-url',
  'partner-setting/get-callback-url',
]);

function fillTemplate(tmpl: string, params: Record<string, string>) {
  return tmpl.replace(/\{(\w+)\}/g, (_, k) => {
    const v = params[k];
    if (!v) throw new Error(`Missing path parameter: ${k}`);
    return encodeURIComponent(v);
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ error: 'Unauthorized' }, 401);

    const { template, method = 'POST', params = {}, body = null } = await req.json().catch(() => ({}));
    if (!template || !ALLOWED.has(template)) return json({ error: 'Path not allowed' }, 400);

    const path = fillTemplate(template, params);
    const { res, data } = await valensFetch(path, {
      method,
      body: body == null || method === 'GET' ? undefined : JSON.stringify(body),
    });
    return json(data, res.status);
  } catch (e: any) {
    console.error('valenspay error:', e);
    return json({ error: e?.message || 'Internal error' }, 500);
  }
});