import { isStandalone, ROOT_DOMAIN, APP_URL } from "@/lib/flags";
import { MODULE_KEYS } from "@/components/admin/sidebar/nav-items";
import { loadLicence, licenceMatchesSite } from "./verify";

type PlanModuleConfig = { included?: boolean; defaultOn?: boolean; licensed?: boolean };

const KNOWN = new Set<string>(MODULE_KEYS);

/** Paid modules this install's licence turns on for the site, or none.
 *  Hosted (SaaS) mode: always none, and the licence is never read. */
export function licensedModules(tenantId: string): string[] {
  if (!isStandalone) return [];
  const lic = loadLicence();
  if (lic.state !== "valid") return [];
  if (!licenceMatchesSite(lic.licence, { tenantId, domains: [ROOT_DOMAIN, APP_URL] })) {
    warnOnce(`licence ${lic.licence.licence_id} is for ${lic.licence.domain} / site ${lic.licence.tenant_id}, not this site: core modules only`);
    return [];
  }
  return lic.licence.modules.filter((m) => KNOWN.has(m));
}

/** The plan's module config with the licensed modules added as included
 *  (on by default; the owner can still switch them off). Hosted mode gets the
 *  very same object back. */
export function withLicensedModules<T extends Record<string, PlanModuleConfig>>(planModules: T, tenantId: string): T {
  if (!isStandalone) return planModules;
  const extra = licensedModules(tenantId);
  if (!extra.length) return planModules;
  const out: Record<string, PlanModuleConfig> = { ...planModules };
  for (const key of extra) out[key] = { ...(out[key] ?? {}), included: true, defaultOn: out[key]?.included ? out[key]?.defaultOn : true, licensed: true };
  return out as T;
}

let warned = false;
function warnOnce(msg: string) {
  if (warned) return;
  warned = true;
  console.warn(`[licence] ${msg}`);
}
