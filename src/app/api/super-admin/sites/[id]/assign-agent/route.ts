import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireManagerOrSuperAdmin } from "@/lib/super-admin";
import { verifyBearerManagerOrSuperAdminUser } from "@/lib/auth/verify-bearer";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: siteId } = await params;

  const caller = (await requireManagerOrSuperAdmin()) ?? (await verifyBearerManagerOrSuperAdminUser(req));
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { agent_id } = await req.json();
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("tenants")
    .update({ assigned_staff_id: agent_id ?? null })
    .eq("id", siteId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
