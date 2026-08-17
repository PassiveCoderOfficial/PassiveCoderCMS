import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/** Public-to-tenants list of purchasable top-up packages — no pricing/product
 *  internals beyond what's needed to render a "Buy" button. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const { data } = await admin
    .from("ai_generation_packages")
    .select("id, name, generations, price_usd_cents")
    .eq("active", true)
    .order("sort_order");

  return NextResponse.json({ packages: data ?? [] });
}
