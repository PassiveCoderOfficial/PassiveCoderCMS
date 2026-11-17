/** Open edition: no multi-vendor catalogue (single stores use SingleStoreShop). */
export type ShopSearchParams = { q?: string; category?: string; vendor?: string; sort?: string; min?: string; max?: string; rating?: string; page?: string };

export async function MarketplaceShopView(_props: { tenantId: string; sp: ShopSearchParams }) {
  return null;
}
