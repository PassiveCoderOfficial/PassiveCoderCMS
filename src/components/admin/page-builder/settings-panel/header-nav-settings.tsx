"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NavItemsEditor } from "./nav-items-editor";
import type { HeaderNavBlockProps, NavigationBlockProps } from "@/types/cms";

/** Shown above a menu editor when the block reads a managed menu instead of its own links. */
export function ManagedMenuNote({ location }: { location?: string }) {
  if (!location) return null;
  return (
    <p className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
      These links come from the &quot;{location.replace(/_/g, " ")}&quot; menu. Edit them in <Link href="/dashboard/navigation" className="underline font-medium">Dashboard &gt; Navigation</Link>; the list below is only used if that menu is missing.
    </p>
  );
}

type MenuLocation = NonNullable<NavigationBlockProps["data"]["menuLocation"]>;
const LOCATION_LABEL: Record<MenuLocation, string> = {
  header: "Header", footer: "Footer", footer_secondary: "Footer (second)", mobile: "Phone menu", sidebar: "Sidebar", legal: "Legal links",
};
type SavedMenu = { id: string; name?: string; location?: string; items?: unknown[] };
let menusPromise: Promise<SavedMenu[]> | null = null;
/** The site's saved menus (Dashboard > Navigation), fetched once per editor session. */
function fetchMenus(): Promise<SavedMenu[]> {
  menusPromise ??= fetch("/api/navigation").then((r) => (r.ok ? r.json() : { menus: [] })).then((j) => (Array.isArray(j?.menus) ? j.menus : [])).catch(() => []);
  return menusPromise;
}

/**
 * Which managed menu (Dashboard > Navigation) the block shows. The live site
 * swaps the block's own links for that menu's (page-renderer resolveNavBlocks);
 * "None" keeps the links typed below.
 */
export function MenuLocationPicker({ value, onChange }: { value?: MenuLocation; onChange: (v: MenuLocation | undefined) => void }) {
  const [menus, setMenus] = useState<SavedMenu[] | null>(null);
  useEffect(() => { let live = true; fetchMenus().then((m) => live && setMenus(m)); return () => { live = false; }; }, []);
  const assigned = (menus ?? []).filter((m) => m.location && m.location !== "none" && m.location in LOCATION_LABEL);
  const options = [...new Set([...assigned.map((m) => m.location as MenuLocation), ...(value ? [value] : [])])];
  return (
    <div>
      <Label className="text-xs">Menu shown</Label>
      <Select value={value ?? "__inline"} onValueChange={(v) => onChange(v === "__inline" ? undefined : (v as MenuLocation))}>
        <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__inline" className="text-xs">The links below (this block only)</SelectItem>
          {options.map((loc) => {
            const m = assigned.find((x) => x.location === loc);
            return <SelectItem key={loc} value={loc} className="text-xs">{LOCATION_LABEL[loc]} menu{m?.name ? `: ${m.name}` : ""}{!m && menus ? " (not set up)" : ""}</SelectItem>;
          })}
        </SelectContent>
      </Select>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        {menus && !assigned.length ? "No saved menus yet. " : ""}Menus are made in <Link href="/dashboard/navigation" target="_blank" className="underline">Dashboard &gt; Navigation</Link>. The live site shows the chosen menu; this preview shows the links below.
      </p>
    </div>
  );
}

export function HeaderNavSettings({ block }: { block: HeaderNavBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Links position</Label>
        {/* The links render either spread from the start (every value but
            "centered", incl. older "split" / "minimal") or centred. */}
        <Select value={block.data.style === "centered" ? "centered" : "default"} onValueChange={(v) => update("style", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default" className="text-xs">From the start</SelectItem>
            <SelectItem value="centered" className="text-xs">Centred</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Link colour (blank = theme)</Label>
        <ColorPicker value={block.data.textColor ?? ""} onChange={(v) => update("textColor", v || undefined)} className="mt-1" />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Upper-case menu</Label>
        <Switch checked={!!block.data.menuUppercase} onCheckedChange={(v) => update("menuUppercase", v || undefined)} />
      </div>
      <p className="text-[10px] text-muted-foreground -mt-1">Text size, weight and spacing are on the Style tab (Menu text).</p>
      <div className="border-t pt-3 space-y-2">
        <MenuLocationPicker value={block.data.menuLocation} onChange={(v) => update("menuLocation", v)} />
        <ManagedMenuNote location={block.data.menuLocation} />
        <NavItemsEditor items={block.data.items} onChange={(items) => update("items", items)} />
      </div>
    </div>
  );
}
