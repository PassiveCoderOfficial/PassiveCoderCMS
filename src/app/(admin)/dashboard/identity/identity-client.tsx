"use client";

import { useState, useCallback } from "react";
import { Layers, Save, Loader2, CheckCircle, Plus, Trash2, Pencil, Check, X, Navigation, Footprints, ChevronDown, ChevronRight } from "lucide-react";
import { MediaPickerInput } from "@/components/admin/media-picker-input";

interface SiteIdentity {
  id?: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  logo_width: number | null;
  logo_alt: string | null;
  favicon_url: string | null;
  site_name: string | null;
  tagline: string | null;
}

interface NavItem {
  id?: string;
  label: string;
  url: string;
  target?: string;
  children?: NavItem[];
}

interface NavMenu {
  id: string;
  name: string;
  slug: string;
  items: NavItem[];
}

interface FooterColumnLink { id: string; label: string; url: string; }
interface FooterColumn { id: string; heading: string; links: FooterColumnLink[]; }
interface FooterSocial { platform: string; url: string; }

function uid() { return Math.random().toString(36).slice(2, 8); }
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

function api(method: string, body?: unknown, params?: Record<string, string>) {
  const url = params ? `/api/identity?${new URLSearchParams(params)}` : "/api/identity";
  return fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
}

// ─── NAV ITEM EDITOR ───────────────────────────────────────────────────────

function NavItemEditor({ item, onChange, onDelete, depth = 0 }: {
  item: NavItem; onChange: (item: NavItem) => void; onDelete: () => void; depth?: number;
}) {
  const [open, setOpen] = useState(false);
  const addChild = () => onChange({ ...item, children: [...(item.children ?? []), { id: uid(), label: "New Link", url: "/" }] });
  const updateChild = (i: number, updated: NavItem) => { const c = [...(item.children ?? [])]; c[i] = updated; onChange({ ...item, children: c }); };
  const deleteChild = (i: number) => onChange({ ...item, children: item.children?.filter((_, j) => j !== i) });

  return (
    <div className={depth > 0 ? "ml-4 border-l border-gray-700 pl-3" : ""}>
      <div className="flex items-center gap-2 py-1">
        {depth === 0 && (
          <button onClick={() => setOpen(o => !o)} className="text-gray-500 hover:text-white w-5 flex-shrink-0">
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        )}
        <input value={item.label} onChange={e => onChange({ ...item, label: e.target.value })}
          className="w-32 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none" placeholder="Label" />
        <input value={item.url} onChange={e => onChange({ ...item, url: e.target.value })}
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none" placeholder="/page" />
        <select value={item.target ?? "_self"} onChange={e => onChange({ ...item, target: e.target.value })}
          className="bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-white focus:outline-none">
          <option value="_self">Same tab</option>
          <option value="_blank">New tab</option>
        </select>
        {depth === 0 && (
          <button onClick={() => { setOpen(true); addChild(); }}
            title="Add sub-menu item"
            className="text-gray-500 hover:text-indigo-400 text-xs border border-gray-700 rounded px-1.5 py-1 hover:border-indigo-500">
            + Sub
          </button>
        )}
        <button onClick={onDelete} className="text-gray-600 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
      </div>
      {open && depth === 0 && (
        <div className="mt-1 mb-2 space-y-1">
          {(item.children ?? []).map((child, i) => (
            <NavItemEditor key={child.id ?? i} item={child} depth={1}
              onChange={u => updateChild(i, u)} onDelete={() => deleteChild(i)} />
          ))}
          <button onClick={addChild} className="ml-4 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1">
            <Plus className="w-3 h-3" /> Add sub-link
          </button>
        </div>
      )}
    </div>
  );
}

// ─── LEGACY NAV MENUS (nav_menus table) ────────────────────────────────────

