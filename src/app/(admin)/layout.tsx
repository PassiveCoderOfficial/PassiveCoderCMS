import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/sidebar/sidebar";
import { AdminTopbar } from "@/components/admin/topbar/topbar";
import { SABanner } from "@/components/admin/sa-banner";
import { AgentBanner } from "@/components/admin/agent-banner";
import { SA_VIEWING_COOKIE, AGENT_VIEWING_COOKIE } from "@/lib/tenant/current";
import { resolveEnabledModules } from "@/lib/modules/resolve-modules";
import { resolveModuleKeyForPath } from "@/components/admin/sidebar/nav-items";
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

  // Force-subdomain isolation: a tenant member on tenant A's subdomain must not
  // see tenant B's dashboard just because they're logged in. If the subdomain
  // being visited (x-tenant-id from middleware) isn't one of this user's
  // memberships, bounce them to their own primary site's dashboard instead.
  if (!sa && hasTenantAccess) {
    const reqHeaders = await headers();
    const subdomainTenantId = reqHeaders.get("x-tenant-id");
    if (subdomainTenantId) {
      const memberTenantIds = new Set((memberships ?? []).map(m => m.tenant_id));
      if (!memberTenantIds.has(subdomainTenantId)) {
        const ownTenant = (memberships ?? []).find(m => m.is_primary) ?? (memberships ?? [])[0];
        const ownSlug = ownTenant
          ? (Array.isArray(ownTenant.tenants) ? ownTenant.tenants[0] : ownTenant.tenants)?.slug
          : undefined;
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
        const proto = rootDomain.includes("localhost") ? "http" : "https";
        if (ownSlug) {
          redirect(`${proto}://${ownSlug}.${rootDomain}/dashboard`);
        }
        redirect("/login?error=unauthorized");
      }
    }
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

  // Check if SA is impersonating a tenant, or an agent is viewing an
  // assigned/referred site's dashboard under their own session.
  const cookieStore = await cookies();
  const viewingTenantId = sa ? cookieStore.get(SA_VIEWING_COOKIE)?.value : undefined;

  // The viewing cookie is shared across every *.passivecoder.com subdomain —
  // with two site tabs open it reflects whichever was clicked last, not the
  // subdomain actually being browsed. The hostname (x-tenant-id, set by
  // middleware from the real subdomain) must win whenever present; the
  // cookie is only a fallback for root-domain /dashboard access.
  let agentViewingTenantId: string | undefined;
  if (!sa && profile.role === "agent") {
    const subdomainTenantId = (await headers()).get("x-tenant-id");
    agentViewingTenantId = subdomainTenantId ?? cookieStore.get(AGENT_VIEWING_COOKIE)?.value;
  }

  let viewingTenantName: string | null = null;
  if (viewingTenantId) {
    const { data: tenant } = await adminClient
      .from("tenants")
      .select("name")
      .eq("id", viewingTenantId)
      .single();
    viewingTenantName = tenant?.name ?? null;
  }

  let agentViewingTenantName: string | null = null;
  if (agentViewingTenantId) {
    const { data: agentRow } = await adminClient.from("agents").select("id").eq("user_id", user.id).maybeSingle();
    const { data: tenant } = await adminClient
      .from("tenants")
      .select("name")
      .eq("id", agentViewingTenantId)
      .or(`assigned_agent_id.eq.${agentRow?.id ?? "null"},referred_by_agent_id.eq.${agentRow?.id ?? "null"}`)
      .maybeSingle();
    agentViewingTenantName = tenant?.name ?? null;
    if (!agentViewingTenantName) redirect("/agent");
  } else if (!sa && profile.role === "agent") {
    // Agent with no viewing cookie and no tenant membership has nothing to
    // show in /dashboard — send them to their own portal instead.
    if (!hasTenantAccess) redirect("/agent");
  }

  // Fetch sites for switcher
  let userSites: { id: string; name: string; slug: string; is_primary: boolean; owner_email?: string; custom_domain?: string }[] = [];

  if (sa) {
    // SA sees all tenants — pull owner_id + custom_domain so the mega menu can
    // filter by owner email / domain, not just site name. Newest first, not
    // creation order — that's what "latest sites" means to an SA scanning
    // for recent signups.
    const { data: allTenants } = await adminClient
      .from("tenants")
      .select("id, name, slug, owner_id, custom_domain")
      .order("created_at", { ascending: false });

    // "Current site" must reflect the subdomain actually being viewed, not
    // a stale impersonation cookie — an SA browsing directly to
    // demo2.passivecoder.com without going through the switcher's "view as"
    // flow left the topbar showing whatever tenant the cookie last held
    // (or the fallback owned tenant), not demo2.
    const subdomainTenantId = (await headers()).get("x-tenant-id");
    const currentViewingId = cookieStore.get(SA_VIEWING_COOKIE)?.value;
    const saOwnedId = allTenants?.[0]?.id;
    const activeTenantId = subdomainTenantId ?? currentViewingId ?? saOwnedId;

    const ownerIds = [...new Set((allTenants ?? []).map(t => t.owner_id).filter(Boolean))] as string[];
    const { data: owners } = ownerIds.length
      ? await adminClient.from("profiles").select("id, email").in("id", ownerIds)
      : { data: [] as { id: string; email: string }[] };
    const ownerEmailById = new Map((owners ?? []).map(o => [o.id, o.email]));

    userSites = (allTenants ?? []).map(t => ({
      id: t.id, name: t.name, slug: t.slug,
      is_primary: t.id === activeTenantId,
      owner_email: t.owner_id ? ownerEmailById.get(t.owner_id) : undefined,
      custom_domain: t.custom_domain ?? undefined,
    }));
  } else {
    userSites = (memberships ?? []).map(m => {
      const t = (Array.isArray(m.tenants) ? m.tenants[0] : m.tenants) as { id: string; name: string; slug: string } | null;
      return t ? { id: t.id, name: t.name, slug: t.slug, is_primary: m.is_primary ?? false } : null;
    }).filter(Boolean) as { id: string; name: string; slug: string; is_primary: boolean }[];
  }

  // Agent viewing a site has no tenant_members row, so it's not in userSites
  // above — inject it directly so the topbar switcher still shows something.
  if (agentViewingTenantId && agentViewingTenantName) {
    const { data: viewingTenant } = await adminClient
      .from("tenants")
      .select("slug")
      .eq("id", agentViewingTenantId)
      .maybeSingle();
    userSites = [{ id: agentViewingTenantId, name: agentViewingTenantName, slug: viewingTenant?.slug ?? "", is_primary: true }];
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

  // SA bypasses module gating entirely — only resolve for regular tenant
  // members and agents viewing a specific site. Must be the tenant whose
  // SUBDOMAIN is actually being visited (already validated as one of this
  // user's memberships above), not just their primary site — a member of
  // multiple tenants viewing a non-primary one would otherwise see that
  // tenant's dashboard gated by the wrong tenant's plan.
  const currentSubdomainTenantId = (await headers()).get("x-tenant-id");
  const dashboardTenantId = agentViewingTenantId
    ?? currentSubdomainTenantId
    ?? (memberships ?? []).find(m => m.is_primary)?.tenant_id
    ?? (memberships ?? [])[0]?.tenant_id;
  const enabledModules = (!sa && dashboardTenantId)
    ? await resolveEnabledModules(dashboardTenantId)
    : undefined;

  // Direct-link enforcement: hiding a gated item from the sidebar isn't
  // enough on its own — a bookmarked/typed URL must also be blocked.
  // resolveModuleKeyForPath is the same lookup the sidebar's own filtering
  // logic is built from, so this can't drift out of sync with what's hidden.
  if (enabledModules) {
    const currentPathname = (await headers()).get("x-invoke-path") ?? (await headers()).get("x-pathname") ?? "";
    const guardKey = resolveModuleKeyForPath(currentPathname);
    if (guardKey && !enabledModules[guardKey]) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background flex-col">
      {viewingTenantId && viewingTenantName && (
        <SABanner tenantName={viewingTenantName} tenantId={viewingTenantId} />
      )}
      {agentViewingTenantId && agentViewingTenantName && (
        <AgentBanner tenantName={agentViewingTenantName} />
      )}
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar isSuperAdmin={!!sa} isAgent={profile.role === "agent"} enabledModules={enabledModules} />
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
