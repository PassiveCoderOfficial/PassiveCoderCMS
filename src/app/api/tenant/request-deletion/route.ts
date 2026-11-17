import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { canWriteSite } from "@/lib/auth/site-write";

// Web cookie session or mobile Bearer + X-Tenant-Id. Asking to delete (or
// un-asking) needs write rights on the site, not just membership.

export async function GET(req: Request) {
  const tenantId = (await getApiCaller(req))?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await createAdminClient();
  const { data } = await admin.from("tenants").select("deletion_requested_at").eq("id", tenantId).maybeSingle();
  return NextResponse.json({ deletion_requested_at: data?.deletion_requested_at ?? null });
}

export async function POST(req: Request) {
  const caller = await getApiCaller(req);
  const supabase = caller?.supabase;
  const user = caller?.user;
  if (!supabase || !user?.email || !caller.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(caller.tenantId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: "Password required" }, { status: 400 });

  // Re-verify the caller's own password before flagging deletion — this does
  // NOT change the active session, just confirms they still know their password.
  const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email, password });
  if (authErr) return NextResponse.json({ error: "Incorrect password" }, { status: 401 });

  const tenantId = caller.tenantId;
  const admin = await createAdminClient();

  const { error } = await admin
    .from("tenants")
    .update({ deletion_requested_at: new Date().toISOString(), deletion_requested_by: user.id })
    .eq("id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  // Cancel a pending deletion request.
  const tenantId = (await getApiCaller(req))?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(tenantId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = await createAdminClient();

  const { error } = await admin
    .from("tenants")
    .update({ deletion_requested_at: null, deletion_requested_by: null, delete_scheduled_for: null })
    .eq("id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
