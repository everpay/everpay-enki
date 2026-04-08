import { supabase } from '@/integrations/supabase/client';
import { logTokenEvent } from './tokenEventService';

export type TokenStatus = 'active' | 'inactive' | 'expired' | 'revoked' | 'rotated';

export async function updateTokenStatus(tokenId: string, status: TokenStatus, merchantId?: string) {
  const { error } = await supabase
    .from('payment_methods')
    .update({ status } as any)
    .eq('id', tokenId);

  if (error) throw new Error(`Failed to update token status: ${error.message}`);

  await logTokenEvent(tokenId, `token.${status === 'active' ? 'reactivated' : status}` as any, merchantId, { new_status: status });
}

export async function revokeToken(tokenId: string, merchantId?: string, reason?: string) {
  await updateTokenStatus(tokenId, 'revoked', merchantId);
  await logTokenEvent(tokenId, 'token.revoked', merchantId, { reason: reason || 'manual_revocation' });
}

export async function rotateToken(
  oldTokenId: string,
  newVgsAlias: string,
  cardBrand?: string,
  cardLast4?: string,
  expMonth?: string,
  expYear?: string,
  merchantId?: string,
  customerId?: string
) {
  // Mark old as rotated
  await supabase
    .from('payment_methods')
    .update({ status: 'rotated' } as any)
    .eq('id', oldTokenId);

  // Create new token linked to old
  const { data: newToken, error } = await supabase
    .from('payment_methods')
    .insert({
      vgs_alias: newVgsAlias,
      card_brand: cardBrand,
      card_last4: cardLast4,
      exp_month: expMonth,
      exp_year: expYear,
      customer_id: customerId || '00000000-0000-0000-0000-000000000000',
      previous_token_id: oldTokenId,
      status: 'active',
      merchant_id: merchantId,
    } as any)
    .select()
    .single();

  if (error) throw new Error(`Token rotation failed: ${error.message}`);

  await logTokenEvent(oldTokenId, 'token.rotated', merchantId, { new_token_id: newToken.id });
  await logTokenEvent(newToken.id, 'token.created', merchantId, { rotated_from: oldTokenId });

  return newToken;
}

export async function recordTokenUsage(tokenId: string, merchantId?: string) {
  // Use the atomic increment function
  const { error } = await supabase.rpc('increment_usage_count', { token_id: tokenId });
  if (error) {
    // Fallback to manual update
    await supabase
      .from('payment_methods')
      .update({ last_used_at: new Date().toISOString(), usage_count: 1 } as any)
      .eq('id', tokenId);
  }
  await logTokenEvent(tokenId, 'token.used', merchantId);
}
