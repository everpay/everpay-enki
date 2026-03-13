
-- Webhook endpoints for merchant webhook configuration
CREATE TABLE public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  events text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook endpoints" ON public.webhook_endpoints
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = webhook_endpoints.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can insert own webhook endpoints" ON public.webhook_endpoints
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = webhook_endpoints.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can update own webhook endpoints" ON public.webhook_endpoints
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = webhook_endpoints.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can delete own webhook endpoints" ON public.webhook_endpoints
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = webhook_endpoints.merchant_id AND merchants.user_id = auth.uid()));

-- Webhook delivery logs
CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  response_status integer,
  response_body text,
  attempt_count integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook deliveries" ON public.webhook_deliveries
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = webhook_deliveries.merchant_id AND merchants.user_id = auth.uid()));

-- Refunds table
CREATE TABLE public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  provider text,
  provider_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own refunds" ON public.refunds
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = refunds.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can insert own refunds" ON public.refunds
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = refunds.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can update own refunds" ON public.refunds
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = refunds.merchant_id AND merchants.user_id = auth.uid()));

-- Payment attempts / routing logs
CREATE TABLE public.payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  provider text NOT NULL,
  attempt_number integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  response_code text,
  response_message text,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment attempts" ON public.payment_attempts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM transactions t JOIN merchants m ON m.id = t.merchant_id
    WHERE t.id = payment_attempts.transaction_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own payment attempts" ON public.payment_attempts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM transactions t JOIN merchants m ON m.id = t.merchant_id
    WHERE t.id = payment_attempts.transaction_id AND m.user_id = auth.uid()
  ));

-- Merchant profiles for KYB onboarding
CREATE TABLE public.merchant_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL UNIQUE REFERENCES public.merchants(id) ON DELETE CASCADE,
  business_name text,
  business_type text,
  registration_number text,
  tax_id text,
  country text,
  address jsonb,
  website text,
  industry text,
  mcc_code text,
  onboarding_status text NOT NULL DEFAULT 'pending',
  kyb_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.merchant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own merchant profile" ON public.merchant_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = merchant_profiles.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can insert own merchant profile" ON public.merchant_profiles
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = merchant_profiles.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can update own merchant profile" ON public.merchant_profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = merchant_profiles.merchant_id AND merchants.user_id = auth.uid()));

-- KYB documents storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('kyb-documents', 'kyb-documents', false);

-- Storage RLS for kyb-documents
CREATE POLICY "Users can upload own KYB documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kyb-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own KYB documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'kyb-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Updated_at triggers
CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_merchant_profiles_updated_at BEFORE UPDATE ON public.merchant_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
