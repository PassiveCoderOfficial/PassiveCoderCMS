import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layout, Zap } from "lucide-react";
import { buildTemplateCSSVars } from "@/modules/themes/template-css";
import { PageRenderer } from "@/components/site/page-renderer";
import { createAdminClient } from "@/lib/supabase/server";
import { resolvePreviewTemplate } from "@/modules/templates/preview";

// Templates live in the DB and change at runtime, so this route can't be
// fully static. Published slugs are pre-rendered at build time; anything
// created or published later renders on demand.
export const dynamicParams = true;

export async function generateStaticParams() {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("templates")
    .select("slug")
    .not("owner_id", "is", null)
    .eq("status", "published");
  return (data ?? []).map((t) => ({ slug: t.slug as string }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = await createAdminClient();
  const resolved = await resolvePreviewTemplate(admin, slug);
  if (!resolved) return {};
  return {
    title: `${resolved.name} — Website Template | Passive Coder`,
    description: resolved.description,
  };
}

export default async function TemplatePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageSlug } = await searchParams;
  const admin = await createAdminClient();

  // Resolves a registry template or a published DB one into the same shape:
  // blocks to render + the palette/typography to render them under. Either
  // way the preview IS the applied result — same PageRenderer a live tenant
  // site uses — so it can't drift from what "Build With This" produces.
  const template = await resolvePreviewTemplate(admin, slug, pageSlug);
  if (!template) notFound();

  const blocks = template.blocks;
  const cssVars = buildTemplateCSSVars(template.palette, template.typography);

  return (
    <div className={`min-h-screen template-${template.slug}`}>
      <style precedence="pc-template" dangerouslySetInnerHTML={{ __html: cssVars }} />
      {template.customCss && <style precedence="pc-template-css" dangerouslySetInnerHTML={{ __html: template.customCss }} />}

      {/* ── Fixed top bar ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 h-13 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/templates"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <span className="text-gray-300 hidden sm:block">/</span>
            <span className="font-semibold text-gray-900 text-sm hidden sm:block">{template.name}</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full hidden sm:block">
              {template.category}
            </span>
          </div>

          {/* Multi-page templates get a page switcher; single-page ones just
              show the label, so the bar doesn't look broken either way. */}
          {template.pages.length > 1 ? (
            <div className="hidden md:flex items-center gap-1 overflow-x-auto">
              {template.pages.map((p) => (
                <Link
                  key={p.slug}
                  href={`/templates/${template.slug}?page=${p.slug}`}
                  className="whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                >
                  {p.title}
                </Link>
              ))}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
              <span>Previewing demo · </span>
              <span className="font-medium text-gray-600">{template.name}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Link
              href={`/onboarding?template=${template.slug}&mode=theme`}
              className="hidden sm:flex items-center gap-1.5 border border-gray-200 hover:border-orange-300 text-gray-700 hover:text-orange-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Layout className="w-3.5 h-3.5" /> Theme Only
            </Link>
            <Link
              href={`/onboarding?template=${template.slug}&mode=full`}
              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-bold px-4 py-2 rounded-lg hover:from-orange-600 hover:to-rose-600 transition-all shadow-md shadow-orange-200"
            >
              <Zap className="w-3.5 h-3.5" /> Build With This
            </Link>
          </div>
        </div>
      </div>

      {/* ── Full-width demo site — real blocks, real renderer ──────────────── */}
      <div style={{ background: template.palette.background }}>
        <PageRenderer blocks={blocks} />
      </div>
    </div>
  );
}
