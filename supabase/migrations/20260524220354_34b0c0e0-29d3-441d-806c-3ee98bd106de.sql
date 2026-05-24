
-- failover_configs: persisted per-merchant per-processor retry/failover settings
CREATE TABLE IF NOT EXISTS public.failover_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid,
  processor text NOT NULL,
  max_retries int NOT NULL DEFAULT 3,
  retry_delay_ms int NOT NULL DEFAULT 1000,
  backoff text NOT NULL DEFAULT 'exponential',
  fallback_chain jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  version int NOT NULL DEFAULT 1,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_failover_configs_merchant_processor
  ON public.failover_configs (COALESCE(merchant_id, '00000000-0000-0000-0000-000000000000'::uuid), processor);

ALTER TABLE public.failover_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read failover_configs"
ON public.failover_configs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_failover_configs_updated_at
BEFORE UPDATE ON public.failover_configs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- routing_audit_log: every routing change + activation event
CREATE TABLE IF NOT EXISTS public.routing_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  merchant_id uuid,
  before jsonb,
  after jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_routing_audit_log_created ON public.routing_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_routing_audit_log_entity ON public.routing_audit_log (entity_type, entity_id);

ALTER TABLE public.routing_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read routing_audit_log"
ON public.routing_audit_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- routing_idempotency: dedupe retry / failover operations
CREATE TABLE IF NOT EXISTS public.routing_idempotency (
  key text PRIMARY KEY,
  operation text NOT NULL,
  transaction_id uuid,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE INDEX IF NOT EXISTS idx_routing_idempotency_expires ON public.routing_idempotency (expires_at);

ALTER TABLE public.routing_idempotency ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read routing_idempotency"
ON public.routing_idempotency FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
