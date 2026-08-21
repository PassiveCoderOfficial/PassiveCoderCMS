import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { PageRenderer } from "@/components/site/page-renderer";
import { MarketplaceHome } from "@/components/marketplace-ecom/marketplace-home";
import { fetchGlobalLayout, shouldInjectPrefooter } from "@/lib/site/global-blocks";
import { isSaaS } from "@/lib/flags";
import type { Block, Page } from "@/types/cms";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pageSlug = slug?.join("/") ?? "home";

  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  const supabase = await createClient();
  let metaQuery = supabase
    .from("pages")
    .select("title, seo")
    .eq("slug", pageSlug)
    .eq("status", "published");
  if (tenantId) {
    metaQuery = metaQuery.eq("tenant_id", tenantId);
  } else {
    metaQuery = metaQuery.is("tenant_id", null);
  }
  const { data: page } = await metaQuery.maybeSingle();

  if (!page) return { title: "Not Found" };

  const seo = page.seo as Page["seo"];
  const ne = (v: string | null | undefined) =>
    typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;

  const pageDescription = ne(seo?.description);
  const ogDescription = ne(seo?.og_description) ?? pageDescription;
  const ogTitle = ne(seo?.og_title) ?? ne(seo?.title) ?? page.title;
  const ogImage = ne(seo?.og_image);

  // Keys are omitted, never set to undefined. Next merges page metadata over
  // the layout's per key, and an explicit `description: undefined` counts as
  // a value — it replaced the tenant description from (site)/layout.tsx with
  // nothing, which is why tenant sites fell back to the platform's. Same for
  // openGraph: sending the object with an undefined description wipes the
  // layout's, so it's only included when there's something to say.
  const og: NonNullable<Metadata["openGraph"]> = { title: ogTitle };
  if (ogDescription) og.description = ogDescription;
  if (ogImage) og.images = [ogImage];

  return {
    title: ne(seo?.title) ?? page.title,
    ...(pageDescription ? { description: pageDescription } : {}),
    ...(seo?.keywords ? { keywords: seo.keywords } : {}),
    openGraph: og,
    ...(seo?.no_index ? { robots: { index: false } } : {}),
    ...(seo?.canonical ? { alternates: { canonical: seo.canonical } } : {}),
  };
}

export default async function SitePage({ params }: Props) {
  const { slug } = await params;
  const pageSlug = slug?.join("/") ?? "home";

  // In SaaS mode the proxy injects x-tenant-id. In standalone / local dev,
  // marketing routes should take priority — but Next.js catch-all still wins
  // at the router level. We guard here: if no tenant header and not root, 404
  // (which forces Next.js to try the more-specific marketing route group next).
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");
  const isRoot = !slug || slug.length === 0;

  if (isSaaS && !tenantId && !isRoot) {
    // Check if this is a root-level page (tenant_id IS NULL) before 404ing
    const supabaseCheck = await createClient();
    const { data: rootCheck } = await supabaseCheck
      .from("pages")
      .select("id")
      .eq("slug", pageSlug)
      .eq("status", "published")
      .is("tenant_id", null)
      .maybeSingle();
    if (!rootCheck) notFound();
  }

  if (!isSaaS && !isRoot) {
    // Standalone mode: don't render tenant pages for non-root slugs.
    // Marketing pages like /templates/[slug] handle these paths.
    notFound();
  }

  const supabase = await createClient();
  // Tenant pages when tenantId present; root pages (tenant_id IS NULL) otherwise
  let pageQuery = supabase
    .from("pages")
    .select("*")
    .eq("slug", pageSlug)
    .eq("status", "published");
  if (tenantId) {
    pageQuery = pageQuery.eq("tenant_id", tenantId);
  } else {
    pageQuery = pageQuery.is("tenant_id", null);
  }
  const { data: page } = await pageQuery.maybeSingle();

  if (!page && !isRoot) notFound();

  if (!page) {
    // A marketplace tenant with no hand-built home page still has a real
    // storefront to show — products, categories and sellers all live in the
    // database already. Rendering it beats bouncing shoppers to the dashboard
    // or showing them an empty CMS shell.
    if (tenantId) {
      const admin = await createAdminClient();
      const { count: sellerCount } = await admin
        .from("vendors")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "approved")
        .contains("capabilities", ["ecommerce"]);
      if ((sellerCount ?? 0) > 0) {
        const { data: identity } = await admin
          .from("site_identity")
          .select("site_name")
          .eq("tenant_id", tenantId)
          .maybeSingle();
        return (
          <MarketplaceHome
            tenantId={tenantId}
            siteName={identity?.site_name ?? "our marketplace"}
          />
        );
      }
    }

    // No home page published — send visitor to dashboard to set one up.
    // Never show a placeholder welcome screen to public visitors.
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }

  const rawBlocks: Block[] = Array.isArray(page.blocks) ? page.blocks : [];

  // Site chrome (header/footer) is rendered once by (site)/layout.tsx from
  // site_identity.global_header / global_footer. When those exist, strip any
  // per-page navigation/footer blocks so they don't render twice.
  const { header, footer, prefooter } = await fetchGlobalLayout(tenantId);
  const hasGlobalHeader = header.length > 0;
  const hasGlobalFooter = footer.length > 0;
  const blocks: Block[] = rawBlocks.filter((b) => {
    if (hasGlobalHeader && b.type === "navigation") return false;
    if (hasGlobalFooter && b.type === "footer") return false;
    return true;
  });

  // Global pre-footer (CTA + contact) — injected once site-wide, skipped on pages
  // that already have their own contact block.
  const finalBlocks = prefooter.length > 0 && shouldInjectPrefooter(blocks)
    ? [...blocks, ...prefooter]
    : blocks;

  return (
    <div className="min-h-screen">
      <PageRenderer blocks={finalBlocks} />
    </div>
  );
}

// Pages are dynamic — disable static generation for catch-all
export const dynamic = "force-dynamic";
