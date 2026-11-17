import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isSaaS, ROOT_DOMAIN, ROOT_TENANT_SLUG } from "@/lib/flags";
import { isTrialSite } from "@/lib/sites/trial-site";
import { isSessionCookieName, viewerFirstCheck, viewerIsUntrusted } from "./viewer-trust";

/*
 * Server side of lib/security/viewer-trust.ts (read that first).
 *
 * Public page cache: the proxy only marks a request as an anonymous public
 * render when it carries no session cookie (markPublicRender in proxy.ts), and
 * that cache holds database reads, never rendered HTML. A request that gets
 * past the first check here always has a session cookie, so it is never an
 * anonymous render: what it is shown is built for that request alone and
 * cannot be served to anyone else. A request without the cookie is answered
 * "trusted" before any lookup, so anonymous renders never depend on a cookie.
 */

const untrusted = cache(async (tenantId: string): Promise<boolean> => {
  try {
    const [h, store] = await Promise.all([headers(), cookies()]);
    const first = viewerFirstCheck({
      saas: isSaaS,
      host: h.get("x-forwarded-host") ?? h.get("host"),
      rootDomain: ROOT_DOMAIN,
      platformSite: h.get("x-tenant-slug") === ROOT_TENANT_SLUG,
      hasSessionCookie: store.getAll().some((c) => isSessionCookieName(c.name)),
    });
    if (first === "trusted") return false;
  } catch {
    return false; // no request scope (scripts, cron): nobody is looking
  }
  // From here on the request carries a session cookie: any failure means the
  // site's own code is left out for this one viewer.
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return true;
    const admin = await createAdminClient();
    const [sa, staff, member] = await Promise.all([
      admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
      admin.from("pc_staff").select("status").eq("user_id", user.id).maybeSingle(),
      admin.from("tenant_members").select("role").eq("user_id", user.id).eq("tenant_id", tenantId).limit(1).maybeSingle(),
    ]);
    if (sa.error || member.error) return true;
    return viewerIsUntrusted({
      userId: user.id,
      platformStaff: !!sa.data || staff.data?.status === "active",
      member: !!member.data,
    });
  } catch {
    return true;
  }
});

/**
 * True when this request is a signed-in viewer on a platform subdomain who
 * must not be handed the site's own code (see viewer-trust.ts). Asked once
 * per request.
 */
export async function isUntrustedViewer(tenantId: string | null | undefined): Promise<boolean> {
  return tenantId ? untrusted(tenantId) : false;
}

/**
 * The one question render code asks: must this site's own code be left out
 * and its HTML sanitised for this request? Yes for a free-trial site (for
 * everyone), and for an untrusted signed-in viewer of any site.
 */
export async function siteCodeBlocked(tenantId: string | null | undefined): Promise<boolean> {
  if (!tenantId) return false;
  if (await isTrialSite(tenantId)) return true;
  return isUntrustedViewer(tenantId);
}