function MenuCard({ menu, onUpdate, onDelete }: {
  menu: NavMenu; onUpdate: (m: NavMenu) => void; onDelete: (id: string) => void;
}) {
  const [items, setItems] = useState<NavItem[]>(menu.items);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(menu.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveMenu() {
    setSaving(true);
    await api("PATCH", { _type: "menu", id: menu.id, items, name, slug: slugify(name) });
    setSaving(false); setSaved(true);
    onUpdate({ ...menu, name, slug: slugify(name), items });
    setTimeout(() => setSaved(false), 2000);
  }

  const addItem = () => setItems(prev => [...prev, { id: uid(), label: "New Link", url: "/" }]);
  const updateItem = (i: number, u: NavItem) => setItems(prev => { const a = [...prev]; a[i] = u; return a; });
  const deleteItem = (i: number) => setItems(prev => prev.filter((_, j) => j !== i));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        {editingName ? (
          <div className="flex items-center gap-2">
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              className="bg-gray-800 border border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none" />
            <button onClick={() => setEditingName(false)}><Check className="w-4 h-4 text-indigo-400" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{name}</span>
            <span className="text-xs text-gray-500">/{slugify(name)}</span>
            <button onClick={() => setEditingName(true)}><Pencil className="w-3 h-3 text-gray-500" /></button>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={saveMenu} disabled={saving}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <CheckCircle className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            {saved ? "Saved" : "Save"}
          </button>
          <button onClick={() => { if (confirm(`Delete menu "${menu.name}"?`)) { api("DELETE", undefined, { id: menu.id }); onDelete(menu.id); } }}
            className="text-gray-400 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <NavItemEditor key={item.id ?? i} item={item} onChange={u => updateItem(i, u)} onDelete={() => deleteItem(i)} />
        ))}
      </div>
      <button onClick={addItem}
        className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 border border-dashed border-gray-700 hover:border-indigo-500 rounded-lg px-3 py-2 w-full transition-colors">
        <Plus className="w-3.5 h-3.5" /> Add Link
      </button>
    </div>
  );
}

// ─── GLOBAL NAV EDITOR ─────────────────────────────────────────────────────

