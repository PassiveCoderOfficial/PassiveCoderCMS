import "server-only";
import { isEcomMarketplace } from "@/modules/registry/marketplace/is-marketplace";
import { resolveEnabledModules } from "@/lib/modules/resolve-modules";

/**
 * On a multi-vendor marketplace the store doesn't sell its own stock:
 * sellers add and manage products from the Seller Centre, and the store
 * admin reviews, edits and moderates them. So "Add product" and bulk upload
 * are off there. True when approved ecommerce sellers exist, or the
 * marketplace and ecommerce modules are both on (the same test the sidebar
 * uses, see navSectionsFor in nav-items.ts). Other shops are unchanged.
 */
export async function adminProductCreationOff(tenantId: string | null): Promise<boolean> {
  if (!tenantId) return false;
  if (await isEcomMarketplace(tenantId)) return true;
  const m = await resolveEnabledModules(tenantId);
  return !!(m.marketplace && m.ecommerce);
}

