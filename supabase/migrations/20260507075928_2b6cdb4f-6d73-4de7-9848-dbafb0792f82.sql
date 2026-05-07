-- Allow merchants to delete their own Shopify stores
DO $$ BEGIN
  CREATE POLICY "Merchants can delete their own shopify stores"
    ON public.shopify_stores
    FOR DELETE
    USING (
      merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow merchants to update their own merchant_accounts (e.g. metadata fields)
DO $$ BEGIN
  CREATE POLICY "Merchants can update their own merchant_accounts"
    ON public.merchant_accounts
    FOR UPDATE
    USING (
      merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    )
    WITH CHECK (
      merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Service-role-only INSERT for kyb_review_notifications (documents intent)
DO $$ BEGIN
  CREATE POLICY "Service role can insert kyb_review_notifications"
    ON public.kyb_review_notifications
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;