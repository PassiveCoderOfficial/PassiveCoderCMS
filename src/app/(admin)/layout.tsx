import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/sidebar/sidebar";
import { AdminTopbar } from "@/components/admin/topbar/topbar";
import type { CMSUser } from "@/types/cms";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) redirect("/login");

  // Use service role to fetch profile — bypasses RLS
  const adminClient = await createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError?.code === "42P01") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-8">
        <p className="text-red-400">Database not set up — run the migration SQL first.</p>
      </div>
    );
  }

  if (!profile || !["admin", "editor", "author"].includes(profile.role)) {
    redirect("/login?error=unauthorized");
  }

  const cmsUser: CMSUser = {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    role: profile.role,
    is_active: profile.is_active,
    created_at: profile.created_at,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar user={cmsUser} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
