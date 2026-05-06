// Shared ledger helper. Idempotent transaction + ledger_entries writes
// keyed by (provider, provider_ref) so retries never duplicate rows.
// The ledger_entries table requires transaction_id + account_id (uuid).
// We resolve / create a ledger_accounts row per (merchant_id, currency).
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export type LedgerWriteInput = {
  merchantId: string;
  provider: string;
  providerRef: string;
  amount: number;
  currency: string;
  status?: string;
  type?: "payout" | "payment" | "transfer" | "deposit";
  entryType?: "debit" | "credit";
  description?: string;
  metadata?: Record<string, unknown>;
};

export async function recordProviderLedger(
  supabase: SupabaseClient,
  input: LedgerWriteInput,
): Promise<{ transactionId: string; deduped: boolean }> {
  const {
    merchantId, provider, providerRef, amount, currency,
    status = "processing", entryType = "debit", description, metadata,
  } = input;

  // Idempotent — bail out if a row already exists for (provider, provider_ref).
  const existing = await supabase
    .from("transactions")
    .select("id")
    .eq("provider", provider)
    .eq("provider_ref", providerRef)
    .maybeSingle();
  if (existing.data?.id) {
    return { transactionId: existing.data.id, deduped: true };
  }

  const { data: tx, error: txErr } = await supabase
    .from("transactions")
    .insert({
      merchant_id: merchantId,
      provider,
      provider_ref: providerRef,
      amount,
      currency: currency.toUpperCase(),
      status,
      description,
      metadata: { type: input.type || "payout", ...(metadata || {}) },
    })
    .select("id")
    .single();
  if (txErr) throw new Error(`ledger.tx_insert: ${txErr.message}`);

  // Resolve account
  let accountId: string | null = null;
  const { data: acct } = await supabase
    .from("ledger_accounts")
    .select("id")
    .eq("merchant_id", merchantId)
    .eq("currency", currency.toUpperCase())
    .maybeSingle();
  if (acct?.id) accountId = acct.id;
  else {
    const { data: newAcct, error: aErr } = await supabase
      .from("ledger_accounts")
      .insert({ merchant_id: merchantId, account_type: "operating", currency: currency.toUpperCase() })
      .select("id")
      .single();
    if (aErr) throw new Error(`ledger.account_insert: ${aErr.message}`);
    accountId = newAcct.id;
  }

  await supabase.from("ledger_entries").insert({
    transaction_id: tx.id,
    account_id: accountId,
    entry_type: entryType,
    amount: entryType === "debit" ? -Math.abs(amount) : Math.abs(amount),
    currency: currency.toUpperCase(),
  });

  return { transactionId: tx.id, deduped: false };
}