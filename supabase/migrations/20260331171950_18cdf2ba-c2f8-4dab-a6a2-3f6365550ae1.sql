
-- Affiliate referrals table
CREATE TABLE public.affiliate_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_email TEXT,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  commission_rate NUMERIC NOT NULL DEFAULT 0.10,
  commission_amount NUMERIC DEFAULT 0,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Affiliate links table
CREATE TABLE public.affiliate_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  label TEXT,
  clicks INTEGER NOT NULL DEFAULT 0,
  signups INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chargeflow settings table
CREATE TABLE public.chargeflow_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  api_key_encrypted TEXT,
  merchant_external_id TEXT,
  connected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(merchant_id)
);

-- Chargeflow notifications table
CREATE TABLE public.chargeflow_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS for affiliate_referrals
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referrals" ON public.affiliate_referrals FOR SELECT TO authenticated USING (referrer_id = auth.uid());
CREATE POLICY "Users can insert own referrals" ON public.affiliate_referrals FOR INSERT TO authenticated WITH CHECK (referrer_id = auth.uid());
CREATE POLICY "Users can update own referrals" ON public.affiliate_referrals FOR UPDATE TO authenticated USING (referrer_id = auth.uid());

-- RLS for affiliate_links
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own links" ON public.affiliate_links FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own links" ON public.affiliate_links FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own links" ON public.affiliate_links FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own links" ON public.affiliate_links FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS for chargeflow_settings
ALTER TABLE public.chargeflow_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants can view own chargeflow settings" ON public.chargeflow_settings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = chargeflow_settings.merchant_id AND merchants.user_id = auth.uid()));
CREATE POLICY "Merchants can insert own chargeflow settings" ON public.chargeflow_settings FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = chargeflow_settings.merchant_id AND merchants.user_id = auth.uid()));
CREATE POLICY "Merchants can update own chargeflow settings" ON public.chargeflow_settings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = chargeflow_settings.merchant_id AND merchants.user_id = auth.uid()));

-- RLS for chargeflow_notifications
ALTER TABLE public.chargeflow_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants can view own chargeflow notifications" ON public.chargeflow_notifications FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = chargeflow_notifications.merchant_id AND merchants.user_id = auth.uid()));
CREATE POLICY "Merchants can update own chargeflow notifications" ON public.chargeflow_notifications FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = chargeflow_notifications.merchant_id AND merchants.user_id = auth.uid()));
