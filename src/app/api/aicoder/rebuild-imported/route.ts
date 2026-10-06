import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { importAccess } from "@/lib/import/access";
import { requireModule } from "@/lib/modules/resolve-modules";
import { AiCoderError } from "@/lib/aicoder/generate";
import { parseBrief, planPage } from "@/lib/aicoder/plan";
import { renderProfileBrief, mergeBrief } from "@/lib/aicoder/profile-brief";
import { buildPageFromPlan } from "@/lib/aicoder/build-page";
import { assertBatchAffordable, AiCoderQuotaError } from "@/lib/aicoder/quota";
import type { Block } from "@/types/cms";

export const maxDuration = 300;

/** Readable text and image URLs out of a page's blocks (imported pages are one text block of HTML). */
function extract(blocks: Block[]): { text: string; images: string[] } {
  const html = JSON.stringify(blocks);
  const images = [...new Set([...html.matchAll(/https?:\/\/[^"\\\s]+?\.(?:jpe?g|png|webp|avif)/gi)].map((m) => m[0]))].slice(0, 10);
  const text = blocks.map((b) => String((b.data as { content?: string })?.content ?? ""))
    .join("\n")
    .replace(/<(h[1-6])[^>]*>/gi, "\n\n## ").replace(/<\/(p|li|h[1-6]|div|tr|blockquote)>/gi, "\n").replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8217;|&rsquo;/g, "'")
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
  return { text, images };
}

/**
 * "Rebuild with AI" for a page that came in through Import / Export. AiCoder
 * reads the imported page's text as the brief and rebuilds it as designed
 * Passive Coder sections, keeping its facts. The imported version is kept in
 * settings.imported.original_blocks (and in page history) so it can be
 * restored. Uses AI generations like any other AiCoder build.
 */
export async function POST(req: Request) {
  const access = await importAccess("write");
  if ("error" in access) return access.error;
  const { admin, tenantId, userId } = access;
  if (!await requireModule(tenantId, "ai_coder")) {
    return NextResponse.json({ error: "AI page building isn't included in this site's plan." }, { status: 403 });
  }
  const { pageId, restore } = await req.json().catch(() => ({})) as { pageId?: string; restore?: boolean };
  const { data: page } = await admin.from("pages").select("id, title, slug, status, blocks, settings, draft_rev")
    .eq("id", pageId ?? "").eq("tenant_id", tenantId).maybeSingle();
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });
  const settings = (page.settings ?? {}) as Record<string, unknown> & { imported?: Record<string, unknown> };
  if (!settings.imported) return NextResponse.json({ error: "Only imported pages can be rebuilt this way." }, { status: 400 });
  const live = page.status === "published";

  const save = async (blocks: Block[], imported: Record<string, unknown>) => {
    const patch = live
      ? { draft_blocks: blocks, draft_rev: ((page.draft_rev as number) ?? 0) + 1 }
      : { blocks };
    const { error } = await admin.from("pages").update({ ...patch, settings: { ...settings, imported }, updated_at: new Date().toISOString() }).eq("id", page.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/pages");
  };

  if (restore) {
    const original = settings.imported.original_blocks as Block[] | undefined;
    if (!original) return NextResponse.json({ error: "Nothing to restore." }, { status: 400 });
    const { original_blocks: _o, rebuilt_at: _r, ...rest } = settings.imported; // eslint-disable-line @typescript-eslint/no-unused-vars
    await save(original, rest);
    return NextResponse.json({ ok: true, restored: true });
  }

  const source = (settings.imported.original_blocks as Block[] | undefined) ?? (page.blocks as Block[]);
  const { text, images } = extract(source);
  if (text.length < 40) return NextResponse.json({ error: "This page has too little text for AI to rebuild from." }, { status: 400 });

  const brief = [
    `Rebuild the page "${page.title}" for this business's website. It was imported from their old WordPress site.`,
    "Keep its meaning and every concrete fact: services, prices, opening hours, locations, contact details, names, numbers.",
    "Do not invent prices, awards, statistics, testimonials or claims that aren't in the original.",
    "Organise it into clear, modern sections a visitor can scan.",
    "",
    "Original page content:",
    text.slice(0, 12000),
    images.length ? `\nPhotos from the original page (reuse where they fit):\n${images.join("\n")}` : "",
  ].join("\n");

  try {
    const facts = await parseBrief(mergeBrief(await renderProfileBrief(tenantId), brief));
    const isHome = ["home", "index", "homepage"].includes(page.slug as string);
    const plan = await planPage(facts, brief, isHome ? "home" : "interior");

    // Match the site: drop per-page header/footer sections if the site's other pages don't use them.
    const { data: others } = await admin.from("pages").select("blocks").eq("tenant_id", tenantId).eq("status", "published").neq("id", page.id).limit(5);
    const siteUsesNav = (others ?? []).some((o) => (o.blocks as Block[] | null)?.some((b) => b.type === "navigation"));
    const sections = plan.sections.filter((s) => siteUsesNav || (s.blockType !== "navigation" && s.blockType !== "footer")).slice(0, 12);

    try { await assertBatchAffordable(tenantId, sections.length); }
    catch (e) { if (e instanceof AiCoderQuotaError) return NextResponse.json({ error: e.message }, { status: 402 }); throw e; }

    const result = await buildPageFromPlan(sections, facts, tenantId, userId);
    if (!result.blocks.length) {
      return NextResponse.json({ error: result.sections.find((s) => s.error)?.error ?? "AI couldn't rebuild this page." }, { status: 502 });
    }
    await save(result.blocks, { ...settings.imported, original_blocks: source, rebuilt_at: new Date().toISOString() });
    return NextResponse.json({ ok: true, sections: result.blocks.length, generationsUsed: result.generationsUsed, failed: result.failedCount, live });
  } catch (e) {
    const msg = e instanceof AiCoderError || e instanceof Error ? e.message : "AI rebuild failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
