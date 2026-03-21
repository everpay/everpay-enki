CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_merchant_id uuid;
BEGIN
  INSERT INTO public.merchants (user_id, name)
  VALUES (NEW.user_id, COALESCE(NEW.display_name, 'My Merchant'))
  RETURNING id INTO new_merchant_id;

  INSERT INTO public.routing_rules (merchant_id, name, priority, target_provider, active, currency_match)
  VALUES (new_merchant_id, 'Default ShieldHub', 100, 'shieldhub', true, '{}');

  RETURN NEW;
END;
$function$;