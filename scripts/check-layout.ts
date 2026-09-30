/**
 * Layout-clone check for a site's homepage — run after any hand-built seed.
 *
 *   npx tsx --env-file=.env.local scripts/check-layout.ts <slug>          check
 *   npx tsx --env-file=.env.local scripts/check-layout.ts <slug> --fix    re-vary and save
 *
 * Compares the homepage's section order and layouts with the most recently
 * built sites (modules/page-builder/layout-diversity.ts). Exits 1 when it is
 * a clone (similarity above CLONE_THRESHOLD) so it can gate a seed script.
 */
import { createAdminClient } from "@/lib/supabase/server";
import { CLONE_THRESHOLD, diversifyBlocks, layoutSignature, layoutSimilarity, recentHomeLayouts } from "@/modules/page-builder/layout-diversity";

(async () => {
  const [slug, flag] = process.argv.slice(2);
  if (!slug) { console.error("usage: check-layout.ts <slug> [--fix]"); process.exit(2); }
  const admin = await createAdminClient();
  const { data: t } = await admin.from("tenants").select("id").eq("slug", slug).single();
  if (!t) { console.error("no such site"); process.exit(2); }
  const { data: page } = await admin.from("pages").select("id, blocks").eq("tenant_id", t.id).eq("slug", "home").eq("status", "published").order("created_at").limit(1).maybeSingle();
  const blocks = (page?.blocks ?? []) as Record<string, unknown>[];
  const recent = await recentHomeLayouts(admin, 8, t.id);

  const report = (sig: string[]) => {
    const rows = recent.map((r) => ({ site: r.slug, similarity: layoutSimilarity(sig, r.signature) })).sort((a, b) => b.similarity - a.similarity);
    console.table(rows);
    return rows[0]?.similarity ?? 0;
  };
  let sig = layoutSignature(blocks);
  console.log(`${slug}: ${sig.join(" > ")}`);
  let worst = report(sig);

  if (flag === "--fix" && worst > CLONE_THRESHOLD) {
    const next = diversifyBlocks(blocks as never[], recent, slug);
    await admin.from("pages").update({ blocks: next }).eq("id", page!.id);
    sig = layoutSignature(next);
    console.log(`\nre-varied and saved: ${sig.join(" > ")}`);
    worst = report(sig);
  }
  const ok = worst <= CLONE_THRESHOLD;
  console.log(ok ? `OK (max similarity ${worst})` : `CLONE: max similarity ${worst} > ${CLONE_THRESHOLD}. Re-run with --fix or rework the layout.`);
  process.exit(ok ? 0 : 1);
})();
