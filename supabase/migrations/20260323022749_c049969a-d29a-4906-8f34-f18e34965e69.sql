-- Add secops and support roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'secops';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';