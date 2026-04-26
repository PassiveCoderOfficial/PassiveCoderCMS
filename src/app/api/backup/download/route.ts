import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const BUCKET = "backups";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const supabase = await createAdminClient();

  // Auth check — ensure path belongs to a tenant the user is a member of
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Path format: tenantId/YYYY-MM-DD/file.ext
  const tenantId = path.split("/")[0];
  const { data: member } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .single();
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const filename = path.split("/").pop() ?? "backup";
  return new NextResponse(data, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": data.type || "application/octet-stream",
    },
  });
}
