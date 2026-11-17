import { FOCUS_PRESETS } from "@/lib/image-focus";
import { NextResponse } from "next/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { canWriteSite } from "@/lib/auth/site-write";
import { createAdminClient } from "@/lib/supabase/server";
import { invalidateSiteCache } from "@/lib/supabase/public-cache";
import { resolveDbTemplateIdentity } from "@/modules/templates/resolve-identity";
import { SITE_FALLBACK_PALETTE, SITE_FALLBACK_TYPOGRAPHY } from "@/modules/themes/site-theme";
import { FONT_OPTIONS } from "@/modules/themes/fonts";
import type { SiteDesign, TemplatePalette } from "@/modules/themes/template-types";

/**
 * Site design for the mobile app (same data as Design > Colors & Design and
 * Settings > Appearance on the web): the active template's palette and fonts,
 * the site's colour/design overrides and the visitor colour scheme.
 *
 * PATCH { color_overrides?, design_overrides?, site_theme? } — null resets to
 * the template default. Writes run as the caller (RLS, like the web editor)
 * after the shared write-rights check.
 */
const COLOR_KEYS = ["primary", "secondary", "accent", "background", "foreground"] as const;
const HEX = /^#[0-9a-f]{3,8}$/i;
const DESIGN_KEYS: (keyof SiteDesign)[] = ["headingFont", "bodyFont", "headingWeight", "letterSpacing", "headingStyle", "roundness", "shadow", "motion", "headingColor", "imageFocus", "buttonShape", "cardHeadingWeight"];

export async function GET(req: Request) {
  const caller = await getApiCaller(req);
  if (!caller?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await createAdminClient();
  const [{ data: idn }, { data: st }] = await Promise.all([
    admin.from("site_identity").select("template_id, color_overrides, design_overrides").eq("tenant_id", caller.tenantId).maybeSingle(),
    admin.from("site_settings").select("site_theme").eq("tenant_id", caller.tenantId).maybeSingle(),
  ]);
  const templateId = (idn?.template_id as string | null) ?? null;
  const tpl = templateId ? await resolveDbTemplateIdentity(templateId) : null;
  return NextResponse.json({
    templateId,
    palette: tpl?.palette ?? SITE_FALLBACK_PALETTE,
    typography: tpl?.typography ?? SITE_FALLBACK_TYPOGRAPHY,
    colorOverrides: (idn?.color_overrides as Partial<TemplatePalette> | null) ?? {},
    designOverrides: (idn?.design_overrides as SiteDesign | null) ?? {},
    siteTheme: (st?.site_theme as string | null) ?? "system",
    fonts: FONT_OPTIONS,
  });
}

export async function PATCH(req: Request) {
  const caller = await getApiCaller(req);
  if (!caller?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(caller.tenantId))) return NextResponse.json({ error: "Your role can't change this site's design." }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { color_overrides?: Record<string, string> | null; design_overrides?: Record<string, string> | null; site_theme?: string };
  const now = new Date().toISOString();
  const identity: Record<string, unknown> = {};

  if ("color_overrides" in b) {
    const c: Record<string, string> = {};
    for (const k of COLOR_KEYS) {
      const v = b.color_overrides?.[k];
      if (typeof v === "string" && v) {
        if (!HEX.test(v)) return NextResponse.json({ error: `${k}: use a colour like #1a2b3c` }, { status: 400 });
        c[k] = v;
      }
    }
    identity.color_overrides = Object.keys(c).length ? c : null;
  }
  if ("design_overrides" in b) {
    const d: Record<string, string> = {};
    for (const k of DESIGN_KEYS) {
      const v = b.design_overrides?.[k];
      if (typeof v === "string" && v) d[k] = v;
    }
    if (d.headingColor && !HEX.test(d.headingColor)) return NextResponse.json({ error: "Heading colour: use a colour like #1a2b3c" }, { status: 400 });
    if (d.imageFocus && !(FOCUS_PRESETS as readonly string[]).includes(d.imageFocus)) return NextResponse.json({ error: "Unknown image focus" }, { status: 400 });
    if (d.headingFont && !FONT_OPTIONS.some((f) => f.name === d.headingFont)) return NextResponse.json({ error: "Unknown heading font" }, { status: 400 });
    if (d.bodyFont && !FONT_OPTIONS.some((f) => f.name === d.bodyFont)) return NextResponse.json({ error: "Unknown body font" }, { status: 400 });
    identity.design_overrides = Object.keys(d).length ? d : null;
  }

  if (Object.keys(identity).length) {
    const { error } = await caller.supabase.from("site_identity")
      .upsert({ tenant_id: caller.tenantId, ...identity, updated_at: now }, { onConflict: "tenant_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (b.site_theme !== undefined) {
    if (!["light", "dark", "system"].includes(b.site_theme)) return NextResponse.json({ error: "Unknown theme" }, { status: 400 });
    const { error } = await caller.supabase.from("site_settings")
      .upsert({ tenant_id: caller.tenantId, site_theme: b.site_theme, updated_at: now }, { onConflict: "tenant_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  invalidateSiteCache(caller.tenantId);
  return NextResponse.json({ ok: true });
}
