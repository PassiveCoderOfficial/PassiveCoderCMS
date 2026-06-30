import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PageRenderer } from "@/components/site/page-renderer";
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
  return {
    title: seo?.title ?? page.title,
    description: seo?.description,
    keywords: seo?.keywords,
    openGraph: {
      title: seo?.og_title ?? seo?.title ?? page.title,
      description: seo?.og_description ?? seo?.description,
      images: seo?.og_image ? [seo.og_image] : [],
    },
    robots: seo?.no_index ? { index: false } : undefined,
    alternates: seo?.canonical ? { canonical: seo.canonical } : undefined,
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
    // No home page published — send visitor to dashboard to set one up.
    // Never show a placeholder welcome screen to public visitors.
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }

  const blocks: Block[] = Array.isArray(page.blocks) ? page.blocks : [];

  // Global pre-footer (CTA + contact) — injected once site-wide, skipped on pages
  // that already have their own contact block.
  const { prefooter } = await fetchGlobalLayout(tenantId);
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
