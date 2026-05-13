import { createAdminClient, createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { TEMPLATE_REGISTRY } from "@/modules/themes/template-registry";
import { TemplateApplyButton } from "./template-apply-button";
import { CheckCircle } from "lucide-react";

export default async function ThemesPage() {
  const supabase = await createClient();
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  let activeTemplateSlug: string | null = null;
  if (tenantId) {
    const admin = await createAdminClient();
    const { data } = await admin
      .from("site_identity")
      .select("active_template_slug")
      .eq("tenant_id", tenantId)
      .single();
    activeTemplateSlug = (data as { active_template_slug?: string } | null)?.active_template_slug ?? null;
  }

  // Group by category
  const byCategory: Record<string, typeof TEMPLATE_REGISTRY> = {};
  for (const t of TEMPLATE_REGISTRY) {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Templates</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {activeTemplateSlug
            ? `Active template: ${TEMPLATE_REGISTRY.find(t => t.slug === activeTemplateSlug)?.name ?? activeTemplateSlug}`
            : "No template active — pick one below to transform your site instantly."}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Switching template changes your site&apos;s colors, fonts, layout variants, real images, services, and all content.
        </p>
      </div>

      {/* Active template hero card */}
      {activeTemplateSlug && (() => {
        const active = TEMPLATE_REGISTRY.find(t => t.slug === activeTemplateSlug);
        if (!active) return null;
        return (
          <div className="relative rounded-2xl overflow-hidden border-2 border-primary shadow-lg">
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active.previewImage} alt={active.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
            </div>
            <div className="relative z-10 p-8 flex items-end justify-between">
              <div className="text-white">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 text-sm font-semibold">Active Template</span>
                </div>
                <h2 className="text-2xl font-bold mb-1">{active.name}</h2>
                <p className="text-white/70 text-sm max-w-md">{active.description}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {active.tags.slice(0, 5).map(tag => (
                    <span key={tag} className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="shrink-0 flex flex-col gap-2">
                <div className="flex gap-1.5">
                  {Object.entries({
                    primary: active.palette.primary,
                    secondary: active.palette.secondary,
                    accent: active.palette.accent,
                    bg: active.palette.background,
                  }).map(([k, v]) => (
                    <div key={k} className="w-6 h-6 rounded-full border-2 border-white/30 shadow" style={{ background: v }} title={k} />
                  ))}
                </div>
                <p className="text-white/50 text-xs text-right">{active.typography.headingFont}</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Templates by category */}
      {Object.entries(byCategory).map(([category, templates]) => (
        <div key={category}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map(template => {
              const isActive = template.slug === activeTemplateSlug;
              return (
                <div key={template.slug} className={`rounded-xl border overflow-hidden bg-card hover:shadow-lg transition-all duration-200 ${isActive ? "ring-2 ring-primary" : ""}`}>
                  {/* Preview image */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={template.previewImage}
                      alt={template.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {isActive && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-semibold">
                        <CheckCircle className="h-3 w-3" /> Active
                      </div>
                    )}
                    {/* Color palette swatch */}
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      {[template.palette.primary, template.palette.secondary, template.palette.accent, template.palette.background].map((color, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-white/40 shadow-sm" style={{ background: color }} />
                      ))}
                    </div>
                    {/* Font name */}
                    <div className="absolute bottom-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded">
                      {template.typography.headingFont}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base">{template.name}</h3>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">{template.category}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{template.description}</p>
                    </div>

                    {/* Layout variants preview */}
                    <div className="grid grid-cols-3 gap-1 text-[9px] text-muted-foreground">
                      <div className="bg-muted/50 rounded px-1.5 py-1 text-center truncate" title={template.variants.hero}>
                        Hero: {template.variants.hero.split("-")[0]}
                      </div>
                      <div className="bg-muted/50 rounded px-1.5 py-1 text-center truncate" title={template.variants.services}>
                        Services: {template.variants.services.split("-")[0]}
                      </div>
                      <div className="bg-muted/50 rounded px-1.5 py-1 text-center truncate" title={template.variants.testimonials}>
                        Reviews: {template.variants.testimonials.split("-")[0]}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-1 flex-wrap">
                      {template.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>

                    {/* Actions */}
                    <TemplateApplyButton
                      templateSlug={template.slug}
                      templateName={template.name}
                      isActive={isActive}
                      tenantId={tenantId ?? ""}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
