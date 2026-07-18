import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/super-admin";

async function authed() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), supabase: null };
  if (!await isSuperAdmin(user.id)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), supabase: null };
  const supabase = await createAdminClient();
  return { error: null, supabase };
}

export async function GET() {
  const { error, supabase } = await authed();
  if (error) return error;

  const { data, error: dbErr } = await supabase!
    .from("plans")
    .select("id, name, price_yearly, price_monthly, storage_gb, visitor_limit_monthly, overage_cents_per_1k, features, modules, sort_order")
    .order("sort_order");

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  // Return prices in dollars (DB stores cents)
  const plans = (data ?? []).map(p => ({
    ...p,
    price_yearly: Math.round(p.price_yearly / 100),
    price_monthly: Math.round((p.price_monthly ?? 0) / 100),
    visitor_limit_monthly: p.visitor_limit_monthly ?? 0,
    overage_cents_per_1k: p.overage_cents_per_1k ?? 0,
    features: Array.isArray(p.features) ? p.features : JSON.parse(p.features ?? "[]"),
    modules: p.modules ?? {},
  }));

  return NextResponse.json({ plans });
}

export async function POST(req: Request) {
  const { error, supabase } = await authed();
  if (error) return error;

  const { plans } = await req.json();
  if (!Array.isArray(plans)) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { error: dbErr } = await supabase!.from("plans").upsert(
    plans.map((p: { id: string; name: string; price_yearly: number; price_monthly?: number; storage_gb: number; visitor_limit_monthly?: number; overage_cents_per_1k?: number; features: string[]; modules?: Record<string, { included?: boolean; defaultOn?: boolean }>; sort_order?: number }, i: number) => ({
      id: p.id,
      name: p.name,
      price_yearly: Math.round(p.price_yearly * 100), // dollars → cents
      price_monthly: Math.round((p.price_monthly ?? 0) * 100),
      storage_gb: p.storage_gb,
      visitor_limit_monthly: p.visitor_limit_monthly ?? 0,
      overage_cents_per_1k: p.overage_cents_per_1k ?? 0,
      features: p.features,
      modules: p.modules ?? {},
      sort_order: p.sort_order ?? i + 1,
      is_active: true,
    })),
    { onConflict: "id" },
  );

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
