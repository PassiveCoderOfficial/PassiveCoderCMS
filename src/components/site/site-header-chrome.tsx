import React from "react";
import type { Block } from "@/types/cms";
import { PageRenderer } from "@/components/site/page-renderer";

/**
 * Global header. PageRenderer wraps every block in two boxes, so a sticky
 * nav could only stick inside them and scrolled away with the page. The
 * navigation's wrappers are flattened (display: contents, globals.css) so
 * the nav's own sticky setting — whole header or menu row only — works.
 */
export async function SiteHeaderChrome({ blocks }: { blocks: Block[] }) {
  return (
    <div data-site-chrome="header" style={{ display: "contents" }}>
      <PageRenderer blocks={blocks} />
    </div>
  );
}
