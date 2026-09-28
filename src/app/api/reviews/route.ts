import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { currentUserId } from "@/lib/marketplace-ecom/chat";
import {
  REVIEW_TAGS, reviewSummary, reviewableSubOrders, publicReviewerName,
} from "@/lib/marketplace-ecom/reviews";

const PAGE = 10;

/** Public: a product's reviews + summary. `?filter=5|4|3|2|1|media`.
 *  Signed-in callers also get which delivered parcels they can still review. */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Unknown store" }, { status: 400 });
  const url = new URL(req.url);
  const productId = url.searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id required" }, { status: 400 });
  const filter = url.searchParams.get("filter");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));

  const admin = await createAdminClient();
  let q = admin
    .from("product_reviews")
    .select("id, reviewer_name, rating, body, tags, images, seller_reply, seller_replied_at, created_at", { count: "exact" })
    .eq("tenant_id", tenantId)
    .eq("product_id", productId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (filter && /^[1-5]$/.test(filter)) q = q.eq("rating", Number(filter));
  if (filter === "media") q = q.neq("images", "{}");

  const from = (page - 1) * PAGE;
  const userId = await currentUserId();
  const [{ data, count }, summary, eligible] = await Promise.all([
    q.range(from, from + PAGE - 1),
    reviewSummary(productId),
    userId ? reviewableSubOrders(tenantId, userId, productId) : Promise.resolve([]),
  ]);

  return NextResponse.json({
    summary,
    reviews: data ?? [],
    has_more: (count ?? 0) > from + PAGE,
    signed_in: Boolean(userId),
    can_review: eligible.map((e) => e.sub_order_id),
    tags: REVIEW_TAGS,
  });
}

/** Verified buyer posts a review for a delivered parcel. */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Unknown store" }, { status: 400 });
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "login_required" }, { status: 401 });

  const input = await req.json().catch(() => ({}));
  const productId = String(input.product_id ?? "");
  const subOrderId = String(input.sub_order_id ?? "");
  const rating = Number(input.rating);
  if (!productId || !subOrderId) return NextResponse.json({ error: "Missing product or order" }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Pick a rating from 1 to 5 stars" }, { status: 400 });
  }

  const eligible = await reviewableSubOrders(tenantId, userId, productId);
  if (!eligible.some((e) => e.sub_order_id === subOrderId)) {
    return NextResponse.json(
      { error: "Only buyers whose order was delivered can review this product" },
      { status: 403 },
    );
  }

  const body = typeof input.body === "string" ? input.body.trim().slice(0, 2000) : "";
  const allowed = new Set<string>(REVIEW_TAGS);
  const tags = Array.isArray(input.tags) ? [...new Set(input.tags.filter((t: unknown) => typeof t === "string" && allowed.has(t)))] : [];
  const images = Array.isArray(input.images)
    ? input.images.filter((u: unknown) => typeof u === "string" && u.startsWith("https://")).slice(0, 6)
    : [];

  const admin = await createAdminClient();
  const [{ data: product }, { data: prof }, { data: authUser }] = await Promise.all([
    admin.from("products").select("id, vendor_id").eq("id", productId).eq("tenant_id", tenantId).maybeSingle(),
    admin.from("customer_profiles").select("full_name").eq("tenant_id", tenantId).eq("customer_id", userId).maybeSingle(),
    admin.auth.admin.getUserById(userId),
  ]);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const { data, error } = await admin
    .from("product_reviews")
    .insert({
      tenant_id: tenantId,
      product_id: productId,
      vendor_id: product.vendor_id,
      sub_order_id: subOrderId,
      user_id: userId,
      reviewer_name: publicReviewerName(prof?.full_name, authUser.user?.email),
      rating,
      body: body || null,
      tags,
      images,
    })
    .select("id")
    .single();
  if (error) {
    const dup = error.code === "23505";
    return NextResponse.json({ error: dup ? "You've already reviewed this order" : error.message }, { status: dup ? 409 : 400 });
  }
  return NextResponse.json({ id: data.id });
}
