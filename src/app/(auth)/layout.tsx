import type { Metadata } from "next";
import { PLATFORM_ICONS } from "@/lib/site/site-metadata";
import { tenantChrome } from "@/lib/site/tenant-chrome";

// On the platform's hosts, login/signup are Passive Coder's own pages. On a
// client's host (theirsite.passivecoder.com/login, custom domains) they carry
// the client's name and favicon instead, so a link shared with an editor
// previews as the client's site, not Passive Coder.
export async function generateMetadata(): Promise<Metadata> {
  const brand = await tenantChrome();
  if (!brand) {
    return {
      title: { default: "Sign in | Passive Coder", template: "%s | Passive Coder" },
      description: "Sign in to your Passive Coder dashboard.",
      robots: { index: false },
      icons: PLATFORM_ICONS,
    };
  }
  const icon = brand.faviconUrl;
  return {
    title: { default: `Sign in | ${brand.name}`, template: `%s | ${brand.name}` },
    description: `Sign in to manage ${brand.name}.`,
    robots: { index: false },
    icons: { icon, shortcut: icon, apple: icon },
    openGraph: { title: `Sign in | ${brand.name}`, description: `Sign in to manage ${brand.name}.`, images: brand.logoUrl ? [brand.logoUrl] : [] },
  };
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
