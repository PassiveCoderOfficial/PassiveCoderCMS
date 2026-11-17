import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller, apiSupabase } from "@/lib/auth/api-caller";
import { canWriteSite } from "@/lib/auth/site-write";
import { missingSocialColumn, socialLinksSchema } from "@/lib/social-links";
import { invalidateSiteCache } from "@/lib/supabase/public-cache";

/**
 * The site's social profiles (Business Profile > Social Media), read by the
 * header top bar, footer and Social Links block. GET also returns the links
 * already typed into the header/footer blocks, so the screen can offer them
 * as a starting point when nothing is saved yet.
 */
const NEEDS_DB = "Social links need a database update (migration 165_social_links.sql). Ask Passive Coder to apply it.";

async function auth() {
  const supabase = await apiSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!tenantId) return { error: NextResponse.json({ error: "No tenant" }, { status: 404 }) };
  return { tenantId };
}

type BlockLike = { type?: string; data?: { socials?: unknown; topBar?: { socials?: unknown } } };

export async function GET() {
  const a = await auth();
  if (a.error) return a.error;
  const admin = await createAdminClient();
  const [{ data, error }, { data: idn }] = await Promise.all([
    admin.from("tenant_business_profiles").select("social_links").eq("tenant_id", a.tenantId).maybeSingle(),
    admin.from("site_identity").select("global_header, global_footer").eq("tenant_id", a.tenantId).maybeSingle(),
  ]);
  // Links typed into the header top bar / footer before the central list existed.
  const fromBlocks: { platform: string; url: string }[] = [];
  for (const b of [...((idn?.global_header as BlockLike[] | null) ?? []), ...((idn?.global_footer as BlockLike[] | null) ?? [])]) {
    for (const s of [b.data?.topBar?.socials, b.data?.socials]) {
      if (Array.isArray(s)) for (const x of s as { platform?: string; url?: string }[]) {
        if (x?.platform && x.url && !fromBlocks.some((f) => f.platform === x.platform)) fromBlocks.push({ platform: x.platform, url: x.url });
      }
    }
  }
  if (error) return NextResponse.json({ links: [], fromBlocks, available: !missingSocialColumn(error), error: missingSocialColumn(error) ? NEEDS_DB : error.message });
  return NextResponse.json({ links: (data?.social_links as unknown[] | null) ?? [], fromBlocks, available: true });
}

export async function PUT(req: Request) {
  const a = await auth();
  if (a.error) return a.error;
  if (!(await canWriteSite(a.tenantId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = socialLinksSchema.safeParse((await req.json().catch(() => ({}))).links);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid links" }, { status: 400 });
  const admin = await createAdminClient();
  const { error } = await admin.from("tenant_business_profiles")
    .upsert({ tenant_id: a.tenantId, social_links: parsed.data, updated_at: new Date().toISOString() }, { onConflict: "tenant_id" });
  if (error) return NextResponse.json({ error: missingSocialColumn(error) ? NEEDS_DB : error.message }, { status: missingSocialColumn(error) ? 503 : 500 });
  invalidateSiteCache(a.tenantId);
  return NextResponse.json({ links: parsed.data });
}
