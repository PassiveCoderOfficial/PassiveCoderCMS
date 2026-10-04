import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Daily: end promotions whose promo_ends_at has passed. Restores the regular
 * yearly BDT price (so checkout charges it again) and clears the promo fields.
 */
async function handle(req: Request) {
  const bearer = req.headers.get("authorization");
  const viaCron = !!process.env.CRON_SECRET && bearer === `Bearer ${process.env.CRON_SECRET}`;
  const viaManual = !!process.env.INTERNAL_CRON_SECRET && req.headers.get("x-cron-secret") === process.env.INTERNAL_CRON_SECRET;
  if (!viaCron && !viaManual) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const { data: ended } = await admin.from("plans").select("id, price_yearly_bdt_regular")
    .not("promo_ends_at", "is", null).lte("promo_ends_at", new Date().toISOString());
  for (const p of ended ?? []) {
    await admin.from("plans").update({
      ...(p.price_yearly_bdt_regular ? { price_yearly_bdt: p.price_yearly_bdt_regular } : {}),
      price_yearly_bdt_regular: null, promo_label: null, promo_ends_at: null,
    }).eq("id", p.id);
  }
  console.log("[end-promos]", (ended ?? []).map((p) => p.id));
  return NextResponse.json({ ended: (ended ?? []).map((p) => p.id) });
}

export const GET = handle;
export const POST = handle;
