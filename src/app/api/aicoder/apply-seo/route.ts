import { NextResponse } from "next/server";
import { isViewOnlyMember } from "@/lib/auth/site-write";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller, apiSupabase } from "@/lib/auth/api-caller";
import { requireModule } from "@/lib/modules/resolve-modules";
import type { PageSEO } from "@/types/cms";

// Model calls regularly exceed the platform's default function timeout, which
// surfaces in the UI as a bare "upstream request failed" string.
export const maxDuration = 300;

/**
 * Writes the planner's SEO title/description onto a page.
 *
 * Kept as its own endpoint rather than folded into the block-apply path
 * because the two have genuinely different lifetimes: blocks go through the
 * builder store (so undo/redo and the snapshot trigger cover them) and are
 * only persisted when the user hits Save, whereas `pages.seo` is a direct row
 * write with no store representation. Bundling them would mean SEO landed in
 * the database while the blocks it describes were still unsaved in the editor.
 *
 * Merges into the existing `seo` object instead of replacing it — a page may
 * already carry og_image, canonical or no_index that AiCoder knows nothing
 * about, and silently dropping those would be data loss the user never asked
 * for.
 */
export async function POST(req: Request) {
  const supabase = await apiSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // View-only team members cannot do this (owner, admin, editor, staff and super admins can).
  if (await isViewOnlyMember(tenantId)) return NextResponse.json({ error: "Your role on this site is view only, so it can't use AI building." }, { status: 403 });

  if (!await requireModule(tenantId, "ai_coder")) {
    return NextResponse.json({ error: "AiCoder isn't included in this site's plan" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { pageId, title, description } = body as {
    pageId?: string; title?: string; description?: string;
  };

  if (!pageId) return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
  if (!title?.trim() && !description?.trim()) {
    return NextResponse.json({ error: "Nothing to apply" }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Scope the read by tenant as well as id — the admin client bypasses RLS, so
  // this is the only thing stopping a valid session from writing SEO onto
  // another tenant's page by guessing its id.
  const { data: page } = await admin
    .from("pages")
    .select("id, seo")
    .eq("id", pageId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  const existing = (page.seo ?? {}) as PageSEO;
  const seo: PageSEO = {
    ...existing,
    ...(title?.trim() ? { title: title.trim().slice(0, 70) } : {}),
    ...(description?.trim() ? { description: description.trim().slice(0, 200) } : {}),
  };

  const { error } = await admin.from("pages").update({ seo }).eq("id", pageId).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, seo });
}
