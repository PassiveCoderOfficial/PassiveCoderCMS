"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Eye, Zap, ChevronRight, Sparkles, Star } from "lucide-react";
import { TEMPLATES, TEMPLATE_CATEGORIES, type Template } from "@/lib/templates/templates-data";

// Category-specific service icons for thumbnail cards
const CATEGORY_ICONS: Record<string, string[]> = {
  "Cleaning":                  ["🧹", "✨", "🪣"],
  "HVAC & Plumbing":           ["❄️", "🔧", "💨"],
  "Renovation & Construction": ["🏗️", "🔨", "📐"],
  "Interior Design":           ["🪑", "🎨", "💡"],
  "Restaurant & Cafe":         ["🍽️", "👨‍🍳", "🍷"],
  "Health & Beauty":           ["✂️", "💅", "🌸"],
  "Fitness & Sports":          ["💪", "🏋️", "🥊"],
  "Legal & Finance":           ["⚖️", "📊", "🏛️"],
  "Real Estate":               ["🏠", "🔑", "📍"],
  "Photography":               ["📸", "🎬", "💍"],
  "Education":                 ["📚", "🎓", "💻"],
  "Retail & Shop":             ["🛍️", "🏷️", "📦"],
  "Automotive":                ["🚗", "🔧", "⚙️"],
  "Events":                    ["🎉", "💒", "🎭"],
  "Tech & Agency":             ["💻", "📈", "🎯"],
  "General Business":          ["📋", "🤝", "🌐"],
};

const CATEGORY_SERVICES: Record<string, string[]> = {
  "Cleaning":                  ["Deep Clean", "Regular Service", "End-of-Lease"],
  "HVAC & Plumbing":           ["Installation", "Repair", "Maintenance"],
  "Renovation & Construction": ["New Build", "Renovation", "Fit-Out"],
  "Interior Design":           ["Full Design", "Space Plan", "Styling"],
  "Restaurant & Cafe":         ["Dine In", "Reservations", "Private Events"],
  "Health & Beauty":           ["Hair & Style", "Treatments", "Bridal"],
  "Fitness & Sports":          ["Memberships", "PT Sessions", "Classes"],
  "Legal & Finance":           ["Consultation", "Corporate", "Litigation"],
  "Real Estate":               ["Buy", "Rent", "Manage"],
  "Photography":               ["Weddings", "Portraits", "Commercial"],
  "Education":                 ["Courses", "Tutoring", "Programs"],
  "Retail & Shop":             ["Browse", "New Arrivals", "Offers"],
  "Automotive":                ["Servicing", "Repairs", "Detailing"],
  "Events":                    ["Weddings", "Corporate", "Private"],
  "Tech & Agency":             ["Strategy", "Development", "SEO"],
  "General Business":          ["Services", "About", "Contact"],
};

