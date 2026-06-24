"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Save, Trash2, ChevronDown, ChevronRight, Globe, Layout, Navigation, Footprints } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { NavItem, FooterColumn, FooterColumnLink, FooterSocial } from "@/types/cms";

type NavItemEditable = NavItem & { _expanded?: boolean };

export default function LayoutManagerPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"header" | "footer">("header");

  // Header (Navigation) state
  const [navItems, setNavItems] = useState<NavItemEditable[]>([]);
  const [navLogoText, setNavLogoText] = useState("");
  const [navCtaLabel, setNavCtaLabel] = useState("Get Free Consultation");
  const [navCtaUrl, setNavCtaUrl] = useState("#contact");
  const [navBg, setNavBg] = useState("#1a5c38");
  const [navTextColor, setNavTextColor] = useState("#ffffff");
  const [navSticky, setNavSticky] = useState(true);

  // Footer state
  const [footerLogoText, setFooterLogoText] = useState("");
  const [footerTagline, setFooterTagline] = useState("");
  const [footerColumns, setFooterColumns] = useState<FooterColumn[]>([]);
  const [footerSocials, setFooterSocials] = useState<FooterSocial[]>([]);
  const [footerCopyright, setFooterCopyright] = useState("");
  const [footerBg, setFooterBg] = useState("#0f2418");
  const [footerAccent, setFooterAccent] = useState("#c9a84c");
  const [footerBottomLinks, setFooterBottomLinks] = useState<FooterColumnLink[]>([]);
  const [footerNewsletter, setFooterNewsletter] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: m } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).eq("is_primary", true).maybeSingle();
      const tid = m?.tenant_id;
      if (!tid) return;
      setTenantId(tid);

      const { data: identity } = await supabase
        .from("site_identity")
        .select("site_name, tagline, global_header, global_footer")
        .eq("tenant_id", tid)
        .single();

      if (identity) {
        const header = identity.global_header as Record<string, unknown> | null;
        const footer = identity.global_footer as Record<string, unknown> | null;

        if (header) {
          const nav = (header as { data?: Record<string, unknown> })?.data;
          if (nav) {
            setNavLogoText((nav.logoText as string) ?? identity.site_name ?? "");
            setNavCtaLabel((nav.ctaLabel as string) ?? "Get Free Consultation");
            setNavCtaUrl((nav.ctaUrl as string) ?? "#contact");
            setNavBg((nav.backgroundColor as string) ?? "#1a5c38");
            setNavTextColor((nav.textColor as string) ?? "#ffffff");
            setNavSticky((nav.sticky as boolean) ?? true);
            setNavItems(((nav.items as NavItemEditable[]) ?? []).map(i => ({ ...i, _expanded: false })));
          }
        } else {
          setNavLogoText(identity.site_name ?? "");
        }

        if (footer) {
          const fd = (footer as { data?: Record<string, unknown> })?.data;
          if (fd) {
            setFooterLogoText((fd.logoText as string) ?? identity.site_name ?? "");
            setFooterTagline((fd.tagline as string) ?? identity.tagline ?? "");
            setFooterColumns((fd.columns as FooterColumn[]) ?? []);
            setFooterSocials((fd.socials as FooterSocial[]) ?? []);
            setFooterCopyright((fd.copyrightText as string) ?? "");
            setFooterBg((fd.backgroundColor as string) ?? "#0f2418");
            setFooterAccent((fd.accentColor as string) ?? "#c9a84c");
            setFooterBottomLinks((fd.bottomLinks as FooterColumnLink[]) ?? []);
            setFooterNewsletter((fd.showNewsletter as boolean) ?? false);
          }
        } else {
          setFooterLogoText(identity.site_name ?? "");
          setFooterTagline(identity.tagline ?? "");
        }
      }
    });
  }, []);

  const save = useCallback(async () => {
    if (!tenantId) return;
    setSaving(true);

    const headerBlock = {
      id: generateId(),
      type: "navigation",
      order: 0,
      visible: true,
      width: "full",
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      background: { type: "color", color: navBg },
      templateVariant: "solid-with-cta",
      data: {
        logoText: navLogoText,
        items: navItems.map(({ _expanded: _, ...i }) => i),
        sticky: navSticky,
        transparent: false,
        style: "default",
        backgroundColor: navBg,
        textColor: navTextColor,
        showCta: true,
        ctaLabel: navCtaLabel,
        ctaUrl: navCtaUrl,
      },
    };

    const footerBlock = {
      id: generateId(),
      type: "footer",
      order: 0,
      visible: true,
      width: "full",
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      background: { type: "none" },
      data: {
        logoText: footerLogoText,
        tagline: footerTagline,
        columns: footerColumns,
        socials: footerSocials,
        copyrightText: footerCopyright,
        copyrightYear: true,
        backgroundColor: footerBg,
        accentColor: footerAccent,
        bottomLinks: footerBottomLinks,
        showNewsletter: footerNewsletter,
        style: "dark" as const,
      },
    };

    const supabase = createClient();
    await supabase.from("site_identity").upsert({
      tenant_id: tenantId,
      global_header: headerBlock,
      global_footer: footerBlock,
      updated_at: new Date().toISOString(),
    }, { onConflict: "tenant_id" });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [tenantId, navLogoText, navItems, navSticky, navBg, navTextColor, navCtaLabel, navCtaUrl, footerLogoText, footerTagline, footerColumns, footerSocials, footerCopyright, footerBg, footerAccent, footerBottomLinks, footerNewsletter]);

  const addNavItem = (parentId?: string) => {
    const newItem: NavItemEditable = { id: generateId(), label: "New Link", url: "/", children: [], _expanded: false };
    if (!parentId) {
      setNavItems(prev => [...prev, newItem]);
    } else {
      setNavItems(prev => prev.map(item =>
        item.id === parentId ? { ...item, children: [...(item.children ?? []), newItem] } : item
      ));
    }
  };

  const updateNavItem = (id: string, field: "label" | "url", value: string, parentId?: string) => {
    setNavItems(prev => prev.map(item => {
      if (!parentId && item.id === id) return { ...item, [field]: value };
      if (parentId && item.id === parentId) {
        return { ...item, children: (item.children ?? []).map(c => c.id === id ? { ...c, [field]: value } : c) };
      }
      return item;
    }));
  };

  const removeNavItem = (id: string, parentId?: string) => {
    if (!parentId) {
      setNavItems(prev => prev.filter(i => i.id !== id));
    } else {
      setNavItems(prev => prev.map(item =>
        item.id === parentId ? { ...item, children: (item.children ?? []).filter(c => c.id !== id) } : item
      ));
    }
  };

  const toggleExpand = (id: string) => {
    setNavItems(prev => prev.map(item => item.id === id ? { ...item, _expanded: !item._expanded } : item));
  };

  const addFooterColumn = () => {
    setFooterColumns(prev => [...prev, { id: generateId(), heading: "Column", links: [] }]);
  };

  const updateColumnHeading = (id: string, heading: string) => {
    setFooterColumns(prev => prev.map(c => c.id === id ? { ...c, heading } : c));
  };

  const addColumnLink = (colId: string) => {
    setFooterColumns(prev => prev.map(c =>
      c.id === colId ? { ...c, links: [...c.links, { id: generateId(), label: "Link", url: "/" }] } : c
    ));
  };

  const updateColumnLink = (colId: string, linkId: string, field: "label" | "url", value: string) => {
    setFooterColumns(prev => prev.map(c =>
      c.id === colId ? { ...c, links: c.links.map(l => l.id === linkId ? { ...l, [field]: value } : l) } : c
    ));
  };

  const removeColumnLink = (colId: string, linkId: string) => {
    setFooterColumns(prev => prev.map(c =>
      c.id === colId ? { ...c, links: c.links.filter(l => l.id !== linkId) } : c
    ));
  };

  const removeColumn = (colId: string) => {
    setFooterColumns(prev => prev.filter(c => c.id !== colId));
  };

  const addSocial = () => {
    setFooterSocials(prev => [...prev, { platform: "facebook", url: "https://facebook.com" }]);
  };

  const addBottomLink = () => {
    setFooterBottomLinks(prev => [...prev, { id: generateId(), label: "Link", url: "/" }]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layout className="h-6 w-6" /> Site Layout Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the global header navigation and footer that appear on every page automatically.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["header", "footer"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {tab === "header" ? <Navigation className="h-4 w-4" /> : <Footprints className="h-4 w-4" />}
            {tab === "header" ? "Header / Navigation" : "Footer"}
          </button>
        ))}
      </div>

      {/* HEADER TAB */}
      {activeTab === "header" && (
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Branding</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Logo Text</label>
                <input value={navLogoText} onChange={e => setNavLogoText(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">CTA Button Label</label>
                <input value={navCtaLabel} onChange={e => setNavCtaLabel(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">CTA Button URL</label>
                <input value={navCtaUrl} onChange={e => setNavCtaUrl(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={navSticky} onChange={e => setNavSticky(e.target.checked)} className="rounded" />
                  Sticky on scroll
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Background Color</label>
                <div className="flex gap-2">
                  <input type="color" value={navBg} onChange={e => setNavBg(e.target.value)} className="h-9 w-14 rounded cursor-pointer border" />
                  <input value={navBg} onChange={e => setNavBg(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Text Color</label>
                <div className="flex gap-2">
                  <input type="color" value={navTextColor} onChange={e => setNavTextColor(e.target.value)} className="h-9 w-14 rounded cursor-pointer border" />
                  <input value={navTextColor} onChange={e => setNavTextColor(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Navigation Items</h2>
              <button onClick={() => addNavItem()} className="flex items-center gap-1 text-sm text-primary hover:underline">
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {navItems.map((item) => (
                <div key={item.id} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 p-2.5 bg-muted/30">
                    <button onClick={() => toggleExpand(item.id)} className="text-muted-foreground hover:text-foreground">
                      {(item.children?.length ?? 0) > 0 || item._expanded
                        ? (item._expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)
                        : <span className="w-4 h-4 block" />}
                    </button>
                    <input
                      value={item.label}
                      onChange={e => updateNavItem(item.id, "label", e.target.value)}
                      placeholder="Label"
                      className="flex-1 text-sm border rounded px-2 py-1 bg-background"
                    />
                    <input
                      value={item.url}
                      onChange={e => updateNavItem(item.id, "url", e.target.value)}
                      placeholder="/path or #anchor"
                      className="flex-1 text-sm border rounded px-2 py-1 bg-background"
                    />
                    <button
                      onClick={() => toggleExpand(item.id)}
                      title="Add sub-menu item"
                      className="text-xs text-primary border border-primary/30 rounded px-2 py-1 hover:bg-primary/5"
                    >
                      + Sub
                    </button>
                    <button onClick={() => removeNavItem(item.id)} className="text-destructive hover:opacity-70">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Sub-menu items */}
                  {item._expanded && (
                    <div className="pl-8 pr-2 pb-2 pt-1 space-y-1.5 bg-muted/10 border-t">
                      {(item.children ?? []).map(child => (
                        <div key={child.id} className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">↳</span>
                          <input
                            value={child.label}
                            onChange={e => updateNavItem(child.id, "label", e.target.value, item.id)}
                            placeholder="Sub-item label"
                            className="flex-1 text-sm border rounded px-2 py-1 bg-background"
                          />
                          <input
                            value={child.url}
                            onChange={e => updateNavItem(child.id, "url", e.target.value, item.id)}
                            placeholder="/path"
                            className="flex-1 text-sm border rounded px-2 py-1 bg-background"
                          />
                          <button onClick={() => removeNavItem(child.id, item.id)} className="text-destructive hover:opacity-70">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addNavItem(item.id)} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Add sub-item
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {navItems.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No navigation items yet. Click &quot;Add Item&quot; to start.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER TAB */}
      {activeTab === "footer" && (
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Footer Branding</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Logo Text</label>
                <input value={footerLogoText} onChange={e => setFooterLogoText(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Tagline</label>
                <input value={footerTagline} onChange={e => setFooterTagline(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium block mb-1">Copyright Text <span className="text-muted-foreground font-normal">(use {"{year}"} for current year)</span></label>
                <input value={footerCopyright} onChange={e => setFooterCopyright(e.target.value)} placeholder="© {year} Life Settle Travel And Tourism. All rights reserved." className="w-full border rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Background Color</label>
                <div className="flex gap-2">
                  <input type="color" value={footerBg} onChange={e => setFooterBg(e.target.value)} className="h-9 w-14 rounded cursor-pointer border" />
                  <input value={footerBg} onChange={e => setFooterBg(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Accent / Heading Color</label>
                <div className="flex gap-2">
                  <input type="color" value={footerAccent} onChange={e => setFooterAccent(e.target.value)} className="h-9 w-14 rounded cursor-pointer border" />
                  <input value={footerAccent} onChange={e => setFooterAccent(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={footerNewsletter} onChange={e => setFooterNewsletter(e.target.checked)} className="rounded" />
              Show newsletter signup in footer
            </label>
          </div>

          {/* Footer columns */}
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Link Columns</h2>
              <button onClick={addFooterColumn} className="flex items-center gap-1 text-sm text-primary hover:underline">
                <Plus className="h-3.5 w-3.5" /> Add Column
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {footerColumns.map(col => (
                <div key={col.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input value={col.heading} onChange={e => updateColumnHeading(col.id, e.target.value)} className="flex-1 font-semibold text-sm border rounded px-2 py-1 bg-background" placeholder="Column Heading" />
                    <button onClick={() => removeColumn(col.id)} className="text-destructive hover:opacity-70"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  {col.links.map(link => (
                    <div key={link.id} className="flex items-center gap-2">
                      <input value={link.label} onChange={e => updateColumnLink(col.id, link.id, "label", e.target.value)} className="flex-1 text-xs border rounded px-2 py-1 bg-background" placeholder="Label" />
                      <input value={link.url} onChange={e => updateColumnLink(col.id, link.id, "url", e.target.value)} className="flex-1 text-xs border rounded px-2 py-1 bg-background" placeholder="/url" />
                      <button onClick={() => removeColumnLink(col.id, link.id)} className="text-destructive hover:opacity-70"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                  <button onClick={() => addColumnLink(col.id)} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add link
                  </button>
                </div>
              ))}
              {footerColumns.length === 0 && (
                <p className="col-span-2 text-sm text-muted-foreground py-4 text-center">No columns yet. Click &quot;Add Column&quot; to start.</p>
              )}
            </div>
          </div>

          {/* Social links */}
          <div className="bg-card border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Social Links</h2>
              <button onClick={addSocial} className="flex items-center gap-1 text-sm text-primary hover:underline">
                <Plus className="h-3.5 w-3.5" /> Add Social
              </button>
            </div>
            {footerSocials.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={s.platform}
                  onChange={e => setFooterSocials(prev => prev.map((p, j) => j === i ? { ...p, platform: e.target.value as FooterSocial["platform"] } : p))}
                  className="border rounded-lg px-2 py-1.5 text-sm bg-background"
                >
                  {["facebook","instagram","twitter","linkedin","youtube","tiktok","whatsapp"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input
                  value={s.url}
                  onChange={e => setFooterSocials(prev => prev.map((p, j) => j === i ? { ...p, url: e.target.value } : p))}
                  placeholder="https://..."
                  className="flex-1 border rounded-lg px-3 py-1.5 text-sm bg-background"
                />
                <button onClick={() => setFooterSocials(prev => prev.filter((_, j) => j !== i))} className="text-destructive hover:opacity-70">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Bottom links */}
          <div className="bg-card border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Bottom Bar Links</h2>
              <button onClick={addBottomLink} className="flex items-center gap-1 text-sm text-primary hover:underline">
                <Plus className="h-3.5 w-3.5" /> Add Link
              </button>
            </div>
            {footerBottomLinks.map(link => (
              <div key={link.id} className="flex items-center gap-2">
                <input value={link.label} onChange={e => setFooterBottomLinks(prev => prev.map(l => l.id === link.id ? { ...l, label: e.target.value } : l))} className="flex-1 border rounded-lg px-3 py-1.5 text-sm bg-background" placeholder="Privacy Policy" />
                <input value={link.url} onChange={e => setFooterBottomLinks(prev => prev.map(l => l.id === link.id ? { ...l, url: e.target.value } : l))} className="flex-1 border rounded-lg px-3 py-1.5 text-sm bg-background" placeholder="/privacy" />
                <button onClick={() => setFooterBottomLinks(prev => prev.filter(l => l.id !== link.id))} className="text-destructive hover:opacity-70">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
