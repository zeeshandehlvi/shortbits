CREATE TABLE IF NOT EXISTS public.ingest_jobs (
  id text PRIMARY KEY,
  paused boolean NOT NULL DEFAULT false,
  locked_until timestamptz,
  last_run_at timestamptz,
  last_inserted integer,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ingest_jobs TO authenticated;
GRANT ALL ON public.ingest_jobs TO service_role;

ALTER TABLE public.ingest_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read ingest jobs" ON public.ingest_jobs;
CREATE POLICY "Admins can read ingest jobs" ON public.ingest_jobs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.ingest_jobs (id) VALUES ('hourly-ingest') ON CONFLICT (id) DO NOTHING;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.unschedule('shortbits-hourly-ingest') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'shortbits-hourly-ingest');

SELECT cron.schedule(
  'shortbits-hourly-ingest',
  '7 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--295ba5d5-af44-4d2d-b3cd-4b4140b7a24a.lovable.app/api/public/ingest-hourly',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || current_setting('app.settings.cron_secret', true)),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);