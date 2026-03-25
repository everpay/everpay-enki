CREATE OR REPLACE FUNCTION public.handle_new_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_merchant_id uuid;
  v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;

  INSERT INTO public.merchants (user_id, name)
  VALUES (NEW.user_id, COALESCE(NEW.display_name, 'My Merchant'))
  RETURNING id INTO new_merchant_id;

  -- Default ShieldHub route for all merchants
  INSERT INTO public.routing_rules (merchant_id, name, priority, target_provider, active, currency_match)
  VALUES (new_merchant_id, 'Default ShieldHub', 100, 'shieldhub', true, '{}');

  INSERT INTO public.psp_routes (merchant_id, processor, priority, active)
  VALUES (new_merchant_id, 'shieldhub', 0, true);

  -- matt@roqqetmedia.com: MakaPay primary, ShieldHub fallback, PG10 for PKR
  IF v_email = 'matt@roqqetmedia.com' THEN
    INSERT INTO public.routing_rules (merchant_id, name, priority, target_provider, fallback_provider, active, currency_match)
    VALUES (new_merchant_id, 'MakaPay Primary', 0, 'makapay', 'shieldhub', true, '{}');

    INSERT INTO public.psp_routes (merchant_id, processor, priority, active)
    VALUES (new_merchant_id, 'makapay', 0, true);

    UPDATE public.psp_routes SET priority = 10 WHERE merchant_id = new_merchant_id AND processor = 'shieldhub';
    UPDATE public.routing_rules SET priority = 50 WHERE merchant_id = new_merchant_id AND name = 'Default ShieldHub';

    INSERT INTO public.routing_rules (merchant_id, name, priority, target_provider, fallback_provider, active, currency_match)
    VALUES (new_merchant_id, 'PG10 Pakistan PKR', 10, 'paygate10', 'shieldhub', true, '{PKR}');

    INSERT INTO public.psp_routes (merchant_id, processor, priority, active, country)
    VALUES (new_merchant_id, 'paygate10', 5, true, 'PK');
  END IF;

  RETURN NEW;
END;
$function$