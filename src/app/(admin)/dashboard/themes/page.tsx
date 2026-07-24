import { createAdminClient, createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { TEMPLATE_REGISTRY } from "@/modules/themes/template-registry";
import { TemplateBrowser } from "./template-browser";
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

      {/* Templates — search, category filter, apply */}
      <TemplateBrowser
        templates={TEMPLATE_REGISTRY}
        activeTemplateSlug={activeTemplateSlug}
        tenantId={tenantId ?? ""}
      />
    </div>
  );
}
