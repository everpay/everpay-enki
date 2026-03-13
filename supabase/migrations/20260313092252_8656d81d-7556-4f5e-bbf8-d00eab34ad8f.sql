
-- Create settlement_batches table
CREATE TABLE public.settlement_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processor text NOT NULL,
  currency text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  transaction_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  settled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settlement_batches ENABLE ROW LEVEL SECURITY;

-- Create acquirers table for multi-acquirer management
CREATE TABLE public.acquirers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text,
  api_endpoint text,
  active boolean NOT NULL DEFAULT true,
  routing_weight numeric(5,2) DEFAULT 100,
  success_rate numeric(5,2) DEFAULT 0,
  avg_latency_ms integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.acquirers ENABLE ROW LEVEL SECURITY;

-- Create merchant_acquirer_mids table
CREATE TABLE public.merchant_acquirer_mids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  acquirer_id uuid NOT NULL REFERENCES public.acquirers(id) ON DELETE CASCADE,
  mid text NOT NULL,
  routing_weight numeric(5,2) DEFAULT 100,
  priority integer DEFAULT 1,
  active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.merchant_acquirer_mids ENABLE ROW LEVEL SECURITY;

-- Create risk_rules table
CREATE TABLE public.risk_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES public.merchants(id) ON DELETE CASCADE,
  name text NOT NULL,
  condition jsonb NOT NULL DEFAULT '{}',
  action text NOT NULL DEFAULT 'flag',
  severity text NOT NULL DEFAULT 'medium',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_rules ENABLE ROW LEVEL SECURITY;

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for settlement_batches (admin-only via service role, read for merchants)
CREATE POLICY "Authenticated users can view settlement batches" ON public.settlement_batches FOR SELECT TO authenticated USING (true);

-- RLS policies for acquirers (public read)
CREATE POLICY "Anyone can view acquirers" ON public.acquirers FOR SELECT TO authenticated USING (true);

-- RLS policies for merchant_acquirer_mids
CREATE POLICY "Users can view own MIDs" ON public.merchant_acquirer_mids FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = merchant_acquirer_mids.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can insert own MIDs" ON public.merchant_acquirer_mids FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = merchant_acquirer_mids.merchant_id AND merchants.user_id = auth.uid()));

-- RLS policies for risk_rules
CREATE POLICY "Users can view own risk rules" ON public.risk_rules FOR SELECT TO authenticated
  USING (merchant_id IS NULL OR EXISTS (SELECT 1 FROM merchants WHERE merchants.id = risk_rules.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can insert own risk rules" ON public.risk_rules FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = risk_rules.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can update own risk rules" ON public.risk_rules FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = risk_rules.merchant_id AND merchants.user_id = auth.uid()));

-- RLS policies for audit_logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
