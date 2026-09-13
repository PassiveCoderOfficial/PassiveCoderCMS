"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Zap, ChevronRight, Sparkles, Star } from "lucide-react";
import { TEMPLATE_CATEGORIES, type Template } from "@/lib/templates/templates-data";


function TemplateThumbnail({ template }: { template: Template }) {
  // The template's own screenshot_url. Previously a slug lookup against a
  // hardcoded map, which only matched the fabricated catalog entries.
  const src = template.heroImage;

  return (
    <div className="w-full aspect-[4/3] rounded-t-xl overflow-hidden relative bg-gray-100">
      {src ? (
        <Image
          src={src}
          alt={template.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover object-top"
          loading="lazy"
        />
      ) : (
        // Engine-authored templates have no screenshot until one is captured
        // — show their brand colours rather than a broken/empty image.
        <div
          className="w-full h-full"
          style={{ background: `linear-gradient(135deg, ${template.thumbFrom}, ${template.thumbTo})` }}
        />
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  return (
    <div className="group bg-white rounded-2xl border border-white/[0.08] hover:border-indigo-300/60 hover:shadow-2xl hover:shadow-indigo-950/40 transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative flex-shrink-0">
        <TemplateThumbnail template={template} />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1 z-10">
          {template.featured && (
            <span className="flex items-center gap-0.5 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md">
              <Star className="w-2 h-2 fill-current" /> Featured
            </span>
          )}
          {template.badge && (
            <span className="bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md">
              {template.badge}
            </span>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-t-2xl flex items-center justify-center gap-2">
          <Link
            href={`/templates/${template.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 bg-white text-gray-900 text-xs font-bold px-3.5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors shadow-xl"
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </Link>
          <Link
            href={`/onboarding?template=${template.slug}`}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl hover:bg-indigo-500 transition-colors shadow-xl"
          >
            <Zap className="w-3.5 h-3.5" /> Use Template
          </Link>
        </div>
      </div>

      {/* Card info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-sm truncate">{template.name}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{template.category}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: `${template.accentColorHex}18`, color: template.accentColorHex }}
            >
              {template.pages}p
            </span>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed flex-1">{template.description}</p>

        <div className="flex flex-wrap gap-1 mt-3">
          {template.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">{tag}</span>
          ))}
          {template.hasDemo && (
            <span className="text-[10px] bg-emerald-50 text-emerald-600 font-medium px-1.5 py-0.5 rounded-md">Demo</span>
          )}
        </div>

        {/* Action row */}
        <div className="flex gap-2 mt-4">
          <Link
            href={`/templates/${template.slug}`}
            target="_blank"
            className="flex-none flex items-center justify-center gap-1 border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 text-xs font-medium px-3 py-2 rounded-xl transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/onboarding?template=${template.slug}`}
            className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 text-white text-xs font-bold py-2 rounded-xl hover:bg-indigo-500 transition-all shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" /> Use Template
          </Link>
        </div>
      </div>
    </div>
  );
}

const ITEMS_PER_PAGE = 12;

/**
 * @param extraTemplates the published templates to show, mapped from the
 *   `templates` table by dbTemplateToCatalogItem. Named "extra" from when
 *   these supplemented a static catalog; they are now the whole list.
 */
export default function TemplatesShowcase({ extraTemplates = [] }: { extraTemplates?: Template[] } = {}) {
  const [category, setCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Every card here is a real published template from the DB. This used to
  // concatenate a 55-entry hardcoded marketing list, 49 of which described
  // templates that did not exist — their preview 404'd and picking one at
  // signup quietly produced a blank site.
  const allTemplates = extraTemplates;

  const filtered = useMemo(() => {
    return allTemplates.filter(t => {
      const matchCat = category === "All" || t.category === category;
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [allTemplates, category, search]);

  const displayed = showAll ? filtered : filtered.slice(0, ITEMS_PER_PAGE);
  const hasMore = filtered.length > ITEMS_PER_PAGE && !showAll;

  return (
    <section id="templates" className="py-24 bg-[#05060a] border-t border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 bg-white/[0.06] text-indigo-300 text-xs font-semibold px-4 py-2 rounded-full mb-4 border border-white/[0.08]">
            <Sparkles className="w-3.5 h-3.5" /> {allTemplates.length} Industry Templates
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Pick a template. Launch in minutes.
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Every template ships with real demo content, full mobile optimization, and a contact form — ready to go live the same day.
          </p>
        </div>

        {/* Search + filter row */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-8">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setShowAll(false); }}
            placeholder="Search by industry, style or feature…"
            className="flex-1 border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white/[0.04]"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {TEMPLATE_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setShowAll(false); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                category === cat
                  ? "bg-white text-slate-950"
                  : "bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:border-white/[0.15] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-xs text-slate-500 text-center mb-6">
          {filtered.length} template{filtered.length !== 1 ? "s" : ""}
          {category !== "All" && ` in ${category}`}
          {search && ` matching "${search}"`}
        </p>

        {/* Grid */}
        {displayed.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-sm">No templates found for &quot;{search}&quot;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayed.map(t => <TemplateCard key={t.id} template={t} />)}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="text-center mt-12">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.1] hover:border-white/[0.2] text-slate-300 hover:text-white font-semibold px-8 py-3.5 rounded-xl transition-all"
            >
              Show all {filtered.length} templates
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bottom note */}
        <div className="text-center mt-12 text-sm text-slate-500">
          Don&apos;t see your industry?{" "}
          <Link href="/contact" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Request a custom template →
          </Link>
        </div>
      </div>
    </section>
  );
}
