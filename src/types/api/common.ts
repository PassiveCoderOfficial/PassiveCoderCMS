/**
 * Shared API contract between the web server (src/app/api/**) and the mobile
 * admin app (apps/mobile-admin). Pure types and constants only: no imports,
 * so the app can bundle these files directly (path alias to src/types/api).
 */

/** Header the app sends with every site-scoped call (the selected site). */
export const TENANT_HEADER = "X-Tenant-Id";

/** Error body every dashboard route answers with on failure. */
export interface ApiError {
  error: string;
}

/** tenant_members.role, plus "owner" for tenants.owner_id. */
export type SiteRole = "owner" | "admin" | "editor" | "author" | "viewer";

/** App-level role, same precedence as apps/mobile-admin/lib/role.tsx. */
export type AppRole = "super_admin" | "pc_staff" | "tenant";

export type Currency = "USD" | "BDT";

/** Android application id of the admin app (apps/mobile-admin/app.json). */
export const ANDROID_APP_PACKAGE = "com.passivecoder.admin";
