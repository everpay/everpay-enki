
-- Remove any prior schedule
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rebelfi-poll-tick') THEN
    PERFORM cron.unschedule('rebelfi-poll-tick');
  END IF;
END $$;

SELECT cron.schedule(
  'rebelfi-poll-tick',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://schxpniiwnxzscbcnynt.supabase.co/functions/v1/rebelfi-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-poll-secret', current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('action','poll_tick')
  ) AS request_id;
  $$
);
