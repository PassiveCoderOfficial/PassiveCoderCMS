import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { canWriteSite } from "@/lib/auth/site-write";
import { GTM_ID_RE } from "@/components/site/google-tag-manager";

/** Save (or clear) the site's Google Tag Manager container id. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(tenantId))) return NextResponse.json({ error: "Your role can't make changes on this site." }, { status: 403 });

  const { gtm_id } = await req.json().catch(() => ({}));
  // Accept the bare id or a pasted snippet: pull the GTM-XXXX out of it.
  const raw = typeof gtm_id === "string" ? gtm_id.trim() : "";
  const id = (raw.match(/GTM-[A-Z0-9]+/i)?.[0] ?? raw).toUpperCase();
  if (id && !GTM_ID_RE.test(id)) {
    return NextResponse.json({ error: "That doesn't look like a Tag Manager ID (should look like GTM-XXXXXXX)" }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { error } = await admin.from("site_settings").update({ gtm_container_id: id || null }).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: id || null });
}
