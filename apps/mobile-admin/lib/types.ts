// Hand-copied minimal TS types mirroring the relevant Supabase table shapes
// (see supabase/migrations 001_initial_schema.sql, 003_saas_schema.sql,
// 009_tenant_isolation_rls.sql). Kept intentionally narrow to what this app
// reads/writes — not a full generated schema.

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  owner_id: string | null;
  plan: string;
  status: "trial" | "active" | "suspended" | "cancelled";
  custom_domain: string | null;
  domain_status: "none" | "pending" | "active" | "failed";
  trial_ends_at: string | null;
}

export type TenantMemberRole = "owner" | "admin" | "editor" | "viewer";

export interface TenantMember {
  tenant_id: string;
  user_id: string;
  role: TenantMemberRole;
  joined_at: string;
}

/** A resolved membership joined with its tenant row, used by lib/role.ts. */
export interface TenantMembership {
  tenantId: string;
  role: TenantMemberRole;
  tenant: Tenant;
}

// Verified against supabase/migrations/001_initial_schema.sql `create table
// public.pages` — column names/types confirmed. tenant_id (added later, see
// 016_pages_tenant_slug_unique.sql) is nullable: NULL = root/marketing page,
// not used by this app (mobile always queries with an explicit tenant_id).
export interface PageSeo {
  title?: string;
  description?: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: "draft" | "published" | "archived" | string;
  blocks: Block[];
  seo: PageSeo | null;
  settings: Record<string, unknown> | null;
  excerpt: string | null;
  order_index: number;
  updated_at: string;
}

/** Minimal block shape — mirrors the real (much larger) Block union in
 * cms/src/types/cms.ts, kept intentionally generic since the mobile block
 * editor introspects `data` at runtime rather than modeling every type. */
export interface Block {
  id: string;
  type: string;
  order: number;
  visible: boolean;
  width: string;
  padding: { top: number; right: number; bottom: number; left: number };
  margin: { top: number; right: number; bottom: number; left: number };
  background: Record<string, unknown>;
  animation: string;
  data: Record<string, unknown>;
}
