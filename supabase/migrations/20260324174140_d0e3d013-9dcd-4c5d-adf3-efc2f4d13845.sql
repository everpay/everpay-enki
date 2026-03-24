-- Add encrypted token vault columns and webhook_secret to shopify_stores
ALTER TABLE public.shopify_stores
  ADD COLUMN IF NOT EXISTS encrypted_token text,
  ADD COLUMN IF NOT EXISTS iv text,
  ADD COLUMN IF NOT EXISTS auth_tag text,
  ADD COLUMN IF NOT EXISTS webhook_secret text,
  ADD COLUMN IF NOT EXISTS uninstalled boolean DEFAULT false;
