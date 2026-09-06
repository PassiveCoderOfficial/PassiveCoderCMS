import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { HeaderLogoBlockProps } from "@/types/cms";
import { BrandLogo } from "@/components/site/brand-logo";

/**
 * Independent header sub-block: just the logo, separated out of what the
 * navigation block used to own entirely. Same fallback chain the nav block
 * already used — an explicit override, then the tenant's real uploaded logo,
 * then the coded BrandLogo placeholder — so splitting logo out of nav
 * doesn't change what actually renders for any existing site (nav still owns
 * its own logo fields for backward compatibility; this is the NEW
 * independent path used only when a header is built from these sub-blocks).
 *
 * One shared component for editor canvas and published site — purely
 * presentational, no interactivity, no server data fetch — same pattern as
 * divider/spacer blocks.
 */
export function HeaderLogoBlock({
  block,
  identityLogo,
  identityLogoDark,
}: {
  block: HeaderLogoBlockProps;
  /** Tenant's real uploaded logo (site_identity.logo_url / logo_dark_url),
   *  passed down from the page layout — same props NavigationBlock already
   *  receives. */
  identityLogo?: string | null;
  identityLogoDark?: string | null;
}) {
  const { data } = block;
  const logo = data.imageUrl || identityLogo || null;
  const logoDark = data.imageDarkUrl || identityLogoDark || logo;
  const height = data.height ?? 34;

  return (
    <Link href={data.linkUrl || "/"} className="flex items-center shrink-0" aria-label="Home">
      {logo ? (
        <>
          {/* Light/dark logo pair, same approach the nav block uses: both
              render, CSS picks the right one for the current theme so no
              client JS is needed just to show a logo. */}
          <Image
            src={logo}
            alt={data.text ?? "Logo"}
            width={height * 3.4}
            height={height}
            style={{ height }}
            className="w-auto object-contain dark:hidden"
          />
          {logoDark && logoDark !== logo && (
            <Image
              src={logoDark}
              alt={data.text ?? "Logo"}
              width={height * 3.4}
              height={height}
              style={{ height }}
              className="w-auto object-contain hidden dark:block"
            />
          )}
        </>
      ) : (
        <BrandLogo size={height} text={data.text ?? "Brand"} />
      )}
    </Link>
  );
}
