import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireManagerOrSuperAdmin } from "@/lib/super-admin";
import { verifyBearerManagerOrSuperAdminUser } from "@/lib/auth/verify-bearer";

const VALID_STATUSES = ["trial", "active", "suspended", "cancelled"] as const;

/** Change a tenant's status (suspend/reactivate/cancel). Super admin or
 *  pc_staff manager — matches the web SA panel's entry gate. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: siteId } = await params;

  const caller = (await requireManagerOrSuperAdmin()) ?? (await verifyBearerManagerOrSuperAdminUser(req));
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { status } = await req.json().catch(() => ({}));
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("tenants")
    .update({ status })
    .eq("id", siteId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
