import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { canWriteSite } from "@/lib/auth/site-write";
import { isEcomMarketplace } from "@/modules/registry/marketplace/is-marketplace";

/**
 * Delivery options shown at checkout (shipping_rates, per site). Replaces the
 * old delivery_options table, which had no site column (every store shared
 * one list) and that checkout never read.
 */
type Body = { id?: string; name?: string; areas?: string[] | string; rate?: number | string; free_above?: number | string | null; eta_days?: string | null; cod_fee_pct?: number | string | null; is_default?: boolean; weight_included_kg?: number | string | null; extra_per_kg?: number | string | null; zone?: string | null };

const ZONES = ["same_district", "same_division", "other"];

const num = (v: unknown) => (v === "" || v == null ? null : Number(v));

async function ctx(write: boolean) {
  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!tenantId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (write && !(await canWriteSite(tenantId))) return { error: NextResponse.json({ error: "Your role can't make changes on this site." }, { status: 403 }) };
  return { tenantId, admin: await createAdminClient() };
}

export async function GET() {
  const c = await ctx(false);
  if ("error" in c) return c.error;
  const [{ data }, marketplace] = await Promise.all([
    c.admin.from("shipping_rates").select("*").eq("tenant_id", c.tenantId).order("sort_order"),
    isEcomMarketplace(c.tenantId),
  ]);
  return NextResponse.json({ rates: data ?? [], marketplace });
}

export async function POST(req: Request) {
  const c = await ctx(true);
  if ("error" in c) return c.error;
  const b = await req.json().catch(() => ({})) as Body;
  const name = b.name?.trim();
  if (!name) return NextResponse.json({ error: "Give the option a name, like Inside Dhaka" }, { status: 400 });
  const rate = num(b.rate) ?? 0;
  if (rate < 0) return NextResponse.json({ error: "Price can't be negative" }, { status: 400 });
  const areas = (Array.isArray(b.areas) ? b.areas : (b.areas ?? "").split(",")).map((a) => a.trim()).filter(Boolean);
  const row = { tenant_id: c.tenantId, name, areas, rate, free_above: num(b.free_above), eta_days: b.eta_days?.trim() || null, // The form has no COD-fee field; send 0 rather than null (column is NOT NULL).
    cod_fee_pct: num(b.cod_fee_pct) ?? 0, is_default: !!b.is_default,
    weight_included_kg: Math.max(0, num(b.weight_included_kg) ?? 1), extra_per_kg: Math.max(0, num(b.extra_per_kg) ?? 0) };

  // Zone rates (same district / same division / rest of the country) price
  // marketplace parcels from the seller's district; one row per zone, never
  // the checkout default (that stays an area rate).
  const zone = b.zone && ZONES.includes(b.zone) ? b.zone : null;
  if (zone) {
    const zoneRow = { ...row, zone, areas: [], is_default: false };
    const { data: existing } = await c.admin.from("shipping_rates").select("id").eq("tenant_id", c.tenantId).eq("zone", zone).maybeSingle();
    const res = existing
      ? await c.admin.from("shipping_rates").update(zoneRow).eq("id", existing.id).select().maybeSingle()
      : await c.admin.from("shipping_rates").insert({ ...zoneRow, sort_order: 10 + ZONES.indexOf(zone) }).select().maybeSingle();
    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
    return NextResponse.json({ rate: res.data });
  }

  // Only one default per site.
  if (row.is_default) await c.admin.from("shipping_rates").update({ is_default: false }).eq("tenant_id", c.tenantId);
  if (b.id) {
    const { data, error } = await c.admin.from("shipping_rates").update(row).eq("id", b.id).eq("tenant_id", c.tenantId).select().maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rate: data });
  }
  const { count } = await c.admin.from("shipping_rates").select("id", { count: "exact", head: true }).eq("tenant_id", c.tenantId);
  const { data, error } = await c.admin.from("shipping_rates").insert({ ...row, is_default: row.is_default || !count, sort_order: count ?? 0 }).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rate: data });
}

export async function DELETE(req: Request) {
  const c = await ctx(true);
  if ("error" in c) return c.error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await c.admin.from("shipping_rates").delete().eq("id", id).eq("tenant_id", c.tenantId);
  return NextResponse.json({ ok: true });
}
