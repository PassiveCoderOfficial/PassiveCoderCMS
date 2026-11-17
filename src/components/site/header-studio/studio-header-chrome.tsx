import React from "react";
import type { StudioHeaderData } from "@/lib/site/header-studio";
import { StudioHeader } from "./studio-header";

/**
 * The site header slot for a site that published a Header Studio header.
 * Same data-site-chrome="header" wrapper as SiteHeaderChrome, so a translated
 * page that brings its own header hides this one exactly like the classic one
 * (HIDE_GLOBAL_CHROME_CSS).
 */
export function StudioHeaderChrome({ data, logoUrl, logoDarkUrl, siteName }: {
  data: StudioHeaderData;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  siteName: string;
}) {
  return (
    <div data-site-chrome="header" style={{ display: "contents" }}>
      <StudioHeader config={data.config} menus={data.menus} logoUrl={logoUrl} logoDarkUrl={logoDarkUrl} siteName={siteName} />
    </div>
  );
}
