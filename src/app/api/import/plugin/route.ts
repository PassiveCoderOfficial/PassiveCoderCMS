import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyMcpBearer } from "@/lib/mcp/auth";
import { appendItems, runJobStep } from "@/lib/import/run";

export const maxDuration = 60;

/**
 * Endpoint for the "Passive Coder Migration" WordPress plugin. The plugin
 * authenticates with a migration key (a write-scoped personal token from
 * Dashboard > Import / Export, revocable under AI Connect) and calls:
 *   { action: "hello" }                      -> which site the key belongs to
 *   { action: "start", source_label }        -> new job id
 *   { action: "items", job, items: [...] }   -> append a batch
 *   { action: "step", job }                  -> process the next batch
 * Calls come from the WordPress server (no browser, so no CORS).
 */
export async function POST(req: Request) {
  const caller = await verifyMcpBearer(req);
  if (!caller) return NextResponse.json({ error: "This migration key isn't valid. Create a new one in Dashboard > Import / Export." }, { status: 401 });
  if (caller.scope !== "write") return NextResponse.json({ error: "This key is read-only. Create a migration key in Dashboard > Import / Export." }, { status: 403 });
  const admin = await createAdminClient();
  const w = { admin, tenantId: caller.tenantId, userId: caller.userId };
  const body = await req.json().catch(() => ({}));
  const job = typeof body.job === "string" ? body.job : "";

  switch (body.action) {
    case "hello": {
      const { data: t } = await admin.from("tenants").select("name, slug, custom_domain").eq("id", caller.tenantId).maybeSingle();
      return NextResponse.json({ ok: true, site: t?.name ?? "", address: t?.custom_domain || (t ? `${t.slug}.passivecoder.com` : "") });
    }
    case "start": {
      const { data, error } = await admin.from("import_jobs").insert({
        tenant_id: caller.tenantId, created_by: caller.userId, source: "wp_plugin",
        source_label: typeof body.source_label === "string" ? body.source_label.slice(0, 200) : null,
        items: [], options: { mediaMap: {} },
      }).select("id").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ job: data.id });
    }
    case "items": {
      if (!Array.isArray(body.items)) return NextResponse.json({ error: "items required" }, { status: 400 });
      const r = await appendItems(w, job, body.items);
      if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
      return NextResponse.json(r);
    }
    case "step": {
      // Shorter batches: the plugin waits on PHP, which often has a 30s limit.
      const r = await runJobStep(w, job, 18_000);
      if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(r);
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
