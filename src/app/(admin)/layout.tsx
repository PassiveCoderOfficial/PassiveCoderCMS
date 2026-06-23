import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/sidebar/sidebar";
import { AdminTopbar } from "@/components/admin/topbar/topbar";
import { SABanner } from "@/components/admin/sa-banner";
import { SA_VIEWING_COOKIE } from "@/lib/tenant/current";
import type { CMSUser } from "@/types/cms";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  // getUser() makes a network call — if Supabase is slow it returns null and triggers
  // a redirect loop (middleware lets session through, layout bounces back). Fall back to
  // getSession() (cookie-local, no network) if getUser() fails so navigation stays stable.
  let { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) redirect("/login");
    user = session.user;
  }

  const adminClient = await createAdminClient();

  const { data: rawProfile, error: profileError } = await adminClient
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

  let profile = rawProfile;

  if (!profile) {
    if (profileError && profileError.code !== "PGRST116") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-8">
          <p className="text-red-400">Failed to load profile. Please refresh.</p>
        </div>
      );
    }
    // PGRST116 = row missing. DB trigger may not have fired yet (race after signup).
    // Upsert now so user lands on dashboard without needing to re-login.
    const { data: upserted } = await adminClient
      .from("profiles")
      .upsert(
        { id: user.id, email: user.email ?? "", full_name: user.user_metadata?.full_name ?? "", role: "subscriber", is_active: true },
        { onConflict: "id" },
      )
      .select("*")
      .single();
    if (!upserted) redirect("/login?error=unauthorized");
    profile = upserted;
  }

  const { data: sa } = await adminClient
    .from("super_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Tenant membership (owner/admin/editor) is what grants dashboard access in
  // SaaS multi-tenancy — NOT the global profiles.role. New site owners get
  // profiles.role = "subscriber" but a tenant_members "owner" row, so gating on
  // profiles.role alone locked every client out of their own dashboard.
  const { data: memberships } = await adminClient
    .from("tenant_members")
    .select("tenant_id, role, is_primary, tenants(id, name, slug)")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false });

  const hasTenantAccess = (memberships ?? []).some((m) =>
    ["owner", "admin", "editor"].includes(m.role as string),
  );

  // SA with no tenant goes to super-admin panel, not login
  if (sa && !hasTenantAccess) redirect("/super-admin");

  if (!sa && profile.role !== "agent" && !hasTenantAccess) {
    redirect("/login?error=unauthorized");
  }

  // Enforce suspended subscriptions for regular tenants (not SA, not agents)
  if (!sa && profile.role !== "agent" && hasTenantAccess) {
    const reqHeaders = await headers();
    const pathname = reqHeaders.get("x-invoke-path") ?? reqHeaders.get("x-pathname") ?? "";
    if (!pathname.startsWith("/dashboard/subscription")) {
      const primaryTenantId = (memberships ?? []).find(m => m.is_primary)?.tenant_id
        ?? (memberships ?? [])[0]?.tenant_id;
      if (primaryTenantId) {
        const { data: sub } = await adminClient
          .from("subscriptions")
          .select("status")
          .eq("tenant_id", primaryTenantId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (sub?.status === "suspended") {
          redirect("/dashboard/subscription?suspended=1");
        }
      }
    }
  }

  // Check if SA is impersonating a tenant
  const cookieStore = await cookies();
  const viewingTenantId = sa ? cookieStore.get(SA_VIEWING_COOKIE)?.value : undefined;

  let viewingTenantName: string | null = null;
  if (viewingTenantId) {
    const { data: tenant } = await adminClient
      .from("tenants")
      .select("name")
      .eq("id", viewingTenantId)
      .single();
    viewingTenantName = tenant?.name ?? null;
  }

  // Fetch sites for switcher
  let userSites: { id: string; name: string; slug: string; is_primary: boolean }[] = [];

  if (sa) {
    // SA sees all tenants
    const { data: allTenants } = await adminClient
      .from("tenants")
      .select("id, name, slug")
      .order("created_at", { ascending: true });

    const currentViewingId = cookieStore.get(SA_VIEWING_COOKIE)?.value;
    const saOwnedId = allTenants?.[0]?.id;
    const activeTenantId = currentViewingId ?? saOwnedId;

    userSites = (allTenants ?? []).map(t => ({
      id: t.id, name: t.name, slug: t.slug,
      is_primary: t.id === activeTenantId,
    }));
  } else {
    userSites = (memberships ?? []).map(m => {
      const t = (Array.isArray(m.tenants) ? m.tenants[0] : m.tenants) as { id: string; name: string; slug: string } | null;
      return t ? { id: t.id, name: t.name, slug: t.slug, is_primary: m.is_primary ?? false } : null;
    }).filter(Boolean) as { id: string; name: string; slug: string; is_primary: boolean }[];
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
    <div className="flex h-screen overflow-hidden bg-background flex-col">
      {viewingTenantId && viewingTenantName && (
        <SABanner tenantName={viewingTenantName} tenantId={viewingTenantId} />
      )}
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar isSuperAdmin={!!sa} isAgent={profile.role === "agent"} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminTopbar user={cmsUser} sites={userSites} isSuperAdmin={!!sa} />
          <main className="flex-1 overflow-auto pl-0 lg:pl-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
