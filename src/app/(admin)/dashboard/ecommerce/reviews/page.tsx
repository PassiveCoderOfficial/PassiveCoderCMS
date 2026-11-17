import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { ReviewsManager, type ReviewRow } from "./reviews-manager";

export const metadata = { title: "Product Reviews" };

export default async function ReviewsPage() {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return <div className="p-6 text-sm">Open a site first.</div>;
  const admin = await createAdminClient();
  const [{ data: reviews }, { data: groups }] = await Promise.all([
    admin.from("product_reviews")
      .select("id, product_id, reviewer_name, reviewer_email, rating, body, images, status, verified, testimonial_id, created_at, products(name, slug, images)")
      .eq("tenant_id", tenantId).is("vendor_id", null).order("created_at", { ascending: false }).limit(300),
    admin.from("testimonial_groups").select("id, name").eq("tenant_id", tenantId).order("sort_order"),
  ]);
  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Product Reviews</h1>
        <p className="text-sm text-muted-foreground">Reviews customers write on product pages. Approve them to show on the product, or put the best ones in your homepage testimonials.</p>
      </div>
      <ReviewsManager tenantId={tenantId} initial={(reviews ?? []) as unknown as ReviewRow[]} groups={groups ?? []} />
    </div>
  );
}
