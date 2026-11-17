import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller, apiSupabase } from "@/lib/auth/api-caller";
import { canWriteSite } from "@/lib/auth/site-write";
import { META_PIXEL_RE } from "@/lib/analytics/meta-pixel-id";

/** Save (or clear) the site's Meta (Facebook) Pixel id. */
export async function POST(req: NextRequest) {
  const supabase = await apiSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(tenantId))) return NextResponse.json({ error: "Your role can't make changes on this site." }, { status: 403 });

  const { pixel_id } = await req.json().catch(() => ({}));
  // Accept the bare id or the whole pasted base code: pull the id out of fbq('init', '...').
  const raw = typeof pixel_id === "string" ? pixel_id.trim() : "";
  const id = raw.match(/fbq\(\s*['"]init['"]\s*,\s*['"](\d{10,20})['"]/)?.[1] ?? raw.match(/[?&]id=(\d{10,20})/)?.[1] ?? raw;
  if (id && !META_PIXEL_RE.test(id)) {
    return NextResponse.json({ error: "That doesn't look like a Meta Pixel ID (15-16 digits, from Events Manager)" }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { error } = await admin.from("site_settings").update({ meta_pixel_id: id || null }).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: id || null });
}
