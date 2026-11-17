import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiUser } from "@/lib/auth/api-caller";
import { canResetPasswordInTransfer, canTransferTenant, transferAuthority } from "@/lib/tenant/can-transfer";

/**
 * Reports whether an email already has an account, so the transfer form can
 * say so BEFORE submitting.
 *
 * Without this the form silently ignored the password fields for an existing
 * email and still reported success, leaving whoever ran it believing they had
 * set credentials that were never set — which is exactly what happened on a
 * real handover.
 *
 * Gated behind the same permission as the transfer itself: this answers "does
 * an account exist for this address", which is a user-enumeration oracle if
 * left open. Only people who could already transfer the site can ask.
 */
export async function POST(req: Request) {
  // Cookie session on the web, Bearer token from the phone app.
  const user = await apiUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantId, email } = await req.json().catch(() => ({}));
  if (!tenantId || !email) {
    return NextResponse.json({ error: "Missing site or email" }, { status: 400 });
  }

  const admin = await createAdminClient();
  if (!await canTransferTenant(admin, user.id, tenantId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const normalized = String(email).trim().toLowerCase();
  let exists = false;
  let isCurrentOwner = false;

  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const match = data.users.find(u => u.email?.toLowerCase() === normalized);
    if (match) {
      exists = true;
      const { data: tenant } = await admin
        .from("tenants").select("owner_id").eq("id", tenantId).maybeSingle();
      isCurrentOwner = tenant?.owner_id === match.id;
      break;
    }
    if (data.users.length < 200) break;
  }

  // The form only offers a password reset to people who may use it.
  // Never offered for your own address: a transfer to yourself must not change
  // your own password (it signs you out everywhere with a password you may not know).
  const isSelf = !!user.email && user.email.toLowerCase() === normalized;
  const canResetPassword = !isSelf && canResetPasswordInTransfer(await transferAuthority(admin, user.id, tenantId));
  return NextResponse.json({ exists, isCurrentOwner, isSelf, canResetPassword });
}
