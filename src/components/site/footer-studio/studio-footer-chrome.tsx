import React from "react";
import type { StudioFooterData } from "@/lib/site/footer-studio";
import { StudioFooter } from "./studio-footer";

/**
 * The site footer slot for a site that published a Footer Studio footer.
 * Same data-site-chrome="footer" wrapper as the classic footer in
 * (site)/layout.tsx, so a translated page that brings its own footer hides
 * this one exactly like the classic one (HIDE_GLOBAL_CHROME_CSS).
 */
export function StudioFooterChrome({ data, logoUrl, logoDarkUrl, siteName }: {
  data: StudioFooterData;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  siteName: string;
}) {
  return (
    <div data-site-chrome="footer" style={{ display: "contents" }}>
      <StudioFooter config={data.config} menus={data.menus} hours={data.hours} siteMap={data.siteMap}
        logoUrl={logoUrl} logoDarkUrl={logoDarkUrl} siteName={siteName} />
    </div>
  );
}
