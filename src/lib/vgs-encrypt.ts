import { supabase } from '@/integrations/supabase/client';

/**
 * Encrypt sensitive fields via VGS before storing in the database.
 * Falls back to AES-256-GCM if VGS proxy is unreachable.
 * 
 * @param fields - Key-value pairs of sensitive data to encrypt
 * @param context - Optional tag for VGS (e.g. 'gateway_credentials', 'bank_account')
 * @returns Aliased/tokenized versions of each field
 */
export async function encryptWithVGS(
  fields: Record<string, string>,
  context?: string
): Promise<{ aliases: Record<string, string>; vault: string }> {
  const { data, error } = await supabase.functions.invoke('vgs-encrypt', {
    body: { fields, context },
  });

  if (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }

  return data as { aliases: Record<string, string>; vault: string };
}

/**
 * Encrypt only non-empty string values from an object.
 * Returns a new object with the same keys but encrypted values.
 */
export async function encryptFields(
  obj: Record<string, string>,
  context?: string
): Promise<Record<string, string>> {
  const nonEmpty: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.trim()) {
      nonEmpty[key] = value;
    }
  }

  if (Object.keys(nonEmpty).length === 0) return obj;

  const { aliases } = await encryptWithVGS(nonEmpty, context);
  return { ...obj, ...aliases };
}
