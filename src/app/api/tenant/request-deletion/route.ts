import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";

export async function GET() {
  const tenantId = await getCurrentTenantId();
  const admin = await createAdminClient();
  const { data } = await admin.from("tenants").select("deletion_requested_at").eq("id", tenantId).maybeSingle();
  return NextResponse.json({ deletion_requested_at: data?.deletion_requested_at ?? null });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: "Password required" }, { status: 400 });

  // Re-verify the caller's own password before flagging deletion — this does
  // NOT change the active session, just confirms they still know their password.
  const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email, password });
  if (authErr) return NextResponse.json({ error: "Incorrect password" }, { status: 401 });

  const tenantId = await getCurrentTenantId();
  const admin = await createAdminClient();

  const { error } = await admin
    .from("tenants")
    .update({ deletion_requested_at: new Date().toISOString(), deletion_requested_by: user.id })
    .eq("id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  // Cancel a pending deletion request.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getCurrentTenantId();
  const admin = await createAdminClient();

  const { error } = await admin
    .from("tenants")
    .update({ deletion_requested_at: null, deletion_requested_by: null })
    .eq("id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
