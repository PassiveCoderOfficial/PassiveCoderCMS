import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiUser } from "@/lib/auth/api-caller";
import { getStaff, staffSites } from "@/lib/staff";

const BUCKET = "backups";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });
  // Exactly tenantId/folder/file — no "..", no extra segments, so the
  // tenant check below always applies to the file actually downloaded.
  if (!/^[0-9a-f-]{36}\/[\w.-]+\/[\w.-]+$/i.test(path) || path.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
    // Web cookie session or mobile Bearer token (apps/mobile-admin).
    const user = await apiUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();

  // Path format: tenantId/YYYY-MM-DD/file.ext
  const tenantId = path.split("/")[0];

  const { data: member } = await admin
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: sa } = await admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();

  // A backup holds every customer record: owners and admins only.
  let allowed = (!!member && ["owner", "admin"].includes(member.role as string)) || !!sa;

  if (!allowed) {
    const agent = await getStaff();
    if (agent) {
      const { data: tenant } = await staffSites(admin.from("tenants").select("id").eq("id", tenantId), agent).maybeSingle();
      allowed = !!tenant;
    }
  }

  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Send the browser straight to storage with a 5-minute link: passing the
  // file through this function failed for anything over Vercel's 4.5 MB
  // response limit, which is most backups.
  const filename = `${(path.split("/")[1] ?? "backup").slice(0, 10)}-${path.split("/").pop() ?? "backup.zip"}`;
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, 300, { download: filename });
  if (error || !data?.signedUrl) return NextResponse.json({ error: "File not found" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl, 302);
}
