import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Block, NavItem } from "@/types/cms";
import { getSiteContact } from "@/lib/site-contact";
import { asBlocks } from "@/modules/studio-switch/header-convert";
import { previewSwitch, type SwitchPreview } from "@/modules/studio-switch/run";
import { expandDynamicChildren } from "@/modules/navigation/dynamic-children";
import { normalizeMenu } from "@/modules/navigation/menu-model";
import { classicHeaderItems } from "@/modules/header-studio/classic-links";
import { mapNavBlocks, pickNavItems } from "@/modules/navigation/nav-blocks";
import type { FooterBlockProps } from "@/types/cms";
import { resolveDbTemplateIdentity } from "@/modules/templates/resolve-identity";
import { buildSiteTheme, type SiteThemeInput } from "@/modules/themes/site-theme";
import { styleText } from "@/lib/security/style-text";
import type { HeaderConfig } from "@/modules/header-studio/model";
import type { FooterConfig } from "@/modules/footer-studio/model";
import type { SiteContact } from "@/components/site/site-contact-context";
import type { SwitchNote, SwitchLevel, SwitchOrigin } from "@/modules/studio-switch/types";

/**
 * What the before/after dialog (owner) and the staff review show for one
 * site (menus P5): the classic blocks, the Studio draft (the stored one when
 * a switch was prepared, else a fresh conversion), the menus both need,
 * contact details, logo and the site's theme CSS for the preview frames.
 * Read only.
 */
export interface SwitchAreaPayload {
  state: "classic" | "draft" | "studio";
  ownDraft: boolean;
  level: SwitchLevel;
  notes: SwitchNote[];
  diffs: string[];
  /** The Studio side of the comparison. */
  config: HeaderConfig | FooterConfig | null;
  /** True when `config` is the stored draft (prepared earlier). */
  stored: boolean;
  switched: SwitchOrigin | null;
  /** The classic side: the blocks as stored. */
  classic: Block[];
}

export interface SwitchPayload {
  tenantId: string;
  siteName: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  contact: SiteContact | null;
  /** Menus for the previews: saved menus by id, new-menu refs, "" = the default header/footer menu. */
  menus: Record<string, NavItem[]>;
  themeCss: string;
  header: SwitchAreaPayload;
  footer: SwitchAreaPayload;
}

export async function buildSwitchPayload(db: SupabaseClient, tenantId: string, pv?: SwitchPreview): Promise<SwitchPayload> {
  const p = pv ?? await previewSwitch(db, tenantId);
  const s = p.site;
  const [contact, themeRow] = await Promise.all([
    getSiteContact(tenantId),
    db.from("site_identity").select("template_id, color_overrides, design_overrides").eq("tenant_id", tenantId).maybeSingle(),
  ]);

  // Menus both previews may ask for. Classic blocks resolve their own; the Studio side by id.
  const menus: Record<string, NavItem[]> = {};
  await Promise.all(s.menus.map(async (m) => { menus[m.id] = await expandDynamicChildren(db, tenantId, normalizeMenu(m.items)); }));
  const hc = p.header.conversion;
  if (hc.menu?.kind === "new") menus[hc.menu.ref] = hc.menu.items;
  for (const m of p.footer.conversion.newMenus) menus[m.ref] = m.items;
  const classic = classicHeaderItems(s.globalHeader);
  const headerMenu = s.menus.find((m) => m.location === "header");
  menus[""] = headerMenu ? menus[headerMenu.id] : classic ?? (s.menus[0] ? menus[s.menus[0].id] : s.bits.defaultItems ?? []);

  const theme = themeRow.data as (SiteThemeInput & { template_id?: string | null }) | null;
  const templateIdentity = theme?.template_id ? await resolveDbTemplateIdentity(theme.template_id) : null;
  const { css } = buildSiteTheme(theme, templateIdentity, ".cms-canvas-light");
  const themeCss = css + (templateIdentity?.customCss ? `\n${styleText(templateIdentity.customCss)}` : "");

  // The classic side, with every menu filled in from this site's saved menus
  // (and its automatic menu), so the preview never fetches the viewer's own
  // site's menus (the staff review shows other sites).
  const byLocation = new Map<string, NavItem[]>();
  const byId = new Map<string, NavItem[]>();
  for (const m of s.menus) { if (m.location) byLocation.set(m.location, menus[m.id]); byId.set(m.id, menus[m.id]); }
  const resolveClassic = (blocks: unknown) => mapNavBlocks(asBlocks(blocks), async (b) => {
    const d = { ...(b.data as Record<string, unknown>) } as { items?: NavItem[]; menuLocation?: string; menuId?: string };
    const items = pickNavItems(d, byLocation, byId);
    const filled = items?.length ? items : s.bits.defaultItems ?? [];
    delete d.menuLocation; delete d.menuId;
    return { ...b, data: { ...d, items: filled } } as Block;
  }, 0, async (b) => {
    const f = b as FooterBlockProps;
    return { ...f, data: { ...f.data, columns: (f.data.columns ?? []).map((c) => (c?.menuId && byId.has(c.menuId) ? { ...c, menuId: undefined, links: (byId.get(c.menuId) ?? []).map((i) => ({ id: i.id, label: i.label, url: i.url })) } : c)) } } as Block;
  });
  const [classicHeader, classicFooter] = await Promise.all([resolveClassic(s.globalHeader), resolveClassic(s.globalFooter)]);

  const area = (a: SwitchPreview["header"] | SwitchPreview["footer"], doc: { draft: unknown }, blocks: Block[]): SwitchAreaPayload => {
    const stored = a.state !== "classic" && !!doc.draft;
    return {
      state: a.state, ownDraft: a.ownDraft,
      level: a.switched?.level ?? a.fidelity.level,
      notes: a.switched?.notes ?? a.conversion.notes,
      diffs: a.fidelity.diffs,
      config: (stored ? doc.draft : a.conversion.config) as HeaderConfig | FooterConfig | null,
      stored,
      switched: a.switched,
      classic: blocks,
    };
  };
  return {
    tenantId, siteName: s.siteName, logoUrl: s.logoUrl, logoDarkUrl: s.logoDarkUrl, contact, menus, themeCss,
    header: area(p.header, s.headerDoc, classicHeader),
    footer: area(p.footer, s.footerDoc, classicFooter),
  };
}
