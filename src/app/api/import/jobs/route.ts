import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { fetchWordPressSite } from "@/lib/import/server";
import { contactsFromCsv } from "@/lib/import/parse";
import { autoCreateRootProject } from "@/modules/registry/projects/auto-create";

export const maxDuration = 120;

const SOURCES = ["wxr", "wp_url", "csv_contacts", "site_json"];

/** Recent import jobs for this site (without their item payloads). */
export async function GET() {
  const ctx = await importAccess("read");
  if ("error" in ctx) return ctx.error;
  const { data } = await ctx.admin.rpc("import_job_list", { p_tenant: ctx.tenantId });
  return NextResponse.json({ jobs: data ?? [] });
}

/**
 * Start an import. For a WordPress site address the server reads the site's
 * public API here; for uploaded files the browser has already parsed them and
 * sends the items afterwards in chunks via /items.
 */
export async function POST(req: Request) {
  const ctx = await importAccess("write");
  if ("error" in ctx) return ctx.error;
  const body = await req.json().catch(() => ({}));
  const source = String(body.source ?? "");
  if (!SOURCES.includes(source)) return NextResponse.json({ error: "Unknown import type" }, { status: 400 });

  let items: unknown[] = [];
  let label: string | null = typeof body.source_label === "string" ? body.source_label.slice(0, 200) : null;
  if (source === "wp_url") {
    try {
      const r = await fetchWordPressSite(String(body.url ?? "").trim());
      items = r.items; label = r.site;
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't read that site." }, { status: 400 });
    }
    if (!items.length) return NextResponse.json({ error: "No public pages, posts or products found on that site." }, { status: 400 });
  }

  // The mobile app sends the file's text here so there is one CSV parser; dry_run
  // only reports what would be imported (the app's preview) and saves nothing.
  if (source === "csv_contacts" && typeof body.csv === "string") {
    items = contactsFromCsv(body.csv);
    if (!items.length) return NextResponse.json({ error: "No contacts with an email or phone number found. Check the file has a header row." }, { status: 400 });
    if (body.dry_run === true) return NextResponse.json({ total: items.length, sample: items.slice(0, 5) });
  }

  const { data, error } = await ctx.admin.from("import_jobs").insert({
    tenant_id: ctx.tenantId, created_by: ctx.userId, source, source_label: label, items, options: { mediaMap: {} },
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await autoCreateRootProject(ctx.admin, { siteId: ctx.tenantId, source: "import_job", sourceRef: `import:${data.id}`, template: "site-import", label: "site import" });

  const counts: Record<string, number> = {};
  for (const i of items as { kind: string }[]) counts[i.kind] = (counts[i.kind] ?? 0) + 1;
  return NextResponse.json({ id: data.id, total: items.length, counts });
}
