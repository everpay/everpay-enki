
-- 1. Create everpay_webhooks staging table for incoming webhook events
CREATE TABLE IF NOT EXISTS public.everpay_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text,
  status text,
  payload jsonb DEFAULT '{}'::jsonb,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.everpay_webhooks ENABLE ROW LEVEL SECURITY;

-- Only service role / edge functions can insert webhooks
CREATE POLICY "deny_all_everpay_webhooks" ON public.everpay_webhooks
  FOR ALL TO public USING (false) WITH CHECK (false);

-- Admin can read webhooks
CREATE POLICY "admin_read_everpay_webhooks" ON public.everpay_webhooks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Create webhook_notification_settings table for email alert preferences
CREATE TABLE IF NOT EXISTS public.webhook_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES public.merchants(id) ON DELETE CASCADE,
  email_address text NOT NULL,
  enabled boolean DEFAULT true,
  notify_on_success boolean DEFAULT true,
  notify_on_failure boolean DEFAULT true,
  notify_on_refund boolean DEFAULT true,
  notify_on_chargeback boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(merchant_id, email_address)
);

ALTER TABLE public.webhook_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchant_select_notification_settings" ON public.webhook_notification_settings
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = webhook_notification_settings.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "merchant_insert_notification_settings" ON public.webhook_notification_settings
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = webhook_notification_settings.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "merchant_update_notification_settings" ON public.webhook_notification_settings
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = webhook_notification_settings.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "merchant_delete_notification_settings" ON public.webhook_notification_settings
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = webhook_notification_settings.merchant_id AND merchants.user_id = auth.uid()));

-- Admin can also manage notification settings
CREATE POLICY "admin_all_notification_settings" ON public.webhook_notification_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Create admin_notification_emails table for platform-wide alerts
CREATE TABLE IF NOT EXISTS public.admin_notification_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address text NOT NULL UNIQUE,
  enabled boolean DEFAULT true,
  notify_on_success boolean DEFAULT false,
  notify_on_failure boolean DEFAULT true,
  notify_on_refund boolean DEFAULT true,
  notify_on_chargeback boolean DEFAULT true,
  notify_on_high_risk boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_notification_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_admin_notification_emails" ON public.admin_notification_emails
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Create merchant_3ds_settings table for 3DS enable/disable per merchant
CREATE TABLE IF NOT EXISTS public.merchant_3ds_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES public.merchants(id) ON DELETE CASCADE UNIQUE,
  enabled boolean DEFAULT true,
  auto_enable_high_risk boolean DEFAULT true,
  risk_threshold integer DEFAULT 70,
  decline_threshold integer DEFAULT 5,
  skip_if_processor_3ds boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.merchant_3ds_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchant_select_3ds" ON public.merchant_3ds_settings
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = merchant_3ds_settings.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "merchant_update_3ds" ON public.merchant_3ds_settings
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = merchant_3ds_settings.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "admin_all_3ds" ON public.merchant_3ds_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Create psp_routes table for admin-managed per-merchant processor routing
CREATE TABLE IF NOT EXISTS public.psp_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES public.merchants(id) ON DELETE CASCADE,
  country text,
  card_brand text,
  risk_level text,
  processor text NOT NULL,
  priority integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.psp_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchant_select_psp_routes" ON public.psp_routes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = psp_routes.merchant_id AND merchants.user_id = auth.uid()));

CREATE POLICY "admin_all_psp_routes" ON public.psp_routes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Trigger: sync everpay_webhooks to transactions
CREATE OR REPLACE FUNCTION public.sync_webhook_to_transactions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update transaction status based on webhook
  UPDATE transactions
  SET status = NEW.status,
      updated_at = now()
  WHERE provider_ref = NEW.transaction_id
    AND NEW.status IS NOT NULL;

  -- Mark webhook as processed
  UPDATE everpay_webhooks
  SET processed = true
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER everpay_webhooks_sync
  AFTER INSERT ON public.everpay_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_webhook_to_transactions();
