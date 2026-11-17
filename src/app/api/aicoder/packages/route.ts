import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiUser } from "@/lib/auth/api-caller";

/** Public-to-tenants list of purchasable top-up packages — no pricing/product
 *  internals beyond what's needed to render a "Buy" button. */
export async function GET() {
  // Web cookie session or mobile Bearer.
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const { data } = await admin
    .from("ai_generation_packages")
    .select("id, name, credits, price_usd_cents")
    .eq("active", true)
    .order("sort_order");

  // "generations" is the same number for app builds from before AI Credits.
  return NextResponse.json({ packages: (data ?? []).map((p) => ({ ...p, generations: p.credits })) });
}
