CREATE TABLE IF NOT EXISTS public.cron_config (
  id text PRIMARY KEY,
  secret text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.cron_config TO service_role;

ALTER TABLE public.cron_config ENABLE ROW LEVEL SECURITY;