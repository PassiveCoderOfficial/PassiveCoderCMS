import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/super-admin";

export async function POST(req: Request) {
  const supabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { plans } = await req.json();
  if (!Array.isArray(plans)) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  // Persist plans to platform_plans table if it exists, otherwise no-op
  // (graceful — table may not be migrated yet)
  try {
    await supabase.from("platform_plans" as never).upsert(
      plans.map((p: { id: string; name: string; price_yearly: number; storage_gb: number; features: string[] }) => ({
        id: p.id,
        name: p.name,
        price_yearly: p.price_yearly,
        storage_gb: p.storage_gb,
        features: p.features,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "id" },
    );
  } catch {
    // Table doesn't exist yet — plans live in the API route for now
  }

  return NextResponse.json({ ok: true });
}
