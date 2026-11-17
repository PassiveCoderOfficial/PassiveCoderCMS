import "server-only";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { autoFillSeo } from "@/lib/seo/ai-meta";
import type { SupabaseClient } from "@supabase/supabase-js";
import { applyItem, type JobCtx, type JobResults } from "./server";
import type { ImportItem } from "./parse";

const BUDGET_MS = 40_000;
const MAX_ITEMS = 5000;
const KINDS = ["page", "post", "product", "contact", "order", "menu"];

type Who = { admin: SupabaseClient; tenantId: string; userId: string };

/** Append a chunk of normalised items to a job that hasn't started yet. */
export async function appendItems(w: Who, id: string, raw: unknown[]): Promise<{ total: number } | { error: string; status: number }> {
  const items = (raw as { kind?: string }[]).filter((i) => KINDS.includes(i?.kind ?? ""));
  const { data: job } = await w.admin.from("import_jobs").select("items, status").eq("id", id).eq("tenant_id", w.tenantId).maybeSingle();
  if (!job) return { error: "Not found", status: 404 };
  if (job.status !== "ready") return { error: "This import has already started.", status: 409 };
  const all = [...(job.items as unknown[]), ...items];
  if (all.length > MAX_ITEMS) return { error: `One import can hold up to ${MAX_ITEMS} items. Split it and import in parts.`, status: 400 };
  const { error } = await w.admin.from("import_jobs").update({ items: all, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message, status: 400 };
  return { total: all.length };
}

/**
 * Process the next items of an import, stopping after ~40s so the function
 * never times out; callers loop until status is "done". Progress (cursor,
 * results, downloaded-image map) is saved after each run, so an interrupted
 * import resumes where it stopped.
 */
export async function runJobStep(w: Who, id: string, budgetMs = BUDGET_MS) {
  const { data: job } = await w.admin.from("import_jobs").select("*").eq("id", id).eq("tenant_id", w.tenantId).maybeSingle();
  if (!job) return null;
  const items = job.items as ImportItem[];
  if (job.status === "done") return { status: "done", cursor: job.cursor as number, total: items.length, results: job.results as JobResults };

  const ctx: JobCtx = {
    admin: w.admin, tenantId: w.tenantId, userId: w.userId, source: job.source, sourceLabel: job.source_label,
    mediaMap: (job.options as { mediaMap?: Record<string, string> })?.mediaMap ?? {},
    results: job.results as JobResults,
  };
  let cursor = job.cursor as number;
  const started = Date.now();
  while (cursor < items.length && Date.now() - started < budgetMs) {
    const item = items[cursor];
    try {
      await applyItem(ctx, item);
    } catch (e) {
      ctx.results.failed++;
      const name = "title" in item ? item.title : "name" in item ? item.name : item.kind === "order" ? `Order ${item.number}` : item.email ?? item.phone;
      if (ctx.results.errors.length < 50) ctx.results.errors.push(`${name}: ${e instanceof Error ? e.message : "failed"}`);
    }
    cursor++;
  }
  const status = cursor >= items.length ? "done" : "running";
  await w.admin.from("import_jobs").update({
    cursor, status, results: ctx.results, options: { ...(job.options as object), mediaMap: ctx.mediaMap },
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (status === "done") {
    revalidatePath("/dashboard/pages"); revalidatePath("/dashboard/posts");
    // Imported pages rarely carry usable meta: fill the empty ones (free).
    after(() => autoFillSeo(w.admin, w.tenantId).then(() => undefined).catch((e) => console.error("[seo] autofill", e instanceof Error ? e.message : e)));
  }
  return { status, cursor, total: items.length, results: ctx.results };
}
