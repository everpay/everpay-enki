// Unit white-label JWT issuer for the embedded <unit-elements-white-label-app> component.
// The Unit dashboard ("Custom" identity provider) is configured with this project's
// JWKS URL and JWT issuer, so the same Supabase user JWT can be exchanged here for
// a short-lived Unit-scoped JWT signed against the Unit JWT settings.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const clean = pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('pkcs8', der.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthenticated' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const issuer = Deno.env.get('UNIT_JWT_ISSUER') || 'https://enki.everpayinc.com';
    const audience = Deno.env.get('UNIT_JWT_AUDIENCE') || 'unit';
    const privateKeyPem = Deno.env.get('UNIT_JWT_PRIVATE_KEY');
    if (!privateKeyPem) {
      return new Response(JSON.stringify({
        error: 'UNIT_JWT_PRIVATE_KEY not configured',
        help: 'Generate an RSA keypair, paste the public key (PEM body, no BEGIN/END lines) into Unit dashboard → Settings → Identity Provider → Custom → Public Key, set JWT Issuer to UNIT_JWT_ISSUER, then store the private key as UNIT_JWT_PRIVATE_KEY in Lovable Cloud secrets.',
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const key = await importPrivateKey(privateKeyPem);
    const jwt = await create(
      { alg: 'RS256', typ: 'JWT' },
      {
        iss: issuer,
        aud: audience,
        sub: user.id,
        email: user.email,
        scope: 'orgs customers accounts payments',
        iat: getNumericDate(0),
        exp: getNumericDate(60 * 30),
      },
      key,
    );
    return new Response(JSON.stringify({ jwt, issuer, audience, expires_in: 1800 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('unit-jwt error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});