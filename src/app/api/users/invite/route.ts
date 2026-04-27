import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, role, tenantId } = await req.json();
  if (!email || !role || !tenantId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Verify caller is admin/owner of this tenant
  const { data: caller } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .single();

  if (!caller || !["owner", "admin"].includes(caller.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = await createAdminClient();

  // Check if user already exists
  const { data: { users } } = await admin.auth.admin.listUsers();
  const existing = users.find(u => u.email === email);

  if (existing) {
    // Add directly to tenant_members
    const { error } = await admin.from("tenant_members").upsert(
      { tenant_id: tenantId, user_id: existing.id, role, joined_at: new Date().toISOString() },
      { onConflict: "tenant_id,user_id" },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, existing: true });
  }

  // Invite new user via Supabase auth
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { tenant_id: tenantId, invited_role: role },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
  });

  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 500 });

  // Pre-create tenant_members row so they have access on first login
  await admin.from("tenant_members").upsert(
    { tenant_id: tenantId, user_id: invited.user.id, role, joined_at: new Date().toISOString() },
    { onConflict: "tenant_id,user_id" },
  );

  return NextResponse.json({ ok: true });
}
