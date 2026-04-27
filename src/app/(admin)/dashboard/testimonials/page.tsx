import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import TestimonialsClient from "./testimonials-client";

export const metadata = { title: "Testimonials — Dashboard" };

export default async function TestimonialsPage() {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();

  const { data: groups } = await supabase
    .from("testimonial_groups")
    .select("*, testimonials(*)")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  return <TestimonialsClient initialGroups={groups ?? []} />;
}
