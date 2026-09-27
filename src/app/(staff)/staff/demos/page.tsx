import { createAdminClient } from "@/lib/supabase/server";
import { DemoBuilder } from "@/components/demo/demo-builder";

export const dynamic = "force-dynamic";

export default async function DemosPage() {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("templates")
    .select("slug,name,category")
    .eq("active", true)
    .eq("status", "published")
    .neq("category", "Marketplace")
    .order("category");
  // Plan is a required choice per demo — it decides which features and
  // dashboard pages the demo shows, so it must never default silently.
  const { data: plans } = await admin.from("plans").select("id, name").eq("is_active", true).order("sort_order");
  return (
    <DemoBuilder
      templates={(data ?? []) as { slug: string; name: string; category: string }[]}
      plans={(plans ?? []) as { id: string; name: string }[]}
    />
  );
}
