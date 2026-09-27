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
  return <DemoBuilder templates={(data ?? []) as { slug: string; name: string; category: string }[]} />;
}
