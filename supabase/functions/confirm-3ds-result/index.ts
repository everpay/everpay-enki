import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_STATUS = new Set(['completed', 'failed']);
const STR_MAX = 512;

type FieldError = { field: string; code: string; message: string };

interface ParsedBody {
  transaction_id: string;
  status: 'completed' | 'failed';
  transaction_reference?: string;
  error_code?: string;
  error_message?: string;
  raw_status?: string;
}

function validatePayload(raw: unknown): { ok: true; data: ParsedBody } | { ok: false; errors: FieldError[] } {
  const errors: FieldError[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, errors: [{ field: '_root', code: 'invalid_body', message: 'Request body must be a JSON object' }] };
  }
  const body = raw as Record<string, unknown>;

  const transaction_id = body.transaction_id;
  if (typeof transaction_id !== 'string' || !transaction_id.trim()) {
    errors.push({ field: 'transaction_id', code: 'required', message: 'transaction_id is required' });
  } else if (!UUID_RE.test(transaction_id.trim())) {
    errors.push({ field: 'transaction_id', code: 'invalid_format', message: 'transaction_id must be a UUID' });
  }

  const status = body.status;
  if (typeof status !== 'string' || !ALLOWED_STATUS.has(status)) {
    errors.push({ field: 'status', code: 'invalid_enum', message: `status must be one of: ${[...ALLOWED_STATUS].join(', ')}` });
  }

  const optStr = (key: string, max = STR_MAX) => {
    const v = body[key];
    if (v === undefined || v === null) return undefined;
    if (typeof v !== 'string') {
      errors.push({ field: key, code: 'invalid_type', message: `${key} must be a string` });
      return undefined;
    }
    if (v.length > max) {
      errors.push({ field: key, code: 'too_long', message: `${key} must be <= ${max} chars` });
      return undefined;
    }
    return v.trim() || undefined;
  };

  const transaction_reference = optStr('transaction_reference', 256);
  const error_code = optStr('error_code', 64);
  const error_message = optStr('error_message', 1024);
  const raw_status = optStr('raw_status', 64);

  if (status === 'failed' && !error_code && !error_message) {
    errors.push({ field: 'error_message', code: 'required_for_failed', message: 'error_code or error_message is required when status="failed"' });
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      transaction_id: (transaction_id as string).trim(),
      status: status as 'completed' | 'failed',
      transaction_reference,
      error_code,
      error_message,
      raw_status,
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  let raw: unknown = null;
  try { raw = await req.json(); } catch {
    return json({ error: 'Invalid JSON body', errors: [{ field: '_root', code: 'invalid_json', message: 'Body is not valid JSON' }] }, 400);
  }

  const parsed = validatePayload(raw);
  if (!parsed.ok) {
    return json({
      error: 'Validation failed',
      errors: parsed.errors,
      fieldErrors: Object.fromEntries(parsed.errors.map((e) => [e.field, e.message])),
    }, 422);
  }

  const { transaction_id, status, transaction_reference, error_code, error_message, raw_status } = parsed.data;

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: tx, error } = await supabase
      .from('transactions')
      .select('id, merchant_id, provider, provider_ref, status, metadata')
      .eq('id', transaction_id)
      .maybeSingle();

    if (error) {
      console.error('confirm-3ds-result db error:', error);
      return json({ error: 'Database lookup failed', details: error.message }, 500);
    }
    if (!tx) {
      return json({ error: 'Transaction not found', errors: [{ field: 'transaction_id', code: 'not_found', message: 'No transaction matches this id' }] }, 404);
    }

    const metadata = (tx.metadata || {}) as Record<string, any>;
    const expectedRef = tx.provider_ref || metadata.provider_response?.transaction_reference;

    if (tx.status === status) {
      return json({ success: true, status: tx.status, transaction_id: tx.id, idempotent: true });
    }
    if (tx.status === 'completed' || tx.status === 'failed') {
      return json({ success: true, status: tx.status, transaction_id: tx.id, note: 'Transaction already finalized; ignoring late 3DS callback' });
    }

    if (status === 'completed' && expectedRef && transaction_reference && String(transaction_reference) !== String(expectedRef)) {
      return json({
        error: '3DS reference mismatch',
        errors: [{ field: 'transaction_reference', code: 'mismatch', message: `transaction_reference does not match the original payment intent (expected ${String(expectedRef).slice(0, 12)}...)` }],
        expected_reference_prefix: String(expectedRef).slice(0, 12),
      }, 422);
    }

    const nextStatus = status;
    const nextMeta = {
      ...metadata,
      threeds_status: nextStatus === 'completed' ? 'completed' : 'failed',
      threeds_challenge_status: nextStatus,
      threeds_completed_at: new Date().toISOString(),
      threeds_result: { status, transaction_reference, error_code, error_message, raw_status },
      last_status_source: 'confirm_3ds_result',
      last_status_reason: nextStatus === 'completed' ? '3DS authentication completed' : (error_message || error_code || '3DS authentication failed'),
    };

    const { error: updateError } = await supabase
      .from('transactions')
      .update({ status: nextStatus, metadata: nextMeta, updated_at: new Date().toISOString() })
      .eq('id', tx.id);
    if (updateError) {
      console.error('confirm-3ds-result update error:', updateError);
      return json({ error: 'Failed to update transaction', details: updateError.message }, 500);
    }

    await supabase.from('provider_events').insert({
      merchant_id: tx.merchant_id,
      transaction_id: tx.id,
      provider: tx.provider || 'unknown',
      event_type: nextStatus === 'completed' ? '3ds.completed' : '3ds.failed',
      payload: { transaction_reference, status, error_code, error_message, raw_status, expected_reference: expectedRef },
    });

    return json({ success: true, status: nextStatus, transaction_id: tx.id });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' ? (err.message || err.error_description || err.details || JSON.stringify(err)) : String(err));
    console.error('confirm-3ds-result error:', message, err);
    return json({ error: message || 'Unexpected error' }, 500);
  }
});