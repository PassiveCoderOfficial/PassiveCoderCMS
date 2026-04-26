import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PageRenderer } from "@/components/site/page-renderer";
import { isSaaS } from "@/lib/flags";
import type { Block, Page } from "@/types/cms";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pageSlug = slug?.join("/") ?? "home";

  const supabase = await createClient();
  const { data: page } = await supabase
    .from("pages")
    .select("title, seo")
    .eq("slug", pageSlug)
    .eq("status", "published")
    .single();

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
    notFound();
  }

  if (!isSaaS && !isRoot) {
    // Standalone mode: don't render tenant pages for non-root slugs.
    // Marketing pages like /templates/[slug] handle these paths.
    notFound();
  }

  const supabase = await createClient();
  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", pageSlug)
    .eq("status", "published")
    .single();

  if (!page && !isRoot) notFound();

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white px-6">
        <div className="max-w-lg text-center space-y-6">
          <div className="text-6xl">🚀</div>
          <h1 className="text-4xl font-bold">CMS Studio is ready</h1>
          <p className="text-slate-400 text-lg">
            Your site is set up. Head to the admin panel to create your first page and publish it as <code className="text-blue-400 bg-slate-700 px-1.5 py-0.5 rounded text-sm">home</code>.
          </p>
          <a
            href="/dashboard"
            className="inline-block mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
          >
            Go to Admin Panel →
          </a>
        </div>
      </div>
    );
  }

  const blocks: Block[] = Array.isArray(page.blocks) ? page.blocks : [];

  return (
    <div className="min-h-screen">
      <PageRenderer blocks={blocks} />
    </div>
  );
}

// Pages are dynamic — disable static generation for catch-all
export const dynamic = "force-dynamic";
