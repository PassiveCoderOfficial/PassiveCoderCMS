import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { MarketplaceShopView, type ShopSearchParams } from "@/modules/registry/marketplace/shop-view";
import { SingleStoreShop } from "@/components/site/single-store-shop";
import { PageRenderer } from "@/components/site/page-renderer";
import { fetchGlobalLayout, isChromeBlock } from "@/lib/site/global-blocks";
import { getStudioHeader } from "@/lib/site/header-studio";
import { getStudioFooter } from "@/lib/site/footer-studio";
import { withSiteMedia } from "@/lib/media/site-media";
import type { Block } from "@/types/cms";
import { LanguageShell } from "@/components/site/language-shell";
import { storeText } from "@/lib/i18n-site/storefront-text";

type SP = ShopSearchParams;
interface Props {
  // lang is set by the /<lang>/shop route (app/(site)/[lang]/shop).
  params?: Promise<{ lang?: string }>;
  searchParams: Promise<SP>;
}

/** Main language + the site's other languages (Settings > Languages). */
async function shopLanguages(tenantId: string | null) {
  if (!tenantId) return { main: "en", langs: [] as string[] };
  const admin = await createAdminClient();
  const { data } = await admin.from("site_settings").select("language, site_languages").eq("tenant_id", tenantId).maybeSingle();
  const main = ((data?.language as string) || "en").split("-")[0];
  const langs = ((data?.site_languages as string[] | null) ?? []).map((l) => l.split("-")[0]).filter((l) => l !== main);
  return { main, langs };
}

const alternatesOf = (main: string, langs: string[]) =>
  ({ [main]: "/shop", ...Object.fromEntries(langs.map((l) => [l, `/${l}/shop`])) }) as Record<string, string>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = (await params)?.lang ?? null;
  const { main, langs } = await shopLanguages((await headers()).get("x-tenant-id"));
  return {
    title: storeText(lang).shopTitle,
    ...(langs.length ? { alternates: { languages: alternatesOf(main, langs) } } : {}),
  };
}

/**
 * Marketplace search / catalogue — Shopee-style: filter sidebar (drawer on
 * phones), sort tabs, dense product grid. With `?vendor=` it becomes that
 * seller's shop page, headed by a shop banner with chat.
 */
export default async function ShopPage({ params, searchParams }: Props) {
  const sp = await searchParams;
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) return null;
  const lang = (await params)?.lang?.toLowerCase() ?? null;
  const { main, langs } = await shopLanguages(tenantId);
  // /<lang>/shop exists only for the site's own languages.
  if (lang && !langs.includes(lang)) notFound();
  const shell = (el: ReactNode) => (lang || langs.length
    ? <LanguageShell tenantId={tenantId} lang={lang} main={main} alternates={alternatesOf(main, langs)}>{el}</LanguageShell>
    : el);

  const admin = await createAdminClient();

  // A store can design its own /shop landing page (a published page with the
  // slug "shop", e.g. when the homepage is a company profile). It shows when
  // nothing is filtered; ?category= / ?q= / paging still get the product list,
  // so category tiles and search keep working.
  // Only real filters count; tracking params (utm_*, fbclid, ?v=) keep the landing page.
  const filtered = (["q", "category", "vendor", "sort", "min", "max", "rating", "page"] as const).some((k) => !!sp[k]);
  if (!filtered) {
    const [{ data: page }, layout, studioHeader, studioFooter] = await Promise.all([
      admin.from("pages").select("blocks").eq("tenant_id", tenantId).eq("slug", lang ? `${lang}/shop` : "shop").eq("status", "published").is("deleted_at", null).maybeSingle(),
      fetchGlobalLayout(tenantId),
      getStudioHeader(tenantId),
      getStudioFooter(tenantId),
    ]);
    const raw: Block[] = Array.isArray(page?.blocks) ? (page!.blocks as Block[]) : [];
    if (raw.length) {
      const blocks = raw.filter((b) => !((layout.header.length || studioHeader) && isChromeBlock(b, "header")) && !((layout.footer.length || studioFooter) && isChromeBlock(b, "footer")));
      return shell(<div className="min-h-screen"><PageRenderer blocks={withSiteMedia(blocks)} /></div>);
    }
  }

  // An ordinary single-store tenant has no sellers, and every query below
  // inner-joins `vendors` — its own catalogue would always come back empty.
  // Same "approved ecommerce sellers exist" test checkout/page.tsx routes on.
  const { count: sellerCount } = await admin
    .from("vendors")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "approved")
    .contains("capabilities", ["ecommerce"]);
  if ((sellerCount ?? 0) === 0) return shell(<SingleStoreShop tenantId={tenantId} sp={sp} lang={lang} />);
  // The marketplace catalogue has no language versions yet.
  if (lang) notFound();

  // Categories have their own address (/fashion); old ?category=<id|slug>
  // links land there with the rest of the filters kept.
  if (sp.category) {
    const isId = /^[0-9a-f-]{36}$/i.test(sp.category);
    const { data: cat } = await admin.from("categories").select("slug").eq("tenant_id", tenantId).eq("type", "product")
      .eq(isId ? "id" : "slug", sp.category).maybeSingle();
    if (cat?.slug) {
      const rest = new URLSearchParams();
      for (const [k, v] of Object.entries(sp)) if (v && k !== "category") rest.set(k, v);
      const qs = rest.toString();
      permanentRedirect(`/${cat.slug}${qs ? `?${qs}` : ""}`);
    }
  }

  return <MarketplaceShopView tenantId={tenantId} sp={sp} />;
}
