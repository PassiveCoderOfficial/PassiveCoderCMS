import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";

const MAX_ITEMS = 5000;

/** Append a chunk of browser-parsed items to a job that hasn't started yet. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await importAccess("write");
  if ("error" in ctx) return ctx.error;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.items)) return NextResponse.json({ error: "items required" }, { status: 400 });
  const items = (body.items as { kind?: string }[]).filter((i) => ["page", "post", "product", "contact"].includes(i?.kind ?? ""));

  const { data: job } = await ctx.admin.from("import_jobs").select("items, status")
    .eq("id", id).eq("tenant_id", ctx.tenantId).maybeSingle();
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.status !== "ready") return NextResponse.json({ error: "This import has already started." }, { status: 409 });
  const all = [...(job.items as unknown[]), ...items];
  if (all.length > MAX_ITEMS) return NextResponse.json({ error: `One import can hold up to ${MAX_ITEMS} items. Split the file and import it in parts.` }, { status: 400 });
  const { error } = await ctx.admin.from("import_jobs").update({ items: all, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ total: all.length });
}
