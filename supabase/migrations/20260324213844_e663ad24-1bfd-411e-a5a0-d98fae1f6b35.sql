
-- Insert routing rules for justinrussell015@gmail.com (ShieldHub only)
INSERT INTO public.routing_rules (merchant_id, name, priority, target_provider, active, currency_match)
SELECT '9aab7d74-776c-434e-a12f-1915a5ddbe95', 'Default ShieldHub', 100, 'shieldhub', true, '{}'
WHERE EXISTS (SELECT 1 FROM public.merchants WHERE id = '9aab7d74-776c-434e-a12f-1915a5ddbe95');

INSERT INTO public.psp_routes (merchant_id, processor, priority, active)
SELECT '9aab7d74-776c-434e-a12f-1915a5ddbe95', 'shieldhub', 0, true
WHERE EXISTS (SELECT 1 FROM public.merchants WHERE id = '9aab7d74-776c-434e-a12f-1915a5ddbe95');

INSERT INTO public.routing_rules (merchant_id, name, priority, target_provider, active, currency_match)
SELECT 'd51841bf-e9bb-43ad-8f44-169c6d876578', 'PG10 Pakistan PKR', 10, 'paygate10', true, '{PKR}'
WHERE EXISTS (SELECT 1 FROM public.merchants WHERE id = 'd51841bf-e9bb-43ad-8f44-169c6d876578');

INSERT INTO public.psp_routes (merchant_id, processor, priority, active)
SELECT 'd51841bf-e9bb-43ad-8f44-169c6d876578', 'shieldhub', 0, true
WHERE EXISTS (SELECT 1 FROM public.merchants WHERE id = 'd51841bf-e9bb-43ad-8f44-169c6d876578');

INSERT INTO public.psp_routes (merchant_id, processor, priority, active, country)
SELECT 'd51841bf-e9bb-43ad-8f44-169c6d876578', 'paygate10', 5, true, 'PK'
WHERE EXISTS (SELECT 1 FROM public.merchants WHERE id = 'd51841bf-e9bb-43ad-8f44-169c6d876578');

INSERT INTO public.user_roles (user_id, role)
SELECT 'cc238321-8a94-4a41-8cff-885f741a74ba', 'merchant'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = 'cc238321-8a94-4a41-8cff-885f741a74ba')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT 'd84c8a95-f21f-4b3e-bed7-16e57c15a256', 'merchant'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = 'd84c8a95-f21f-4b3e-bed7-16e57c15a256')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT 'ad79b401-b386-41d8-8538-d8423599bac7', 'merchant'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = 'ad79b401-b386-41d8-8538-d8423599bac7')
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles 
WHERE user_id = 'ad79b401-b386-41d8-8538-d8423599bac7' 
AND role IN ('admin', 'super_admin');
