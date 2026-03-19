
-- Enable RLS on tables missing it
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fraud_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fraud_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.routing_stats ENABLE ROW LEVEL SECURITY;

-- Deny-all policies for internal tables
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='bins') THEN
    CREATE POLICY "deny_all" ON public.bins FOR ALL USING (false);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='fraud_nodes') THEN
    CREATE POLICY "deny_all" ON public.fraud_nodes FOR ALL USING (false);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='fraud_edges') THEN
    CREATE POLICY "deny_all" ON public.fraud_edges FOR ALL USING (false);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='routing_stats') THEN
    CREATE POLICY "deny_all" ON public.routing_stats FOR ALL USING (false);
  END IF;
END $$;

-- Payments: merchant-scoped read, deny public write
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='payments') THEN
    CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM merchants WHERE merchants.id = payments.merchant_id AND merchants.user_id = auth.uid()
      ));
    CREATE POLICY "payments_deny_insert" ON public.payments FOR INSERT WITH CHECK (false);
    CREATE POLICY "payments_deny_update" ON public.payments FOR UPDATE USING (false);
    CREATE POLICY "payments_deny_delete" ON public.payments FOR DELETE USING (false);
  END IF;
END $$;

-- Plans: merchant-scoped policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='plans') THEN
    CREATE POLICY "plans_select" ON public.plans FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM merchants WHERE merchants.id = plans.merchant_id AND merchants.user_id = auth.uid()
      ));
    CREATE POLICY "plans_insert" ON public.plans FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM merchants WHERE merchants.id = plans.merchant_id AND merchants.user_id = auth.uid()
      ));
    CREATE POLICY "plans_update" ON public.plans FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM merchants WHERE merchants.id = plans.merchant_id AND merchants.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Drop the overly permissive invoice policy if it still exists
DROP POLICY IF EXISTS "Anyone can view invoices by id" ON public.invoices;
