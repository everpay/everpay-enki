
-- Ensure ShieldHub PSP route for matt@roqqetmedia.com
INSERT INTO public.psp_routes (merchant_id, processor, priority, active)
SELECT 'd51841bf-e9bb-43ad-8f44-169c6d876578', 'shieldhub', 0, true
WHERE EXISTS (SELECT 1 FROM public.merchants WHERE id = 'd51841bf-e9bb-43ad-8f44-169c6d876578')
AND NOT EXISTS (SELECT 1 FROM public.psp_routes WHERE merchant_id = 'd51841bf-e9bb-43ad-8f44-169c6d876578' AND processor = 'shieldhub');

-- Ensure PG10 PKR PSP route for matt@roqqetmedia.com
INSERT INTO public.psp_routes (merchant_id, processor, priority, active, country)
SELECT 'd51841bf-e9bb-43ad-8f44-169c6d876578', 'paygate10', 5, true, 'PK'
WHERE EXISTS (SELECT 1 FROM public.merchants WHERE id = 'd51841bf-e9bb-43ad-8f44-169c6d876578')
AND NOT EXISTS (SELECT 1 FROM public.psp_routes WHERE merchant_id = 'd51841bf-e9bb-43ad-8f44-169c6d876578' AND processor = 'paygate10');

-- Ensure ShieldHub PSP route for justinrussell015@gmail.com
INSERT INTO public.psp_routes (merchant_id, processor, priority, active)
SELECT '9aab7d74-776c-434e-a12f-1915a5ddbe95', 'shieldhub', 0, true
WHERE EXISTS (SELECT 1 FROM public.merchants WHERE id = '9aab7d74-776c-434e-a12f-1915a5ddbe95')
AND NOT EXISTS (SELECT 1 FROM public.psp_routes WHERE merchant_id = '9aab7d74-776c-434e-a12f-1915a5ddbe95' AND processor = 'shieldhub');

-- Ensure merchant roles for all three users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'merchant' FROM auth.users WHERE email IN ('justinrussell015@gmail.com', 'matt@roqqetmedia.com', 'everpay@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove admin/super_admin from everpay@gmail.com
DELETE FROM public.user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'everpay@gmail.com') AND role IN ('admin', 'super_admin');
