import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createAdminClient();
  const { data } = await supabase.from("homepage_settings").select("meta_title,meta_description").single();
  return {
    title: data?.meta_title ?? "CMS Studio — Website Builder for Local Businesses",
    description: data?.meta_description ?? "Professional websites for local service businesses.",
  };
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
