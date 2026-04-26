import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TestimonialsClient from "./testimonials-client";

export const metadata = { title: "Testimonials — Dashboard" };

export default async function TestimonialsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).single();
  if (!member?.tenant_id) redirect("/login?error=no_tenant");

  const { data: groups } = await supabase
    .from("testimonial_groups")
    .select("*, testimonials(*)")
    .eq("tenant_id", member.tenant_id)
    .order("sort_order");

  return <TestimonialsClient initialGroups={groups ?? []} />;
}
