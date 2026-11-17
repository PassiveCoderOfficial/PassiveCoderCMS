// Which dashboard menu items a site shows. Pure, shared by the web sidebar
// (sidebar.tsx) and the mobile app's menu (/api/mobile-admin/site-nav), so
// both always follow the same plan / module / layout-lock / white-label rules.

import type { ModuleKey, NavItem } from "./nav-items";

export interface NavFilterContext {
  isSaaS: boolean;
  /** Resolved modules for the site (plan + per-site overrides). Undefined = no site, no gating. */
  enabledModules?: Partial<Record<ModuleKey, boolean>>;
  /** Areas hidden on a layout-locked site. */
  hiddenPaths?: string[];
  /** White-label client: talks to the reseller, not to us. */
  whiteLabel?: boolean;
}

export function navItemVisible(item: Pick<NavItem, "href" | "saasOnly" | "standaloneOnly" | "moduleKey">, ctx: NavFilterContext): boolean {
  if (item.saasOnly && !ctx.isSaaS) return false;
  if (ctx.hiddenPaths?.some((p) => item.href === p || item.href.startsWith(p + "/") || item.href.startsWith(p + "?"))) return false;
  if (ctx.whiteLabel && (item.href === "/dashboard/support" || item.href === "/partners/account")) return false;
  if (item.standaloneOnly && ctx.isSaaS) return false;
  if (item.moduleKey && ctx.enabledModules && !ctx.enabledModules[item.moduleKey]) return false;
  return true;
}