function TemplateThumbnail({ template }: { template: Template }) {
  const icons = CATEGORY_ICONS[template.category] ?? ["⭐", "✅", "🎯"];
  const services = CATEGORY_SERVICES[template.category] ?? ["Service 1", "Service 2", "Service 3"];

  return (
    <div
      className="w-full aspect-[4/3] rounded-t-xl overflow-hidden relative"
      style={{ background: `linear-gradient(135deg, ${template.thumbFrom}, ${template.thumbTo})` }}
    >
      {/* Subtle decorative radial glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle at 75% 30%, rgba(255,255,255,0.6), transparent 60%)" }}
      />

      {/* Mock browser chrome */}
      <div className="absolute inset-x-3 top-3 bg-black/25 backdrop-blur-sm rounded-lg overflow-hidden">
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-400/80" />
          </div>
          <div className="flex-1 bg-white/10 rounded px-2 py-0.5 text-[9px] text-white/60 text-center truncate">
            {template.slug}.passivecoder.com
          </div>
        </div>
      </div>

      {/* Mock hero content */}
      <div className="absolute inset-x-3 top-11 bottom-3 flex flex-col justify-between px-3 py-2">
        {/* Top: headline */}
        <div>
          <div className="text-white/70 text-[8px] font-bold uppercase tracking-widest mb-1">
            {template.category}
          </div>
          <div className="text-white font-extrabold text-[11px] leading-tight mb-1 line-clamp-2">
            {template.heroHeadline}
          </div>
          <div className="text-white/65 text-[9px] leading-relaxed line-clamp-1 mb-2">
            {template.heroSubline}
          </div>
          <div className="flex gap-1.5">
            <div className="text-[8px] font-bold px-2 py-0.5 rounded-md text-white bg-white/20 border border-white/30">
              Get Started
            </div>
            <div className="text-[8px] font-bold px-2 py-0.5 rounded-md border border-white/25 text-white/80">
              Learn More
            </div>
          </div>
        </div>

        {/* Bottom: service cards with real icons + labels */}
        <div className="grid grid-cols-3 gap-1">
          {icons.map((icon, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-md p-1.5 border border-white/10 text-center">
              <div className="text-sm leading-none mb-1">{icon}</div>
              <div className="text-[7px] text-white/80 font-semibold truncate">{services[i]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  return (
    <div className="group bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-50 transition-all overflow-hidden">
      <div className="relative">
        <TemplateThumbnail template={template} />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1 z-10">
          {template.featured && (
            <span className="flex items-center gap-0.5 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              <Star className="w-2 h-2 fill-current" /> Featured
            </span>
          )}
          {template.badge && (
            <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {template.badge}
            </span>
          )}
          {template.hasDemo && (
            <span className="bg-black/40 text-white/90 text-[9px] font-medium px-1.5 py-0.5 rounded-full backdrop-blur-sm">
              Demo Content
            </span>
          )}
        </div>

        {/* Hover overlay with buttons */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl flex items-center justify-center gap-2">
          <Link
            href={`/templates/${template.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 bg-white text-gray-900 text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </Link>
          <Link
            href={`/onboarding?template=${template.slug}`}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-bold px-3 py-2 rounded-lg hover:from-orange-600 hover:to-rose-600 transition-colors shadow-lg"
          >
            <Zap className="w-3.5 h-3.5" /> Build With This
          </Link>
        </div>
      </div>

      {/* Card info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{template.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{template.category}</p>
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0">{template.pages} pages</span>
        </div>
        <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{template.description}</p>

        <div className="flex flex-wrap gap-1 mt-3">
          {template.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
          ))}
        </div>

        {/* Bottom action row (always visible) */}
        <div className="flex gap-2 mt-4">
          <Link
            href={`/templates/${template.slug}`}
            target="_blank"
            className="flex-1 flex items-center justify-center gap-1 border border-gray-200 hover:border-orange-300 text-gray-600 hover:text-orange-500 text-xs font-medium py-2 rounded-lg transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </Link>
          <Link
            href={`/onboarding?template=${template.slug}`}
            className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-bold py-2 rounded-lg hover:from-orange-600 hover:to-rose-600 transition-all"
          >
            <Zap className="w-3.5 h-3.5" /> Build With This
          </Link>
        </div>
      </div>
    </div>
  );
}

const ITEMS_PER_PAGE = 12;

export default function TemplatesShowcase() {
  const [category, setCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchCat = category === "All" || t.category === category;
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [category, search]);

  const displayed = showAll ? filtered : filtered.slice(0, ITEMS_PER_PAGE);
  const hasMore = filtered.length > ITEMS_PER_PAGE && !showAll;

  return (
    <section id="templates" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3 h-3" /> {TEMPLATES.length} Ready-Made Templates
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Start with a professional template
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Every template is fully editable. Switch themes anytime, or import complete demo content with one click.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setShowAll(false); }}
            placeholder="Search templates (e.g. cleaning, salon, restaurant…)"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 bg-white shadow-sm"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {TEMPLATE_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setShowAll(false); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                category === cat
                  ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-200"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-sm text-gray-400 text-center mb-6">
          Showing {displayed.length} of {filtered.length} templates
          {category !== "All" && ` in ${category}`}
        </p>

        {/* Grid */}
        {displayed.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No templates found for &quot;{search}&quot;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayed.map(t => <TemplateCard key={t.id} template={t} />)}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="text-center mt-12">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-orange-300 text-gray-700 hover:text-orange-600 font-semibold px-8 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              Show All {filtered.length} Templates
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bottom note */}
        <div className="text-center mt-12 text-sm text-gray-400">
          Can&apos;t find what you need?{" "}
          <Link href="/contact" className="text-orange-500 hover:text-orange-600 font-medium">
            Request a custom template →
          </Link>
        </div>
      </div>
    </section>
  );
}
