import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { site_id } = await req.json();
  if (!site_id) return NextResponse.json({ error: "Missing site_id" }, { status: 400 });

  const supabase = await createAdminClient();

  // Verify user is member of this site
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("tenant_id", site_id)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Not a member of this site" }, { status: 403 });

  // Clear all primaries for user, then set new one
  await supabase
    .from("tenant_members")
    .update({ is_primary: false })
    .eq("user_id", user.id);

  await supabase
    .from("tenant_members")
    .update({ is_primary: true })
    .eq("user_id", user.id)
    .eq("tenant_id", site_id);

  return NextResponse.json({ ok: true });
}
