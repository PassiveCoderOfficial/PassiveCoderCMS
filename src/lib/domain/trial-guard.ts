import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/super-admin";
import { verifyBearerSuperAdminUser } from "@/lib/auth/verify-bearer";
import { isTrialSite, TRIAL_DOMAIN_MESSAGE } from "@/lib/sites/trial-site";

/**
 * A site on the free trial cannot connect, buy or verify its own domain
 * (owner decision 2026-11-16): trial sites are free and anonymous to create,
 * and a custom domain would give one a trusted-looking address. Super admins
 * may still do it for a client. Returns the refusal, or null to carry on.
 */
export async function trialDomainRefusal(req: Request, tenantId: string): Promise<NextResponse | null> {
  if (!(await isTrialSite(tenantId))) return null;
  // Web session first, then the mobile app's Bearer token.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user ? await isSuperAdmin(user.id) : !!(await verifyBearerSuperAdminUser(req))) return null;
  return NextResponse.json({ error: TRIAL_DOMAIN_MESSAGE, code: "trial_site" }, { status: 403 });
}
