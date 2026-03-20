-- Security hardening: enforce RLS policies for tables flagged as exposed in live environment.

-- 1) Merchant-scoped read access tables
DO $$
DECLARE
  _tbl text;
  _policy text;
BEGIN
  FOREACH _tbl IN ARRAY ARRAY['api_request_logs','behavioral_profiles','ledger_accounts','settlement_instructions'] LOOP
    IF to_regclass(format('public.%I', _tbl)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', _tbl);
      _policy := format('%s_select', _tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _policy, _tbl);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.merchants WHERE merchants.id = %I.merchant_id AND merchants.user_id = auth.uid()))',
        _policy,
        _tbl,
        _tbl
      );
    END IF;
  END LOOP;
END
$$;

-- 2) merchant_accounts: merchant-scoped SELECT + INSERT
DO $$
BEGIN
  IF to_regclass('public.merchant_accounts') IS NOT NULL THEN
    ALTER TABLE public.merchant_accounts ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS merchant_accounts_select ON public.merchant_accounts;
    CREATE POLICY merchant_accounts_select
      ON public.merchant_accounts
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.merchants
          WHERE merchants.id = merchant_accounts.merchant_id
            AND merchants.user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS merchant_accounts_insert ON public.merchant_accounts;
    CREATE POLICY merchant_accounts_insert
      ON public.merchant_accounts
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.merchants
          WHERE merchants.id = merchant_accounts.merchant_id
            AND merchants.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- 3) payments: merchant-scoped SELECT + INSERT + UPDATE
DO $$
BEGIN
  IF to_regclass('public.payments') IS NOT NULL THEN
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS payments_select ON public.payments;
    CREATE POLICY payments_select
      ON public.payments
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.merchants
          WHERE merchants.id = payments.merchant_id
            AND merchants.user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS payments_insert ON public.payments;
    CREATE POLICY payments_insert
      ON public.payments
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.merchants
          WHERE merchants.id = payments.merchant_id
            AND merchants.user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS payments_update ON public.payments;
    CREATE POLICY payments_update
      ON public.payments
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.merchants
          WHERE merchants.id = payments.merchant_id
            AND merchants.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.merchants
          WHERE merchants.id = payments.merchant_id
            AND merchants.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- 4) shopify_stores: merchant-scoped SELECT + INSERT + UPDATE
DO $$
BEGIN
  IF to_regclass('public.shopify_stores') IS NOT NULL THEN
    ALTER TABLE public.shopify_stores ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS shopify_stores_select ON public.shopify_stores;
    CREATE POLICY shopify_stores_select
      ON public.shopify_stores
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.merchants
          WHERE merchants.id = shopify_stores.merchant_id
            AND merchants.user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS shopify_stores_insert ON public.shopify_stores;
    CREATE POLICY shopify_stores_insert
      ON public.shopify_stores
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.merchants
          WHERE merchants.id = shopify_stores.merchant_id
            AND merchants.user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS shopify_stores_update ON public.shopify_stores;
    CREATE POLICY shopify_stores_update
      ON public.shopify_stores
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.merchants
          WHERE merchants.id = shopify_stores.merchant_id
            AND merchants.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.merchants
          WHERE merchants.id = shopify_stores.merchant_id
            AND merchants.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- 5) shopify child tables: merchant-scoped SELECT via store ownership
DO $$
DECLARE
  _tbl text;
  _policy text;
BEGIN
  FOREACH _tbl IN ARRAY ARRAY['shopify_orders','shopify_products'] LOOP
    IF to_regclass(format('public.%I', _tbl)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', _tbl);
      _policy := format('%s_select', _tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _policy, _tbl);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.shopify_stores s JOIN public.merchants m ON m.id = s.merchant_id WHERE s.id = %I.store_id AND m.user_id = auth.uid()))',
        _policy,
        _tbl,
        _tbl
      );
    END IF;
  END LOOP;
END
$$;

-- 6) margin_records: merchant-scoped SELECT through transactions
DO $$
BEGIN
  IF to_regclass('public.margin_records') IS NOT NULL THEN
    ALTER TABLE public.margin_records ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS margin_records_select ON public.margin_records;
    CREATE POLICY margin_records_select
      ON public.margin_records
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.transactions t
          JOIN public.merchants m ON m.id = t.merchant_id
          WHERE t.id = margin_records.transaction_id
            AND m.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- 7) Internal-only tables: deny all API access
DO $$
DECLARE
  _tbl text;
BEGIN
  FOREACH _tbl IN ARRAY ARRAY[
    'bins',
    'device_reputation',
    'event_logs',
    'fraud_edges',
    'fraud_graph_edges',
    'fraud_graph_nodes',
    'fraud_nodes',
    'liquidity_pools',
    'plans',
    'processor_metrics',
    'routing_stats',
    'settlement_runs',
    'treasury_accounts',
    'treasury_transfers',
    'webhook_events'
  ] LOOP
    IF to_regclass(format('public.%I', _tbl)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', _tbl);
      EXECUTE format('DROP POLICY IF EXISTS deny_all ON public.%I', _tbl);
      EXECUTE format('CREATE POLICY deny_all ON public.%I FOR ALL TO public USING (false) WITH CHECK (false)', _tbl);
    END IF;
  END LOOP;
END
$$;