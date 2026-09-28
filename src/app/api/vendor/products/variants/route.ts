import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { currentVendor } from "@/lib/marketplace-ecom/vendor-auth";

async function ownProduct(productId: string) {
  const vendor = await currentVendor();
  if (!vendor) return null;
  const admin = await createAdminClient();
  const { data } = await admin
    .from("products").select("id").eq("id", productId).eq("vendor_id", vendor.vendor_id).maybeSingle();
  return data ? admin : null;
}

/** Seller: a product's options (size/colour etc). */
export async function GET(req: NextRequest) {
  const productId = new URL(req.url).searchParams.get("product_id") ?? "";
  const admin = await ownProduct(productId);
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data } = await admin
    .from("product_variants")
    .select("id, name, price, compare_price, stock_quantity, image, attributes, is_active, sort_order")
    .eq("product_id", productId)
    .order("sort_order");
  return NextResponse.json({ variants: data ?? [] });
}

interface In {
  id?: string;
  name: string;
  price: number | null;
  stock_quantity: number;
  image?: string | null;
  is_active?: boolean;
}

/** Seller: replace the full option list. Options that are dropped are
 *  deactivated rather than deleted, so past orders still resolve them. */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const productId = String(body.product_id ?? "");
  const admin = await ownProduct(productId);
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const list = (Array.isArray(body.variants) ? body.variants : []) as In[];
  const clean = list
    .map((v, i) => ({
      id: v.id,
      name: String(v.name ?? "").trim().slice(0, 80),
      price: v.price == null || v.price === ("" as unknown) ? null : Math.max(0, Number(v.price)),
      stock_quantity: Math.max(0, Math.floor(Number(v.stock_quantity) || 0)),
      image: v.image || null,
      is_active: v.is_active !== false,
      sort_order: i,
    }))
    .filter((v) => v.name);
  if (new Set(clean.map((v) => v.name.toLowerCase())).size !== clean.length) {
    return NextResponse.json({ error: "Option names must be unique" }, { status: 400 });
  }

  const { data: existing } = await admin.from("product_variants").select("id").eq("product_id", productId);
  const keep = new Set(clean.filter((v) => v.id).map((v) => v.id));
  const drop = (existing ?? []).map((e) => e.id).filter((id) => !keep.has(id));
  if (drop.length) await admin.from("product_variants").update({ is_active: false }).in("id", drop);

  for (const v of clean) {
    const row = {
      product_id: productId,
      name: v.name,
      price: v.price,
      stock_quantity: v.stock_quantity,
      image: v.image,
      is_active: v.is_active,
      sort_order: v.sort_order,
    };
    if (v.id && (existing ?? []).some((e) => e.id === v.id)) {
      await admin.from("product_variants").update(row).eq("id", v.id);
    } else {
      await admin.from("product_variants").insert(row);
    }
  }

  // With options, the listing's stock is the sum of active options so the
  // storefront's "in stock" and card badges stay truthful.
  const active = clean.filter((v) => v.is_active);
  if (active.length) {
    await admin
      .from("products")
      .update({ stock_quantity: active.reduce((s, v) => s + v.stock_quantity, 0), track_inventory: true })
      .eq("id", productId);
  }
  return NextResponse.json({ ok: true });
}
