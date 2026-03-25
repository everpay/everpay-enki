-- Remove duplicate merchant
DELETE FROM public.merchants WHERE id = '31676bf7-21d7-42b6-b709-4b7bfcbf4828';

-- Default ShieldHub routing for Justin
INSERT INTO public.routing_rules (merchant_id, name, priority, target_provider, active, currency_match)
VALUES ('217cbda8-38a7-4fe0-98e9-805543799bf5', 'Default ShieldHub', 100, 'shieldhub', true, '{}');

INSERT INTO public.psp_routes (merchant_id, processor, priority, active)
VALUES ('217cbda8-38a7-4fe0-98e9-805543799bf5', 'shieldhub', 0, true);

-- Reassign Shopify stores to Justin's merchant
UPDATE public.shopify_stores 
SET merchant_id = '217cbda8-38a7-4fe0-98e9-805543799bf5' 
WHERE merchant_id = 'dbe59a55-de97-4874-afee-164d723b4e9b' 
  AND uninstalled = false;