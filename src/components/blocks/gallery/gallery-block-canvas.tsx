"use client";

import { useEffect, useState } from "react";
import type { GalleryBlockProps } from "@/types/cms";
import { portfolioRowsToImages, type PortfolioRow } from "@/lib/portfolio/fields";
import { GalleryBlock } from "./gallery-block";

type Group = { id: string; name: string; portfolio_items?: PortfolioRow[] };

// One request per page load, shared by every gallery and the settings panel.
let groupsPromise: Promise<Group[]> | null = null;
export function fetchPortfolioGroups(fresh = false): Promise<Group[]> {
  if (fresh || !groupsPromise) {
    groupsPromise = fetch("/api/portfolio").then((r) => (r.ok ? r.json() : [])).catch(() => []);
  }
  return groupsPromise!;
}

/** Builder canvas: same as the live site, with portfolio items fetched in the browser. */
export function GalleryBlockCanvas({ block }: { block: GalleryBlockProps }) {
  const { source, portfolioGroupId } = block.data;
  const [groups, setGroups] = useState<Group[] | null>(null);
  useEffect(() => {
    if (source !== "portfolio") return;
    let live = true;
    fetchPortfolioGroups().then((g) => live && setGroups(g));
    return () => { live = false; };
  }, [source]);

  if (source !== "portfolio") return <GalleryBlock block={block} />;
  const rows = groups?.find((g) => g.id === portfolioGroupId)?.portfolio_items ?? [];
  return <GalleryBlock block={{ ...block, data: { ...block.data, images: portfolioRowsToImages(rows) } }} />;
}
