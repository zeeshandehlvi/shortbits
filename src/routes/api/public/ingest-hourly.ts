import { createFileRoute } from "@tanstack/react-router";

import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

const JOB_ID = "hourly-ingest";
const LEASE_MINUTES = 10;

async function handle() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { runIngest } = await import("@/lib/ingest.server");

  const now = new Date();
  const { data: state } = await supabaseAdmin
    .from("ingest_jobs")
    .select("id, paused, locked_until")
    .eq("id", JOB_ID)
    .maybeSingle();

  if (state?.paused) {
    return Response.json({ skipped: "paused" });
  }
  if (state?.locked_until && new Date(state.locked_until) > now) {
    return Response.json({ skipped: "locked" });
  }

  const lockedUntil = new Date(now.getTime() + LEASE_MINUTES * 60 * 1000).toISOString();
  await supabaseAdmin
    .from("ingest_jobs")
    .upsert({ id: JOB_ID, locked_until: lockedUntil }, { onConflict: "id" });

  try {
    const result = await runIngest(supabaseAdmin, {
      minutes: 75,
      want: 30,
      status: "published",
    });
    await supabaseAdmin
      .from("ingest_jobs")
      .update({
        locked_until: null,
        last_run_at: new Date().toISOString(),
        last_inserted: result.inserted,
        last_error: null,
      })
      .eq("id", JOB_ID);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabaseAdmin
      .from("ingest_jobs")
      .update({ locked_until: null, last_run_at: new Date().toISOString(), last_error: message })
      .eq("id", JOB_ID);
    return Response.json({ error: message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/ingest-hourly")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        return handle();
      },
    },
  },
});
