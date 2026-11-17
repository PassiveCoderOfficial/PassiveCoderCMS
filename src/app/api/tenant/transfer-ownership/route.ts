import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { transferSite } from "@/lib/tenant/site-transfer";
import { verifyBearerUser } from "@/lib/auth/verify-bearer";

/**
 * Transfers a site to its client, optionally creating their account.
 *
 * One endpoint for all three callers (SA panel, staff, tenant admins) rather
 * than a route each: this changes who controls a customer's site, so the
 * authorization and the ownership writes should have exactly one
 * implementation to audit, not three that drift apart.
 *
 * Who may transfer:
 *   - super admins: any site
 *   - Staff Managers: any site but the root site, within transfer-rules.ts
 *   - staff: only sites assigned to or referred by them, i.e. ones they built
 *   - a site's owner: that site
 * A staff member cannot transfer an arbitrary site by guessing its id, and an
 * owner cannot reach another tenant's. Only super admins and managers can set
 * the password of an account that already exists.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user: cookieUser } } = await supabase.auth.getUser();
  // Mobile has no session cookie — fall back to a Bearer Supabase JWT.
  const bearerUser = cookieUser ? null : await verifyBearerUser(req);
  const user = cookieUser ?? (bearerUser ? { id: bearerUser.userId } : null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    tenantId, email, password, fullName,
    requirePasswordChange, resetExistingPassword, previousOwner,
  } = body as {
    tenantId?: string; email?: string; password?: string; fullName?: string;
    requirePasswordChange?: boolean; resetExistingPassword?: boolean;
    previousOwner?: "demote" | "remove";
  };

  if (!tenantId || !email) {
    return NextResponse.json({ error: "Missing site or email" }, { status: 400 });
  }

  const admin = await createAdminClient();
  const result = await transferSite(admin, user.id, bearerUser ? "app" : "web", {
    tenantId,
    email,
    password,
    fullName,
    requirePasswordChange,
    resetExistingPassword,
    previousOwner,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    created: result.created,
    passwordSet: result.passwordSet,
    userId: result.userId,
  });
}
