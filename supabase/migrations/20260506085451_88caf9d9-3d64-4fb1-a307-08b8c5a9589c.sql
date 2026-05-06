-- Webhook event dedup + idempotency key storage
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT,
  payload JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read webhook_events" ON public.webhook_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  provider TEXT,
  request_hash TEXT,
  response JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  merchant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read idempotency_keys" ON public.idempotency_keys
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Trigger: when provider_events arrive, update payouts/transactions canonical status
CREATE OR REPLACE FUNCTION public.sync_payout_status_from_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_status TEXT;
BEGIN
  IF NEW.event_type IN ('payout.completed','payment.confirmed','payment.completed') THEN new_status := 'completed';
  ELSIF NEW.event_type IN ('payout.failed','payment.failed','payment.expired') THEN new_status := 'failed';
  ELSIF NEW.event_type IN ('payout.processing','payment.processing') THEN new_status := 'processing';
  ELSIF NEW.event_type IN ('payout.created','payment.created') THEN new_status := 'pending';
  END IF;
  IF new_status IS NOT NULL AND NEW.transaction_id IS NOT NULL THEN
    UPDATE public.transactions SET status = new_status, updated_at = now() WHERE id = NEW.transaction_id;
    BEGIN
      UPDATE public.payouts SET status = new_status, updated_at = now() WHERE transaction_id = NEW.transaction_id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_payout_status ON public.provider_events;
CREATE TRIGGER trg_sync_payout_status
AFTER INSERT ON public.provider_events
FOR EACH ROW EXECUTE FUNCTION public.sync_payout_status_from_event();