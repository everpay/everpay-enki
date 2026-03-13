
-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id),
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft',
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  invoice_number TEXT,
  items JSONB,
  paid_at TIMESTAMP WITH TIME ZONE,
  transaction_id UUID REFERENCES public.transactions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (
  EXISTS (SELECT 1 FROM merchants WHERE merchants.id = invoices.merchant_id AND merchants.user_id = auth.uid())
);
CREATE POLICY "Users can insert own invoices" ON public.invoices FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM merchants WHERE merchants.id = invoices.merchant_id AND merchants.user_id = auth.uid())
);
CREATE POLICY "Users can update own invoices" ON public.invoices FOR UPDATE USING (
  EXISTS (SELECT 1 FROM merchants WHERE merchants.id = invoices.merchant_id AND merchants.user_id = auth.uid())
);
-- Allow public access for payment (customers paying invoices)
CREATE POLICY "Anyone can view invoices by id" ON public.invoices FOR SELECT USING (true);

-- Create rolling_reserves table
CREATE TABLE public.rolling_reserves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  reserve_percent NUMERIC NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'held',
  held_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  release_at TIMESTAMP WITH TIME ZONE NOT NULL,
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rolling_reserves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reserves" ON public.rolling_reserves FOR SELECT USING (
  EXISTS (SELECT 1 FROM merchants WHERE merchants.id = rolling_reserves.merchant_id AND merchants.user_id = auth.uid())
);
CREATE POLICY "Users can insert own reserves" ON public.rolling_reserves FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM merchants WHERE merchants.id = rolling_reserves.merchant_id AND merchants.user_id = auth.uid())
);

-- Create card_velocity table
CREATE TABLE public.card_velocity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id),
  customer_identifier TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(merchant_id, customer_identifier, transaction_date)
);

ALTER TABLE public.card_velocity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own velocity" ON public.card_velocity FOR SELECT USING (
  EXISTS (SELECT 1 FROM merchants WHERE merchants.id = card_velocity.merchant_id AND merchants.user_id = auth.uid())
);
CREATE POLICY "Users can insert own velocity" ON public.card_velocity FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM merchants WHERE merchants.id = card_velocity.merchant_id AND merchants.user_id = auth.uid())
);

-- Create user_roles table for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Timestamp trigger for invoices
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
