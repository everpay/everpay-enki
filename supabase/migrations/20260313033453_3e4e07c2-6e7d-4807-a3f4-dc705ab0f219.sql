-- Fraud scores table to persist risk assessments per transaction
CREATE TABLE public.fraud_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  customer_email text,
  card_bin text,
  device_fingerprint text,
  ip_address text,
  velocity_score integer DEFAULT 0,
  device_score integer DEFAULT 0,
  geo_score integer DEFAULT 0,
  total_score integer DEFAULT 0,
  risk_level text DEFAULT 'low',
  risk_factors text[] DEFAULT '{}',
  action_taken text DEFAULT 'allow',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fraud_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fraud scores"
  ON public.fraud_scores FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = fraud_scores.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "Users can insert own fraud scores"
  ON public.fraud_scores FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = fraud_scores.merchant_id AND merchants.user_id = auth.uid()));