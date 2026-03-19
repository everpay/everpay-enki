
-- ============================================================
-- 1. Enable RLS on all unprotected tables
-- ============================================================
ALTER TABLE public.merchant_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.margin_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidity_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surcharge_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Add RLS policies for merchant-scoped tables
-- ============================================================

-- merchant_accounts
CREATE POLICY "merchant_accounts_select" ON public.merchant_accounts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = merchant_accounts.merchant_id AND merchants.user_id = auth.uid()));
CREATE POLICY "merchant_accounts_insert" ON public.merchant_accounts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = merchant_accounts.merchant_id AND merchants.user_id = auth.uid()));

-- ledger_accounts
CREATE POLICY "ledger_accounts_select" ON public.ledger_accounts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = ledger_accounts.merchant_id AND merchants.user_id = auth.uid()));

-- margin_records
CREATE POLICY "margin_records_select" ON public.margin_records FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM transactions t JOIN merchants m ON m.id = t.merchant_id WHERE t.id = margin_records.transaction_id AND m.user_id = auth.uid()));

-- settlement_instructions
CREATE POLICY "settlement_instructions_select" ON public.settlement_instructions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = settlement_instructions.merchant_id AND merchants.user_id = auth.uid()));

-- shopify_stores
CREATE POLICY "shopify_stores_select" ON public.shopify_stores FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = shopify_stores.merchant_id AND merchants.user_id = auth.uid()));
CREATE POLICY "shopify_stores_insert" ON public.shopify_stores FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = shopify_stores.merchant_id AND merchants.user_id = auth.uid()));
CREATE POLICY "shopify_stores_update" ON public.shopify_stores FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = shopify_stores.merchant_id AND merchants.user_id = auth.uid()));

-- shopify_orders
CREATE POLICY "shopify_orders_select" ON public.shopify_orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM shopify_stores s JOIN merchants m ON m.id = s.merchant_id WHERE s.id = shopify_orders.store_id AND m.user_id = auth.uid()));

-- shopify_products
CREATE POLICY "shopify_products_select" ON public.shopify_products FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM shopify_stores s JOIN merchants m ON m.id = s.merchant_id WHERE s.id = shopify_products.store_id AND m.user_id = auth.uid()));

-- behavioral_profiles
CREATE POLICY "behavioral_profiles_select" ON public.behavioral_profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = behavioral_profiles.merchant_id AND merchants.user_id = auth.uid()));

-- api_request_logs
CREATE POLICY "api_request_logs_select" ON public.api_request_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = api_request_logs.merchant_id AND merchants.user_id = auth.uid()));

-- surcharge_settings
CREATE POLICY "surcharge_settings_select" ON public.surcharge_settings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = surcharge_settings.merchant_id AND merchants.user_id = auth.uid()));
CREATE POLICY "surcharge_settings_insert" ON public.surcharge_settings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = surcharge_settings.merchant_id AND merchants.user_id = auth.uid()));
CREATE POLICY "surcharge_settings_update" ON public.surcharge_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = surcharge_settings.merchant_id AND merchants.user_id = auth.uid()));

-- webhook_logs
CREATE POLICY "webhook_logs_select" ON public.webhook_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM merchants WHERE merchants.id = webhook_logs.merchant_id AND merchants.user_id = auth.uid()));

-- ============================================================
-- 3. Internal-only tables: block all direct API access
-- ============================================================
CREATE POLICY "deny_all" ON public.settlement_runs FOR ALL USING (false);
CREATE POLICY "deny_all" ON public.treasury_accounts FOR ALL USING (false);
CREATE POLICY "deny_all" ON public.treasury_transfers FOR ALL USING (false);
CREATE POLICY "deny_all" ON public.device_reputation FOR ALL USING (false);
CREATE POLICY "deny_all" ON public.fraud_graph_nodes FOR ALL USING (false);
CREATE POLICY "deny_all" ON public.fraud_graph_edges FOR ALL USING (false);
CREATE POLICY "deny_all" ON public.processor_metrics FOR ALL USING (false);
CREATE POLICY "deny_all" ON public.event_logs FOR ALL USING (false);
CREATE POLICY "deny_all" ON public.webhook_events FOR ALL USING (false);
CREATE POLICY "deny_all" ON public.liquidity_pools FOR ALL USING (false);

-- ============================================================
-- 4. Drop overly permissive invoice policy
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view invoices by id" ON public.invoices;

-- ============================================================
-- 5. Protect user_roles table
-- ============================================================
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user_roles_admin_insert" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin_delete" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
