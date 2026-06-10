/**
 * Resolve the current user's tenant id for client components by asking the
 * server (/api/tenant/current). Resolved server-side so it reliably honours the
 * auth cookies, super-admin impersonation, and subdomain context — the browser
 * auth session alone is not a dependable source here. Server components should
 * use getCurrentTenantId() from "@/lib/tenant/current" directly.
 */
export async function getClientTenantId(): Promise<string | null> {
  try {
    const res = await fetch("/api/tenant/current", { cache: "no-store" });
    if (!res.ok) return null;
    const { tenantId } = await res.json();
    return tenantId ?? null;
  } catch {
    return null;
  }
}
