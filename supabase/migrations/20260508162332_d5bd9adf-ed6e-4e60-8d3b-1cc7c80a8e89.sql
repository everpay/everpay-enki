
CREATE TABLE IF NOT EXISTS public.rebelfi_proxy_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  upstream_ok boolean NOT NULL DEFAULT true
);

ALTER TABLE public.rebelfi_proxy_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rebelfi_cache admin read" ON public.rebelfi_proxy_cache;
CREATE POLICY "rebelfi_cache admin read"
  ON public.rebelfi_proxy_cache FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
