import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const revalidate = 300; // cache 5 min

export async function GET() {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("platform_settings")
    .select("usd_to_bdt_rate")
    .eq("id", 1)
    .single();

  const rate = Number(data?.usd_to_bdt_rate ?? 125);
  return NextResponse.json({ rate }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
