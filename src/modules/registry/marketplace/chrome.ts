/** Open edition: no marketplace module, so the site layout never uses marketplace chrome. */
export interface MarketplaceChrome {
  categories: unknown[];
  contact: { phone?: string | null; [key: string]: unknown } | null;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  siteName: string;
}

export async function getMarketplaceChrome(_tenantId: string | null): Promise<MarketplaceChrome | null> {
  return null;
}

export const MARKETPLACE_TOKENS_CSS = "";

export function MarketplaceHeader(_props: Record<string, unknown>) {
  return null;
}

export function MarketplaceFooter(_props: Record<string, unknown>) {
  return null;
}
