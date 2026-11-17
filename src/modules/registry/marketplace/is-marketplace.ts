/** Open edition: no multi-vendor marketplace module; every store is a single store. */
export async function isEcomMarketplace(_tenantId: string | null): Promise<boolean> {
  return false;
}
