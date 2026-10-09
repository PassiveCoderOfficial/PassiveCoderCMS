"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CARE_COLUMNS, DEV_COLUMNS, type CarePlan, type DevPackage } from "@/lib/pricing/catalog";
import type { PricingCatalogBlockProps } from "@/types/cms";
import { PricingCatalogView } from "./pricing-catalog-view";

/** Editor canvas renderer: same view, catalog fetched in the browser. */
export function PricingCatalogCanvas({ block }: { block: PricingCatalogBlockProps }) {
  const [cat, setCat] = useState<{ packages: DevPackage[]; care: CarePlan[] } | null>(null);
  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("plans").select(DEV_COLUMNS).eq("is_active", true).not("dev_price_usd_cents", "is", null).order("sort_order"),
      sb.from("care_plans").select(CARE_COLUMNS).eq("is_active", true).order("sort_order"),
    ]).then(([p, c]) => setCat({ packages: (p.data ?? []) as unknown as DevPackage[], care: (c.data ?? []) as unknown as CarePlan[] }));
  }, []);
  if (!cat) return <div className="py-16 text-center text-sm text-muted-foreground">Loading prices…</div>;
  return <PricingCatalogView data={block.data} packages={cat.packages} care={cat.care} />;
}
