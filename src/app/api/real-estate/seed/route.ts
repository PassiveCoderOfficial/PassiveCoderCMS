import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { canWriteSite } from "@/lib/auth/site-write";
import { resolveEnabledModules } from "@/lib/modules/resolve-modules";
import { seedRealEstateSample } from "@/modules/real-estate/sample-data";

/** POST — load the sample catalogue into the caller's tenant (only when it
 *  has no properties yet). */
export async function POST() {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(tenantId))) return NextResponse.json({ error: "Your role can't make changes on this site." }, { status: 403 });
  const modules = await resolveEnabledModules(tenantId);
  if (!modules.real_estate) return NextResponse.json({ error: "Real Estate module is not enabled" }, { status: 403 });
  try {
    const admin = await createAdminClient();
    return NextResponse.json(await seedRealEstateSample(admin, tenantId));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
