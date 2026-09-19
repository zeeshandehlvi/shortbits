SELECT cron.unschedule('shortbits-hourly-ingest') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'shortbits-hourly-ingest');

SELECT cron.schedule(
  'shortbits-hourly-ingest',
  '7 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--295ba5d5-af44-4d2d-b3cd-4b4140b7a24a.lovable.app/api/public/ingest-hourly',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || (SELECT secret FROM public.cron_config WHERE id = 'hourly-ingest')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);