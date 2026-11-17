import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RootBuilderPage, rootBuilderMetadata } from "@/lib/site/root-page";
import type { CountryCode } from "@/lib/pricing/countries";

/**
 * Country landing pages of the root site: /ae, /ae/ar, /ae/<service>,
 * /sa, /sa/ar, /sg, ... Each is a root-tenant builder page whose
 * slug is the path without the leading slash. One static route folder per
 * country ((marketing)/ae/[[...rest]] etc.) so they win over the (site)
 * catch-all; this file is the shared body.
 */
function slugOf(cc: CountryCode, rest: string[] | undefined): string {
  const parts = [cc.toLowerCase(), ...(rest ?? [])].filter(Boolean);
  // No hidden pages: a segment like "home" or "..", or an empty one, is a 404.
  if (parts.some((p) => !/^[a-z0-9-]+$/.test(p))) return "";
  return parts.join("/");
}

export async function countryPageMetadata(cc: CountryCode, rest: string[] | undefined, previewToken?: string): Promise<Metadata> {
  const slug = slugOf(cc, rest);
  if (!slug) return {};
  if (previewToken) return { robots: { index: false, follow: false } };
  return rootBuilderMetadata(slug);
}

export function CountryPage({ cc, rest, previewToken }: { cc: CountryCode; rest: string[] | undefined; previewToken?: string }) {
  const slug = slugOf(cc, rest);
  if (!slug) notFound();
  return <RootBuilderPage slug={slug} previewToken={previewToken} />;
}
