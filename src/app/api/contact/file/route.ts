import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiUser } from "@/lib/auth/api-caller";

/**
 * GET /api/contact/file?p=<path> — open a file a visitor attached to a
 * contact form. Only members of the site that owns it (first path segment is
 * the tenant id) or super admins get a short-lived signed URL.
 * The mobile app sends a Bearer token and `json=1` to get { url } back
 * instead of a redirect.
 */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const path = sp.get("p") ?? "";
  const asJson = sp.get("json") === "1";
  const tenantId = path.split("/")[0];
  if (!/^[0-9a-f-]{36}$/.test(tenantId) || path.includes("..")) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await apiUser(req);
  if (!user && asJson) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user) return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`, req.url));

  const admin = await createAdminClient();
  const [{ data: member }, { data: sa }] = await Promise.all([
    admin.from("tenant_members").select("user_id").eq("tenant_id", tenantId).eq("user_id", user.id).maybeSingle(),
    admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);
  if (!member && !sa) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const { data, error } = await admin.storage.from("form-uploads").createSignedUrl(path, 300);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (asJson) return NextResponse.json({ url: data.signedUrl });
  return NextResponse.redirect(data.signedUrl);
}
