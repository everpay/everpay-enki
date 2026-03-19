import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * BIN Intelligence Lookup
 * Resolves card BIN (first 6 digits) to issuer, country, card type, and risk indicators.
 * Uses a built-in database of common BIN ranges for simulation.
 * Can be extended with live BIN API (e.g., binlist.net) when keys are configured.
 */

// Known BIN ranges for simulation
const BIN_DATABASE: Record<string, { brand: string; type: string; country: string; issuer: string; risk: string }> = {
  '4': { brand: 'Visa', type: 'credit', country: 'US', issuer: 'Various', risk: 'low' },
  '51': { brand: 'Mastercard', type: 'credit', country: 'US', issuer: 'Various', risk: 'low' },
  '52': { brand: 'Mastercard', type: 'credit', country: 'US', issuer: 'Various', risk: 'low' },
  '53': { brand: 'Mastercard', type: 'credit', country: 'US', issuer: 'Various', risk: 'low' },
  '54': { brand: 'Mastercard', type: 'credit', country: 'US', issuer: 'Various', risk: 'low' },
  '55': { brand: 'Mastercard', type: 'credit', country: 'US', issuer: 'Various', risk: 'low' },
  '34': { brand: 'Amex', type: 'credit', country: 'US', issuer: 'American Express', risk: 'low' },
  '37': { brand: 'Amex', type: 'credit', country: 'US', issuer: 'American Express', risk: 'low' },
  '6011': { brand: 'Discover', type: 'credit', country: 'US', issuer: 'Discover', risk: 'low' },
  '4000': { brand: 'Visa', type: 'debit', country: 'US', issuer: 'Test Bank', risk: 'low' },
  '4111': { brand: 'Visa', type: 'credit', country: 'US', issuer: 'Test Bank', risk: 'low' },
  '4242': { brand: 'Visa', type: 'credit', country: 'US', issuer: 'Test/Sandbox', risk: 'low' },
  '5200': { brand: 'Mastercard', type: 'debit', country: 'US', issuer: 'Test Bank', risk: 'low' },
  // High-risk BINs (prepaid, virtual)
  '4917': { brand: 'Visa', type: 'prepaid', country: 'US', issuer: 'Prepaid Issuer', risk: 'medium' },
  '4026': { brand: 'Visa', type: 'virtual', country: 'GB', issuer: 'Virtual Issuer', risk: 'high' },
  '5610': { brand: 'Mastercard', type: 'prepaid', country: 'NG', issuer: 'African Prepaid', risk: 'high' },
};

function lookupBIN(bin: string): { brand: string; type: string; country: string; issuer: string; risk: string } {
  // Try longest match first (4 digits, then 2, then 1)
  for (const len of [4, 2, 1]) {
    const prefix = bin.substring(0, len);
    if (BIN_DATABASE[prefix]) {
      return BIN_DATABASE[prefix];
    }
  }
  return { brand: 'Unknown', type: 'unknown', country: 'XX', issuer: 'Unknown', risk: 'medium' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bin } = await req.json();
    if (!bin || bin.length < 4) {
      return new Response(
        JSON.stringify({ error: 'BIN must be at least 4 digits' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanBin = bin.replace(/\D/g, '').substring(0, 6);
    const result = lookupBIN(cleanBin);

    // Calculate risk score based on card type
    let riskScore = 0;
    if (result.type === 'prepaid') riskScore += 30;
    if (result.type === 'virtual') riskScore += 40;
    if (result.risk === 'high') riskScore += 25;
    if (result.risk === 'medium') riskScore += 10;

    return new Response(
      JSON.stringify({
        success: true,
        bin: cleanBin,
        brand: result.brand,
        type: result.type,
        country: result.country,
        issuer: result.issuer,
        risk_level: result.risk,
        risk_score: riskScore,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('BIN lookup error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
