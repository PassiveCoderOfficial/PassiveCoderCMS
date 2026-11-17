"use client";

import React, { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import { IconPicker } from "@/components/ui/icon-picker";
import { SearchTypesField, SuggestLimitField } from "./search-settings";
import type { BottomBarBlockProps, BottomBarItem, BottomBarAction } from "@/types/cms";

type D = BottomBarBlockProps["data"];
const selectCls = "w-full h-8 text-xs mt-1 rounded-md border bg-background px-2";
const section = "text-[10px] font-bold uppercase tracking-widest text-muted-foreground";

// Shop actions need the Ecommerce module; they are hidden from the picker
// when it is off (an item already using one keeps it).
const ACTIONS: { value: BottomBarAction; label: string; shop?: boolean; hint?: string }[] = [
  { value: "home", label: "Home page" },
  { value: "shop", label: "Shop page", shop: true },
  { value: "categories", label: "Categories sheet", shop: true, hint: "Opens a sheet with your product categories." },
  { value: "search", label: "Product search", shop: true, hint: "Opens a search box with live results as you type. Set it up under Search below." },
  { value: "cart", label: "Cart (with count)", shop: true, hint: "Opens the cart drawer; badge shows the item count." },
  { value: "account", label: "Customer account", shop: true },
  { value: "whatsapp", label: "WhatsApp chat", hint: "Uses your Contact details number unless you set one." },
  { value: "call", label: "Phone call", hint: "Uses your Contact details number unless you set one." },
  { value: "email", label: "Email" },
  { value: "link", label: "Custom link" },
];

const URL_LABEL: Partial<Record<BottomBarAction, string>> = {
  link: "Link (e.g. /offers or https://…)", home: "Link override (default /)", shop: "Link override (default /shop)",
  account: "Link override (default /account/login)", whatsapp: "WhatsApp number override", call: "Phone number override", email: "Email override",
};

function ColorRow({ label, value, onChange }: { label: string; value?: string; onChange: (v: string | undefined) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        <ColorPicker value={value ?? "#ffffff"} onChange={(v) => onChange(v)} className="flex-1" />
        {value
          ? <button onClick={() => onChange(undefined)} className="text-xs text-muted-foreground hover:text-foreground shrink-0">Theme</button>
          : <span className="text-[10px] text-muted-foreground shrink-0">theme</span>}
      </div>
    </div>
  );
}

export function BottomBarSettings({ block }: { block: BottomBarBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const d = block.data;
  const set = <K extends keyof D>(k: K, v: D[K]) => updateBlock(block.id, { data: { ...d, [k]: v } } as Partial<BottomBarBlockProps>);
  const items = d.items ?? [];
  const setItems = (next: BottomBarItem[]) => set("items", next);
  const patch = (i: number, p: Partial<BottomBarItem>) => setItems(items.map((it, k) => (k === i ? { ...it, ...p } : it)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };

  const [shopOn, setShopOn] = useState(true);
  useEffect(() => {
    fetch("/api/dashboard/modules")
      .then((r) => r.json())
      .then((res: { modules?: { key: string; enabled: boolean }[] }) => setShopOn(!!res.modules?.some((m) => m.key === "ecommerce" && m.enabled)))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <p className={section}>Where it shows</p>
      <div>
        <Label className="text-xs">Show on</Label>
        <select className={selectCls} value={d.display ?? "mobile"} onChange={(e) => set("display", e.target.value as D["display"])}>
          <option value="mobile">Phones only (under 768px)</option>
          <option value="tablet">Phones and tablets (under 1024px)</option>
          <option value="all">Every screen (desktop options below)</option>
        </select>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Hide floating WhatsApp / call buttons where the bar shows</Label>
        {/* Hides call / WhatsApp / email buttons only; the site chat bubble always stays. */}
        <Switch checked={!!d.hideFloatingButtons} onCheckedChange={(v) => set("hideFloatingButtons", v)} />
      </div>
      <p className="text-[10px] text-muted-foreground -mt-2">Off: the floating buttons move up above the bar.</p>

      <hr className="border-border" />
      <p className={section}>Buttons ({items.length})</p>
      <div className="space-y-2">
        {items.map((it, i) => {
          const act = ACTIONS.find((a) => a.value === it.action);
          const options = ACTIONS.filter((a) => shopOn || !a.shop || a.value === it.action);
          return (
            <div key={it.id} className={`rounded-lg border p-2 space-y-2 ${it.hidden ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold flex-1 truncate">{i + 1}. {it.label || act?.label}</span>
                <button type="button" onClick={() => patch(i, { hidden: !it.hidden })} className="p-1 rounded hover:bg-muted" title={it.hidden ? "Show" : "Hide"}>
                  {it.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button type="button" onClick={() => move(i, -1)} className="p-1 rounded hover:bg-muted" title="Move left"><ChevronUp className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => move(i, 1)} className="p-1 rounded hover:bg-muted" title="Move right"><ChevronDown className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => setItems(items.filter((_, k) => k !== i))} className="p-1 rounded hover:bg-muted text-destructive" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <IconPicker value={it.icon} onChange={(v) => patch(i, { icon: v })} />
              <Input value={it.label} onChange={(e) => patch(i, { label: e.target.value })} className="h-8 text-xs" placeholder="Label" />
              <select className={selectCls} value={it.action} onChange={(e) => patch(i, { action: e.target.value as BottomBarAction })}>
                {options.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
              {act?.hint && <p className="text-[10px] text-muted-foreground">{act.hint}</p>}
              {URL_LABEL[it.action] && (
                <Input value={it.url ?? ""} onChange={(e) => patch(i, { url: e.target.value })} className="h-8 text-xs" placeholder={URL_LABEL[it.action]} />
              )}
              {it.action === "whatsapp" && (
                <Input value={it.text ?? ""} onChange={(e) => patch(i, { text: e.target.value })} className="h-8 text-xs" placeholder="Prefilled message (optional)" />
              )}
            </div>
          );
        })}
      </div>
      {items.length < 6 && (
        <button type="button" onClick={() => setItems([...items, { id: `bb${Date.now().toString(36)}`, icon: "Link", label: "Link", action: "link", url: "/" }])}
          className="w-full h-8 rounded-md border border-dashed text-xs flex items-center justify-center gap-1 hover:bg-muted">
          <Plus className="w-3.5 h-3.5" /> Add button
        </button>
      )}
      {!shopOn && <p className="text-[10px] text-muted-foreground">Turn on the Ecommerce module for cart, search, categories and account buttons.</p>}

      <hr className="border-border" />
      <p className={section}>Look</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Style</Label>
          <select className={selectCls} value={d.style ?? "flat"} onChange={(e) => set("style", e.target.value as D["style"])}>
            <option value="flat">Flat strip</option>
            <option value="floating">Floating pill</option>
          </select>
        </div>
        <div><Label className="text-xs">Height (px)</Label><Input type="number" min={48} max={96} value={d.height ?? 64} onChange={(e) => set("height", Number(e.target.value))} className="h-8 text-xs mt-1" /></div>
        <div><Label className="text-xs">Icon size (px)</Label><Input type="number" min={14} max={36} value={d.iconSize ?? 22} onChange={(e) => set("iconSize", Number(e.target.value))} className="h-8 text-xs mt-1" /></div>
        <div><Label className="text-xs">Label size (px)</Label><Input type="number" min={8} max={16} value={d.labelSize ?? 11} onChange={(e) => set("labelSize", Number(e.target.value))} className="h-8 text-xs mt-1" /></div>
      </div>
      <div className="flex items-center justify-between"><Label className="text-xs">Show labels</Label><Switch checked={d.showLabels !== false} onCheckedChange={(v) => set("showLabels", v)} /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Pill behind active button</Label><Switch checked={!!d.activePill} onCheckedChange={(v) => set("activePill", v)} /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Top border</Label><Switch checked={d.borderTop !== false} onCheckedChange={(v) => set("borderTop", v)} /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Shadow</Label><Switch checked={d.shadow !== false} onCheckedChange={(v) => set("shadow", v)} /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Frosted glass</Label><Switch checked={!!d.blur} onCheckedChange={(v) => set("blur", v)} /></div>

      <ColorRow label="Background" value={d.background} onChange={(v) => set("background", v)} />
      <ColorRow label="Icon & label colour" value={d.color} onChange={(v) => set("color", v)} />
      <ColorRow label="Active colour" value={d.activeColor} onChange={(v) => set("activeColor", v)} />
      <ColorRow label="Cart badge background" value={d.badgeBg} onChange={(v) => set("badgeBg", v)} />
      <ColorRow label="Cart badge text" value={d.badgeColor} onChange={(v) => set("badgeColor", v)} />

      {items.some((it) => it.action === "categories") && (
        <>
          <hr className="border-border" />
          <p className={section}>Categories sheet</p>
          <div><Label className="text-xs">Sheet title</Label><Input value={d.categoriesTitle ?? ""} onChange={(e) => set("categoriesTitle", e.target.value)} className="h-8 text-xs mt-1" placeholder="Shop by category" /></div>
          <div><Label className="text-xs">Last tile (opens the shop)</Label><Input value={d.allProductsLabel ?? ""} onChange={(e) => set("allProductsLabel", e.target.value || undefined)} className="h-8 text-xs mt-1" placeholder="All products" /></div>
        </>
      )}

      {items.some((it) => it.action === "search") && (
        <>
          <hr className="border-border" />
          <p className={section}>Search</p>
          <div><Label className="text-xs">Sheet title</Label><Input value={d.searchTitle ?? ""} onChange={(e) => set("searchTitle", e.target.value || undefined)} className="h-8 text-xs mt-1" placeholder="Search" /></div>
          <div><Label className="text-xs">Search placeholder</Label><Input value={d.searchPlaceholder ?? ""} onChange={(e) => set("searchPlaceholder", e.target.value)} className="h-8 text-xs mt-1" placeholder="Search products" /></div>
          <div className="flex items-center justify-between"><Label className="text-xs">Live results while typing</Label><Switch checked={d.searchLive !== false} onCheckedChange={(v) => set("searchLive", v)} /></div>
          {d.searchLive !== false && (
            <>
              <SearchTypesField value={d.searchTypes} onChange={(v) => set("searchTypes", v)} />
              <SuggestLimitField value={d.searchSuggestLimit} onChange={(v) => set("searchSuggestLimit", v)} />
            </>
          )}
        </>
      )}

      {d.display === "all" && (
        <>
          <hr className="border-border" />
          <p className={section}>Desktop (1024px and up)</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Style</Label>
              <select className={selectCls} value={d.desktopStyle ?? d.style ?? "flat"} onChange={(e) => set("desktopStyle", e.target.value as D["desktopStyle"])}>
                <option value="flat">Docked to the bottom</option>
                <option value="floating">Floating pill</option>
              </select>
            </div>
            <div><Label className="text-xs">Max width (px)</Label><Input type="number" min={320} max={1400} value={d.desktopMaxWidth ?? 560} onChange={(e) => set("desktopMaxWidth", Number(e.target.value))} className="h-8 text-xs mt-1" /></div>
          </div>
          <div className="flex items-center justify-between"><Label className="text-xs">Show labels on desktop</Label><Switch checked={d.desktopShowLabels ?? d.showLabels !== false} onCheckedChange={(v) => set("desktopShowLabels", v)} /></div>
        </>
      )}
    </div>
  );
}
