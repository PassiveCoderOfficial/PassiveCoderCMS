import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layout, Zap } from "lucide-react";
import { TEMPLATE_REGISTRY } from "@/modules/themes/template-registry";
import { buildTemplateCSSVars } from "@/modules/themes/template-css";
import { buildHomePageBlocks } from "@/lib/templates/seed-template";
import { PageRenderer } from "@/components/site/page-renderer";

export async function generateStaticParams() {
  return TEMPLATE_REGISTRY.map(t => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = TEMPLATE_REGISTRY.find(x => x.slug === slug);
  if (!t) return {};
  return {
    title: `${t.name} — Website Template | Passive Coder`,
    description: t.description,
  };
}

export default async function TemplatePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = TEMPLATE_REGISTRY.find(t => t.slug === slug);
  if (!template) notFound();

  // Same blocks seedTemplate() writes to a real tenant, rendered through the
  // same PageRenderer a live site uses — this preview IS the applied result,
  // not a separate mockup, so it can never drift from what "Build With This"
  // actually produces.
  const blocks = buildHomePageBlocks(template);
  const cssVars = buildTemplateCSSVars(template.palette, template.typography);

  return (
    <div className={`min-h-screen template-${template.slug}`}>
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      {template.customCss && <style dangerouslySetInnerHTML={{ __html: template.customCss }} />}

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

          <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
            <span>Previewing demo · </span>
            <span className="font-medium text-gray-600">{template.name}</span>
          </div>

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
