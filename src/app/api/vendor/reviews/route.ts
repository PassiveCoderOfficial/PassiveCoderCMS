import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { currentVendor } from "@/lib/marketplace-ecom/vendor-auth";

/** Seller: reviews on the signed-in seller's products. */
export async function GET() {
  const vendor = await currentVendor();
  if (!vendor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("product_reviews")
    .select("id, reviewer_name, rating, body, tags, images, seller_reply, seller_replied_at, created_at, products(name, slug, images)")
    .eq("vendor_id", vendor.vendor_id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ reviews: data ?? [] });
}
