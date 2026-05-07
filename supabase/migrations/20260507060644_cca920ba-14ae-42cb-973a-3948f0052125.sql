
-- Tighten tapix_enrichment_cache: only service_role can manage
DROP POLICY IF EXISTS "Service role can manage enrichment cache" ON public.tapix_enrichment_cache;
CREATE POLICY "Service role can manage enrichment cache"
ON public.tapix_enrichment_cache
AS RESTRICTIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Tighten balance_alert_history insert: only service_role can insert
DROP POLICY IF EXISTS "service insert bah" ON public.balance_alert_history;
CREATE POLICY "service insert bah"
ON public.balance_alert_history
FOR INSERT
TO service_role
WITH CHECK (true);
