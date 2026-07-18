import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/super-admin";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const admin = await createAdminClient();

  // auth.users has no direct email lookup via the JS client — page through
  // admin.listUsers and match. Fine at this scale (SA-only, infrequent call).
  let targetUserId: string | null = null;
  const normalizedEmail = email.trim().toLowerCase();
  for (let page = 1; page <= 20 && !targetUserId; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const match = data.users.find(u => u.email?.toLowerCase() === normalizedEmail);
    if (match) targetUserId = match.id;
    if (data.users.length < 200) break;
  }

  if (!targetUserId) {
    return NextResponse.json({ error: `No user found with email ${email}` }, { status: 404 });
  }

  // Demote any existing owner to admin (a tenant has exactly one owner).
  const { error: demoteErr } = await admin
    .from("tenant_members")
    .update({ role: "admin" })
    .eq("tenant_id", tenantId)
    .eq("role", "owner");
  if (demoteErr) return NextResponse.json({ error: demoteErr.message }, { status: 500 });

  // Upsert the new owner's membership.
  const { error: memberErr } = await admin
    .from("tenant_members")
    .upsert(
      { tenant_id: tenantId, user_id: targetUserId, role: "owner" },
      { onConflict: "tenant_id,user_id" },
    );
  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 });

  // Keep tenants.owner_id in sync — some flows (login-as fallback, RLS checks
  // elsewhere) read owner_id directly instead of joining tenant_members.
  const { error: ownerErr } = await admin
    .from("tenants")
    .update({ owner_id: targetUserId })
    .eq("id", tenantId);
  if (ownerErr) return NextResponse.json({ error: ownerErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, user_id: targetUserId });
}
