
-- Turn 1: Routing Maestro metrics foundation
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS latency_ms integer;

CREATE INDEX IF NOT EXISTS idx_transactions_provider_created_status
  ON public.transactions (provider, created_at DESC, status);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
  ON public.transactions (created_at DESC);
