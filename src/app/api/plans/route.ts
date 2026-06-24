import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const admin = await createAdminClient();
  const { data: rows, error } = await admin
    .from("plans")
    .select("id, name, price_yearly, price_monthly, storage_gb, visitor_limit_monthly, overage_cents_per_1k, features, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order");

  if (error || !rows?.length) {
    // Fallback to DB seed values if query fails
    return NextResponse.json({ plans: [] }, { status: 500 });
  }

  // DB stores prices in cents, onboarding expects dollars
  const plans = rows.map(p => ({
    id: p.id,
    name: p.name,
    price_yearly: Math.round((p.price_yearly ?? 0) / 100),
    price_monthly: Math.round((p.price_monthly ?? 0) / 100),
    storage_gb: p.storage_gb ?? 0,
    visitor_limit_monthly: p.visitor_limit_monthly ?? 0,
    overage_cents_per_1k: p.overage_cents_per_1k ?? 0,
    features: Array.isArray(p.features) ? p.features : [],
  }));

  return NextResponse.json({ plans });
}
