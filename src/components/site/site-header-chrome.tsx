import React from "react";
import type { Block } from "@/types/cms";
import { PageRenderer } from "@/components/site/page-renderer";

/**
 * Global header. PageRenderer wraps every block in two boxes, so a sticky
 * nav could only stick inside them and scrolled away with the page. The
 * navigation's wrappers are flattened (display: contents, globals.css) so
 * the nav's own sticky setting — whole header or menu row only — works.
 *
 * `localized` marks a language version's own header (an /ar page's), rendered
 * by the page in this same slot so it sticks exactly like the global one;
 * HIDE_GLOBAL_CHROME_CSS hides the layout's chrome but keeps this one.
 */
export async function SiteHeaderChrome({ blocks, localized }: { blocks: Block[]; localized?: boolean }) {
  return (
    <div data-site-chrome="header" data-chrome-lang={localized ? "" : undefined} style={{ display: "contents" }}>
      <PageRenderer blocks={blocks} />
    </div>
  );
}

/** Hides the layout's global (default-language) header/footer on a page that brings its own. */
export const HIDE_GLOBAL_CHROME_CSS = "[data-site-chrome]:not([data-chrome-lang]){display:none!important}";
