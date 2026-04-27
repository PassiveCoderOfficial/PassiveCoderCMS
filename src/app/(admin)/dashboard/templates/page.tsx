"use client";

import { useState } from "react";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates/templates-data";
import { toast } from "sonner";
import { Loader2, ExternalLink, CheckCircle, Sparkles, Layout } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

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

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [applying, setApplying] = useState<string | null>(null);
  const [modes, setModes] = useState<Record<string, "theme" | "full">>({});

  const categories = ["All", ...TEMPLATE_CATEGORIES.filter(c => c !== "All")];

  const filtered = TEMPLATES.filter(t => {
    const matchCat = activeCategory === "All" || t.category === activeCategory;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  async function applyTemplate(slug: string) {
    const mode = modes[slug] ?? "theme";
    if (!confirm(`Apply "${slug}" template in ${mode} mode? This will overwrite current site identity${mode === "full" ? ", services, testimonials, pricing, and contact details" : ""}.`)) return;

    setApplying(slug);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data: membership } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).single();
      if (!membership) throw new Error("No site found");

      const res = await fetch("/api/templates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: membership.tenant_id, templateSlug: slug, mode }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Template "${slug}" applied!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply template");
    } finally {
      setApplying(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Templates</h1>
        <p className="text-muted-foreground text-sm mt-1">Apply a template to instantly populate your site with professional content and design.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="border rounded-lg px-3 py-2 text-sm bg-background flex-1"
          placeholder="Search templates..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(template => {
          const icons = CATEGORY_ICONS[template.category] ?? ["⭐", "✅", "🎯"];
          const mode = modes[template.slug] ?? "theme";
          const isApplying = applying === template.slug;

          return (
            <div key={template.slug} className="rounded-xl border overflow-hidden bg-card hover:shadow-md transition-shadow">
              {/* Thumbnail */}
              <div
                className="h-32 relative"
                style={{ background: `linear-gradient(135deg, ${template.thumbFrom}, ${template.thumbTo})` }}
              >
                <div className="absolute inset-x-2 top-2 bg-black/20 backdrop-blur-sm rounded px-2 py-1 flex items-center gap-1">
                  <div className="flex gap-0.5"><div className="w-1 h-1 rounded-full bg-red-400/70"/><div className="w-1 h-1 rounded-full bg-yellow-400/70"/><div className="w-1 h-1 rounded-full bg-green-400/70"/></div>
                  <span className="text-[7px] text-white/50 flex-1 text-center truncate">{template.slug}.passivecoder.com</span>
                </div>
                <div className="absolute inset-x-2 bottom-2 grid grid-cols-3 gap-1">
                  {icons.map((ic, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded px-1 py-0.5 text-center">
                      <span className="text-[9px]">{ic}</span>
                    </div>
                  ))}
                </div>
                {template.featured && (
                  <div className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full">Hot</div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{template.name}</p>
                    <p className="text-[10px] text-muted-foreground">{template.category}</p>
                  </div>
                  <a href={`/templates/${template.slug}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Mode toggle */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setModes(m => ({ ...m, [template.slug]: "theme" }))}
                    className={cn("flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded border transition-all",
                      mode === "theme" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40")}
                  >
                    <Layout className="w-2.5 h-2.5" /> Theme only
                  </button>
                  <button
                    onClick={() => setModes(m => ({ ...m, [template.slug]: "full" }))}
                    className={cn("flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded border transition-all",
                      mode === "full" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40")}
                  >
                    <Sparkles className="w-2.5 h-2.5" /> Full demo
                  </button>
                </div>

                <button
                  onClick={() => applyTemplate(template.slug)}
                  disabled={!!applying}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  {isApplying ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                  {isApplying ? "Applying…" : "Apply Template"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">No templates found for "{search}"</div>
      )}
    </div>
  );
}
