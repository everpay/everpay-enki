import { supabase } from '@/integrations/supabase/client';

export type TokenEventType =
  | 'token.created'
  | 'token.used'
  | 'token.expired'
  | 'token.revoked'
  | 'token.rotated'
  | 'token.reactivated';

export async function logTokenEvent(
  tokenId: string,
  eventType: TokenEventType,
  merchantId?: string,
  metadata: Record<string, unknown> = {}
) {
  const { error } = await supabase.from('token_events').insert({
    token_id: tokenId,
    event_type: eventType,
    merchant_id: merchantId,
    metadata,
  } as any);

  if (error) throw new Error(`Failed to log token event: ${error.message}`);
}

export async function getTokenEvents(tokenId: string) {
  const { data, error } = await supabase
    .from('token_events' as any)
    .select('*')
    .eq('token_id', tokenId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
