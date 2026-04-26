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

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const slug = hostname.slice(0, hostname.length - ROOT_DOMAIN.length - 1);
    const { data } = await supabase
      .from("tenants")
      .select("id,slug,name,plan,status,custom_domain,domain_status,onboarding_completed")
      .eq("slug", slug)
      .in("status", ["active", "trial"])
      .single();
    tenant = data ?? null;
  } else if (hostname !== ROOT_DOMAIN && !hostname.startsWith("localhost")) {
    const { data } = await supabase
      .from("tenants")
      .select("id,slug,name,plan,status,custom_domain,domain_status,onboarding_completed")
      .eq("custom_domain", hostname)
      .eq("domain_status", "active")
      .single();
    tenant = data ?? null;
  }

  cache.set(hostname, tenant);
  return tenant;
}
