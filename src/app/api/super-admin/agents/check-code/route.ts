import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/super-admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  const excludeId = searchParams.get("exclude") ?? "";

  if (!code || code.length < 3) return NextResponse.json({ available: false, reason: "Min 3 characters" });

  const supabase = await createAdminClient();
  const { data } = await supabase.from("agents").select("id").eq("referral_code", code).maybeSingle();

  const available = !data || data.id === excludeId;
  return NextResponse.json({ available, code });
}
