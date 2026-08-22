// Dashboard summary — the numbers that make opening the app worth it.
// All reads are RLS-scoped; tenant_id filters are defense in depth, same
// rationale as lib/queries/pages.ts.

import { supabase } from "../supabase";

export interface DashboardStats {
  publishedPages: number;
  draftPages: number;
  totalLeads: number;
  newLeadsThisWeek: number;
  domainStatus: string;
  customDomain: string | null;
  plan: string;
  status: string;
}

export interface RecentLead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  created_at: string;
}

function sevenDaysAgoIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

/**
 * One round trip per metric, run in parallel. Counts use `head: true` so
 * Postgres returns only the count — no row payload for numbers we never
 * render individually.
 */
export async function getDashboardStats(tenantId: string): Promise<DashboardStats> {
  const [published, drafts, leads, newLeads, tenant] = await Promise.all([
    supabase.from("pages").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId).eq("status", "published"),
    supabase.from("pages").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId).eq("status", "draft"),
    supabase.from("contacts").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase.from("contacts").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId).gte("created_at", sevenDaysAgoIso()),
    supabase.from("tenants")
      .select("plan, status, custom_domain, domain_status")
      .eq("id", tenantId).maybeSingle(),
  ]);

  return {
    publishedPages: published.count ?? 0,
    draftPages: drafts.count ?? 0,
    totalLeads: leads.count ?? 0,
    newLeadsThisWeek: newLeads.count ?? 0,
    domainStatus: tenant.data?.domain_status ?? "none",
    customDomain: tenant.data?.custom_domain ?? null,
    plan: tenant.data?.plan ?? "—",
    status: tenant.data?.status ?? "—",
  };
}

/** The few most recent leads, for an at-a-glance list on the dashboard. */
export async function getRecentLeads(tenantId: string, limit = 3): Promise<RecentLead[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone, company, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as RecentLead[];
}
