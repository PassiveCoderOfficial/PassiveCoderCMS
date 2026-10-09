import { loadCatalog } from "@/lib/pricing/load";
import type { PricingCatalogBlockProps } from "@/types/cms";
import { PricingCatalogView } from "./pricing-catalog-view";

/** Published-site renderer: loads the live catalog on the server. */
export async function PricingCatalogBlock({ block }: { block: PricingCatalogBlockProps }) {
  const { packages, care } = await loadCatalog();
  return <PricingCatalogView data={block.data} packages={packages} care={care} />;
}
