import { createAdminClient } from "@/lib/supabase/server";
import { CARE_COLUMNS, DEV_COLUMNS, type CarePlan, type DevPackage } from "./catalog";

/** Development packages (basic/pro/biz) and Care plans, in display order. */
export async function loadCatalog(): Promise<{ packages: DevPackage[]; care: CarePlan[] }> {
  const admin = await createAdminClient();
  const [{ data: pk }, { data: cp }] = await Promise.all([
    admin.from("plans").select(DEV_COLUMNS).eq("is_active", true).not("dev_price_usd_cents", "is", null).order("sort_order"),
    admin.from("care_plans").select(CARE_COLUMNS).eq("is_active", true).order("sort_order"),
  ]);
  return {
    packages: ((pk ?? []) as unknown as DevPackage[]).map((p) => ({ ...p, features: Array.isArray(p.features) ? p.features : [] })),
    care: ((cp ?? []) as unknown as CarePlan[]).map((c) => ({ ...c, features: Array.isArray(c.features) ? c.features : [] })),
  };
}
