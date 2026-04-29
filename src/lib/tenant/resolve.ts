import { createAdminClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN, isSaaS } from "@/lib/flags";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  plan: string;
  status: string;
  custom_domain: string | null;
  domain_status: string;
  onboarding_completed: boolean;
}

const cache = new Map<string, Tenant | null>();

export async function resolveTenant(host: string): Promise<Tenant | null> {
  if (!isSaaS) return null;
  const hostname = host.split(":")[0].toLowerCase();
  if (cache.has(hostname)) return cache.get(hostname) ?? null;

  const supabase = await createAdminClient();
  let tenant: Tenant | null = null;

  // Strip port from ROOT_DOMAIN for comparison
  const rootHostname = ROOT_DOMAIN.split(":")[0].toLowerCase();

  if (hostname.endsWith(`.${rootHostname}`)) {
    const slug = hostname.slice(0, hostname.length - rootHostname.length - 1);
    if (slug) {
      const { data } = await supabase
        .from("tenants")
        .select("id,slug,name,plan,status,custom_domain,domain_status,onboarding_completed")
        .eq("slug", slug)
        .in("status", ["active", "trial", "suspended"])
        .maybeSingle();
      tenant = data ?? null;
    }
  } else if (hostname !== rootHostname && !hostname.startsWith("localhost") && !hostname.endsWith(".localhost")) {
    // Custom domain
    const { data } = await supabase
      .from("tenants")
      .select("id,slug,name,plan,status,custom_domain,domain_status,onboarding_completed")
      .eq("custom_domain", hostname)
      .eq("domain_status", "active")
      .in("status", ["active", "trial", "suspended"])
      .maybeSingle();
    tenant = data ?? null;
  }

  cache.set(hostname, tenant);
  return tenant;
}