function GlobalNavEditor({ initialBlock }: { initialBlock: Record<string, unknown> | null }) {
  const navData = (initialBlock?.data ?? {}) as Record<string, unknown>;
  const [logoText, setLogoText] = useState((navData.logoText as string) ?? "");
  const [logoUrl, setLogoUrl] = useState((navData.logo as string) ?? "");
  const [ctaLabel, setCtaLabel] = useState((navData.ctaLabel as string) ?? "Free Consultation");
  const [ctaUrl, setCtaUrl] = useState((navData.ctaUrl as string) ?? "#contact");
  const [bg, setBg] = useState((navData.backgroundColor as string) ?? "#1a5c38");
  const [fg, setFg] = useState((navData.textColor as string) ?? "#ffffff");
  const [sticky, setSticky] = useState((navData.sticky as boolean) ?? true);
  const [items, setItems] = useState<NavItem[]>((navData.items as NavItem[]) ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = useCallback(async () => {
    setSaving(true);
    const block = {
      id: (initialBlock?.id as string) ?? uid(),
      type: "navigation",
      order: 0, visible: true, width: "full",
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      background: { type: "color", color: bg },
      templateVariant: "solid-with-cta",
      data: { logoText, logo: logoUrl || undefined, items, sticky, transparent: false, style: "default", backgroundColor: bg, textColor: fg, showCta: !!(ctaLabel && ctaUrl), ctaLabel, ctaUrl },
    };
    await api("POST", { _type: "global_layout", global_header: block });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [initialBlock, logoText, logoUrl, items, sticky, bg, fg, ctaLabel, ctaUrl]);

  const addItem = () => setItems(prev => [...prev, { id: uid(), label: "New Link", url: "/", children: [] }]);
  const updateItem = (i: number, u: NavItem) => setItems(prev => { const a = [...prev]; a[i] = u; return a; });
  const deleteItem = (i: number) => setItems(prev => prev.filter((_, j) => j !== i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white flex items-center gap-2"><Navigation className="w-4 h-4 text-indigo-400" /> Global Navigation</h2>
          <p className="text-xs text-gray-500 mt-0.5">Appears on every page automatically. Editing here updates the whole site.</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Nav"}
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
        {/* Logo */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Nav Logo Image (overrides text)</label>
          <MediaPickerInput value={logoUrl} onChange={v => setLogoUrl(v ?? "")} placeholder="https://... or pick from media" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Logo Text (shown if no image)</label>
            <input value={logoText} onChange={e => setLogoText(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={sticky} onChange={e => setSticky(e.target.checked)} className="rounded" />
              Sticky on scroll
            </label>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">CTA Button Label</label>
            <input value={ctaLabel} onChange={e => setCtaLabel(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">CTA Button URL</label>
            <input value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Background</label>
            <div className="flex gap-2">
              <input type="color" value={bg} onChange={e => setBg(e.target.value)} className="h-8 w-12 rounded cursor-pointer border border-gray-700 bg-gray-800" />
              <input value={bg} onChange={e => setBg(e.target.value)} className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Text Color</label>
            <div className="flex gap-2">
              <input type="color" value={fg} onChange={e => setFg(e.target.value)} className="h-8 w-12 rounded cursor-pointer border border-gray-700 bg-gray-800" />
              <input value={fg} onChange={e => setFg(e.target.value)} className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Menu Items <span className="text-gray-600">— click ▶ to add sub-menu items</span></label>
          <div className="space-y-1">
            {items.map((item, i) => (
              <NavItemEditor key={item.id ?? i} item={item} onChange={u => updateItem(i, u)} onDelete={() => deleteItem(i)} />
            ))}
          </div>
          <button onClick={addItem}
            className="mt-2 flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 border border-dashed border-gray-700 hover:border-indigo-500 rounded-lg px-3 py-2 w-full transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Nav Item
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── GLOBAL FOOTER EDITOR ──────────────────────────────────────────────────

function GlobalFooterEditor({ initialBlock }: { initialBlock: Record<string, unknown> | null }) {
  const fd = (initialBlock?.data ?? {}) as Record<string, unknown>;
  const [logoText, setLogoText] = useState((fd.logoText as string) ?? "");
  const [tagline, setTagline] = useState((fd.tagline as string) ?? "");
  const [copyright, setCopyright] = useState((fd.copyrightText as string) ?? "");
  const [bg, setBg] = useState((fd.backgroundColor as string) ?? "#0f2418");
  const [accent, setAccent] = useState((fd.accentColor as string) ?? "#c9a84c");
  const [newsletter, setNewsletter] = useState((fd.showNewsletter as boolean) ?? false);
  const [columns, setColumns] = useState<FooterColumn[]>((fd.columns as FooterColumn[]) ?? []);
  const [socials, setSocials] = useState<FooterSocial[]>((fd.socials as FooterSocial[]) ?? []);
  const [bottomLinks, setBottomLinks] = useState<FooterColumnLink[]>((fd.bottomLinks as FooterColumnLink[]) ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = useCallback(async () => {
    setSaving(true);
    const block = {
      id: (initialBlock?.id as string) ?? uid(),
      type: "footer",
      order: 0, visible: true, width: "full",
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      background: { type: "none" },
      data: { logoText, tagline, copyrightText: copyright, copyrightYear: true, backgroundColor: bg, accentColor: accent, textColor: "#e5e7eb", style: "dark", columns, socials, bottomLinks, showNewsletter: newsletter },
    };
    await api("POST", { _type: "global_layout", global_footer: block });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [initialBlock, logoText, tagline, copyright, bg, accent, columns, socials, bottomLinks, newsletter]);

  const addColumn = () => setColumns(prev => [...prev, { id: uid(), heading: "Column", links: [] }]);
  const updateColHeading = (id: string, heading: string) => setColumns(prev => prev.map(c => c.id === id ? { ...c, heading } : c));
  const removeCol = (id: string) => setColumns(prev => prev.filter(c => c.id !== id));
  const addLink = (colId: string) => setColumns(prev => prev.map(c => c.id === colId ? { ...c, links: [...c.links, { id: uid(), label: "Link", url: "/" }] } : c));
  const updateLink = (colId: string, lid: string, field: "label" | "url", val: string) =>
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, links: c.links.map(l => l.id === lid ? { ...l, [field]: val } : l) } : c));
  const removeLink = (colId: string, lid: string) => setColumns(prev => prev.map(c => c.id === colId ? { ...c, links: c.links.filter(l => l.id !== lid) } : c));

  const PLATFORMS = ["facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok", "whatsapp"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white flex items-center gap-2"><Footprints className="w-4 h-4 text-indigo-400" /> Global Footer</h2>
          <p className="text-xs text-gray-500 mt-0.5">Appears on every page automatically. Editing here updates the whole site.</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Footer"}
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Logo Text</label>
            <input value={logoText} onChange={e => setLogoText(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tagline</label>
            <input value={tagline} onChange={e => setTagline(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Copyright Text <span className="text-gray-600">(use {"{year}"} for auto year)</span></label>
            <input value={copyright} onChange={e => setCopyright(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="© {year} Your Company. All rights reserved." />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Background</label>
            <div className="flex gap-2">
              <input type="color" value={bg} onChange={e => setBg(e.target.value)} className="h-8 w-12 rounded cursor-pointer border border-gray-700 bg-gray-800" />
              <input value={bg} onChange={e => setBg(e.target.value)} className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Accent / Heading Color</label>
            <div className="flex gap-2">
              <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="h-8 w-12 rounded cursor-pointer border border-gray-700 bg-gray-800" />
              <input value={accent} onChange={e => setAccent(e.target.value)} className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} className="rounded" />
              Show newsletter signup
            </label>
          </div>
        </div>

        {/* Footer columns */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-400">Link Columns</label>
            <button onClick={addColumn} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Column</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {columns.map(col => (
              <div key={col.id} className="border border-gray-700 rounded-lg p-3 space-y-2 bg-gray-800/40">
                <div className="flex items-center gap-2">
                  <input value={col.heading} onChange={e => updateColHeading(col.id, e.target.value)} className="flex-1 font-semibold text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white focus:border-indigo-500 focus:outline-none" placeholder="Heading" />
                  <button onClick={() => removeCol(col.id)} className="text-gray-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                {col.links.map(link => (
                  <div key={link.id} className="flex items-center gap-1.5">
                    <input value={link.label} onChange={e => updateLink(col.id, link.id, "label", e.target.value)} className="flex-1 text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white focus:border-indigo-500 focus:outline-none" placeholder="Label" />
                    <input value={link.url} onChange={e => updateLink(col.id, link.id, "url", e.target.value)} className="flex-1 text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white focus:border-indigo-500 focus:outline-none" placeholder="/url" />
                    <button onClick={() => removeLink(col.id, link.id)} className="text-gray-600 hover:text-red-400"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                <button onClick={() => addLink(col.id)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add link</button>
              </div>
            ))}
          </div>
        </div>

        {/* Socials */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-400">Social Links</label>
            <button onClick={() => setSocials(prev => [...prev, { platform: "facebook", url: "" }])} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Social</button>
          </div>
          {socials.map((s, i) => (
            <div key={i} className="flex items-center gap-2 mb-1.5">
              <select value={s.platform} onChange={e => setSocials(prev => prev.map((p, j) => j === i ? { ...p, platform: e.target.value } : p))}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none">
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input value={s.url} onChange={e => setSocials(prev => prev.map((p, j) => j === i ? { ...p, url: e.target.value } : p))}
                placeholder="https://..." className="flex-1 text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white focus:border-indigo-500 focus:outline-none" />
              <button onClick={() => setSocials(prev => prev.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>

        {/* Bottom links */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-400">Bottom Bar Links <span className="text-gray-600">(Privacy, Terms etc.)</span></label>
            <button onClick={() => setBottomLinks(prev => [...prev, { id: uid(), label: "", url: "/" }])} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
          </div>
          {bottomLinks.map((bl) => (
            <div key={bl.id} className="flex items-center gap-2 mb-1.5">
              <input value={bl.label} onChange={e => setBottomLinks(prev => prev.map(l => l.id === bl.id ? { ...l, label: e.target.value } : l))}
                placeholder="Privacy Policy" className="flex-1 text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white focus:border-indigo-500 focus:outline-none" />
              <input value={bl.url} onChange={e => setBottomLinks(prev => prev.map(l => l.id === bl.id ? { ...l, url: e.target.value } : l))}
                placeholder="/privacy" className="flex-1 text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white focus:border-indigo-500 focus:outline-none" />
              <button onClick={() => setBottomLinks(prev => prev.filter(l => l.id !== bl.id))} className="text-gray-600 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN CLIENT ───────────────────────────────────────────────────────────

export default function IdentityClient({ initialIdentity, initialMenus, initialGlobalHeader, initialGlobalFooter }: {
  initialIdentity: SiteIdentity | null;
  initialMenus: NavMenu[];
  initialGlobalHeader: Record<string, unknown> | null;
  initialGlobalFooter: Record<string, unknown> | null;
}) {
  const [identity, setIdentity] = useState<SiteIdentity>(initialIdentity ?? {
    logo_url: null, logo_dark_url: null, logo_width: 160, logo_alt: null,
    favicon_url: null, site_name: null, tagline: null,
  });
  const [menus, setMenus] = useState(initialMenus);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [creatingMenu, setCreatingMenu] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [activeTab, setActiveTab] = useState<"identity" | "nav" | "footer" | "menus">("nav");

  const set = (k: keyof SiteIdentity, v: unknown) => { setIdentity(p => ({ ...p, [k]: v })); setSaved(false); };

  async function saveIdentity() {
    setSaving(true);
    await api("POST", { _type: "identity", ...identity });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function createMenu() {
    if (!newMenuName.trim()) return;
    const res = await api("POST", { _type: "menu", name: newMenuName.trim(), slug: slugify(newMenuName.trim()), items: [] });
    const data = await res.json();
    setMenus(prev => [...prev, data]);
    setNewMenuName(""); setCreatingMenu(false);
  }

  const TABS = [
    { key: "nav" as const, label: "Global Nav", icon: <Navigation className="w-4 h-4" /> },
    { key: "footer" as const, label: "Global Footer", icon: <Footprints className="w-4 h-4" /> },
    { key: "identity" as const, label: "Site Identity", icon: <Layers className="w-4 h-4" /> },
    { key: "menus" as const, label: "Nav Menus (Legacy)", icon: <Plus className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Layers className="w-6 h-6 text-indigo-400" /> Identity & Navigation
        </h1>
        <p className="text-sm text-gray-400 mt-1">Manage global navigation, footer, site branding and menus.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-indigo-500 text-indigo-400" : "border-transparent text-gray-400 hover:text-white"}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Global Nav */}
      {activeTab === "nav" && <GlobalNavEditor initialBlock={initialGlobalHeader} />}

      {/* Global Footer */}
      {activeTab === "footer" && <GlobalFooterEditor initialBlock={initialGlobalFooter} />}

      {/* Site Identity */}
      {activeTab === "identity" && (
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Site Identity</h2>
            <button onClick={saveIdentity} disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved!" : "Save"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Site Name</label>
              <input value={identity.site_name ?? ""} onChange={e => set("site_name", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tagline</label>
              <input value={identity.tagline ?? ""} onChange={e => set("tagline", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-2">Logo (light mode)</label>
              <MediaPickerInput value={identity.logo_url ?? ""} onChange={url => set("logo_url", url || null)} placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-2">Logo (dark mode) <span className="text-gray-600">— optional</span></label>
              <MediaPickerInput value={identity.logo_dark_url ?? ""} onChange={url => set("logo_dark_url", url || null)} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Logo Alt Text</label>
              <input value={identity.logo_alt ?? ""} onChange={e => set("logo_alt", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Logo Width (px)</label>
              <input type="number" value={identity.logo_width ?? 160} onChange={e => set("logo_width", Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-2">Favicon</label>
              <MediaPickerInput value={identity.favicon_url ?? ""} onChange={url => set("favicon_url", url || null)} placeholder="https://..." />
            </div>
          </div>
        </section>
      )}

      {/* Legacy nav menus */}
      {activeTab === "menus" && (
        <section className="space-y-4">
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-4 py-3 text-xs text-yellow-400">
            Legacy nav_menus table. Use &quot;Global Nav&quot; tab to manage the site-wide navigation instead.
          </div>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Navigation Menus</h2>
            <button onClick={() => setCreatingMenu(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg">
              <Plus className="w-4 h-4" /> New Menu
            </button>
          </div>
          {creatingMenu && (
            <div className="flex items-center gap-3 bg-gray-900 border border-indigo-500/40 rounded-xl p-4">
              <input autoFocus value={newMenuName} onChange={e => setNewMenuName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") createMenu(); if (e.key === "Escape") setCreatingMenu(false); }}
                placeholder='Menu name (e.g. "Main Nav", "Footer")'
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
              <button onClick={createMenu} disabled={!newMenuName.trim()}
                className="flex items-center gap-1.5 bg-indigo-600 disabled:opacity-50 text-white text-sm px-3 py-2 rounded">
                <Check className="w-4 h-4" /> Create
              </button>
              <button onClick={() => setCreatingMenu(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
          )}
          {menus.length === 0 && !creatingMenu ? (
            <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl">
              <p className="text-gray-400 text-sm">No menus yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {menus.map(m => (
                <MenuCard key={m.id} menu={m}
                  onUpdate={u => setMenus(prev => prev.map(x => x.id === u.id ? u : x))}
                  onDelete={id => setMenus(prev => prev.filter(x => x.id !== id))} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
