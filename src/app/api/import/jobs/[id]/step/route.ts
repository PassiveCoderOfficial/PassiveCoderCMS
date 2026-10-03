import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { importAccess } from "@/lib/import/access";
import { applyItem, type JobCtx, type JobResults } from "@/lib/import/server";
import type { ImportItem } from "@/lib/import/parse";

export const maxDuration = 60;
const BUDGET_MS = 40_000;

/**
 * Process the next items of an import, stopping after ~40s so the function
 * never times out. The page calls this in a loop until status is "done".
 * Progress (cursor, results, downloaded-image map) is saved after each run,
 * so a closed tab can resume where it stopped.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await importAccess("write");
  if ("error" in access) return access.error;
  const { id } = await params;
  const { data: job } = await access.admin.from("import_jobs").select("*")
    .eq("id", id).eq("tenant_id", access.tenantId).maybeSingle();
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.status === "done") return NextResponse.json({ status: "done", cursor: job.cursor, total: (job.items as unknown[]).length, results: job.results });

  const items = job.items as ImportItem[];
  const ctx: JobCtx = {
    admin: access.admin, tenantId: access.tenantId, userId: access.userId, source: job.source, sourceLabel: job.source_label,
    mediaMap: (job.options as { mediaMap?: Record<string, string> })?.mediaMap ?? {},
    results: job.results as JobResults,
  };
  let cursor = job.cursor as number;
  const started = Date.now();
  while (cursor < items.length && Date.now() - started < BUDGET_MS) {
    const item = items[cursor];
    try {
      await applyItem(ctx, item);
    } catch (e) {
      ctx.results.failed++;
      const name = "title" in item ? item.title : "name" in item ? item.name : item.email ?? item.phone;
      if (ctx.results.errors.length < 50) ctx.results.errors.push(`${name}: ${e instanceof Error ? e.message : "failed"}`);
    }
    cursor++;
  }
  const status = cursor >= items.length ? "done" : "running";
  await access.admin.from("import_jobs").update({
    cursor, status, results: ctx.results, options: { ...(job.options as object), mediaMap: ctx.mediaMap },
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (status === "done") { revalidatePath("/dashboard/pages"); revalidatePath("/dashboard/posts"); }
  return NextResponse.json({ status, cursor, total: items.length, results: ctx.results });
}
