ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_provider_check;
UPDATE public.transactions SET provider = 'smartfastpay' WHERE provider = 'facilitapay';
UPDATE public.provider_events SET provider = 'smartfastpay' WHERE provider = 'facilitapay';
UPDATE public.routing_rules SET target_provider = 'smartfastpay' WHERE target_provider = 'facilitapay';
UPDATE public.routing_rules SET fallback_provider = 'smartfastpay' WHERE fallback_provider = 'facilitapay';
UPDATE public.psp_routes SET processor = 'smartfastpay' WHERE processor = 'facilitapay';
ALTER TABLE public.transactions ADD CONSTRAINT transactions_provider_check CHECK (provider = ANY (ARRAY['smartfastpay','mondo','stripe','shieldhub','moneto','paygate10','ofa','makapay','shopify','bigcommerce','payok','paywatcher','elektropay','circle','delos','brighty','unit','walletsuite','rebelfi','prometeo','matrix','dcbank','lipad']));