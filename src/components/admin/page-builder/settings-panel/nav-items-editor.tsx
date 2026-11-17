"use client";

/**
 * Shared "edit these nav items" list — extracted from NavigationSettings
 * (2026-09-06) so HeaderNavSettings doesn't duplicate this list UI.
 *
 * Dropdown links (children) and mega-menu columns (grandchildren) are
 * editable here too (2026-11-09): most saved headers keep their menu inline
 * on the block, where the dropdown labels had no field at all. A block that
 * reads a managed menu (menuLocation) shows that menu instead; the caller
 * says so above this list.
 */
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { moveInList } from "@/modules/navigation/menu-model";
import { useT } from "@/lib/i18n/language-provider";
import { generateId } from "@/lib/utils";
import type { NavItem } from "@/types/cms";

type Field = "label" | "url" | "highlight" | "lang" | "megaLinksTitle";

export function NavItemsEditor({ items, onChange, depth = 0 }: { items: NavItem[]; onChange: (items: NavItem[]) => void; depth?: number }) {
  const t = useT();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const updateItem = (id: string, field: Field, value: string | undefined) => {
    onChange(items.map((it) => it.id === id ? { ...it, [field]: value } : it));
  };
  const setChildren = (id: string, children: NavItem[]) => {
    onChange(items.map((it) => it.id === id ? { ...it, children: children.length ? children : undefined } : it));
  };
  const addItem = () => onChange([...items, { id: generateId(), label: "New Link", url: "#" }]);
  const removeItem = (item: NavItem) => {
    // Removing an item takes its dropdown with it: ask first.
    const under = countAll(item.children);
    if (under > 0 && !window.confirm(t("navPage.removeWithChildren", { label: item.label || "", count: under, plural: under === 1 ? "" : "s" }))) return;
    onChange(items.filter((it) => it.id !== item.id));
  };
  // Reorder (P0): swaps neighbours only, so the saved data keeps its shape.
  const move = (index: number, dir: -1 | 1) => onChange(moveInList(items, index, dir));
  const title = depth === 0 ? "Nav Items" : depth === 1 ? "Dropdown links" : "Links under this heading";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className={depth === 0 ? "text-xs font-semibold" : "text-[11px] font-medium"}>{title} ({items.length})</Label>
        <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add</Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => {
          const kids = item.children ?? [];
          const isOpen = !!open[item.id];
          const hasGroups = kids.some((c) => (c.children?.length ?? 0) > 0);
          return (
            <div key={item.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={i === 0} onClick={() => move(i, -1)} title={t("navPage.moveUp")} aria-label={t("navPage.moveUp")}><ArrowUp className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={i === items.length - 1} onClick={() => move(i, 1)} title={t("navPage.moveDown")} aria-label={t("navPage.moveDown")}><ArrowDown className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeItem(item)} title={t("navPage.removeItem")} aria-label={t("navPage.removeItem")}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              </div>
              <Input value={item.label} onChange={(e) => updateItem(item.id, "label", e.target.value)} className="h-7 text-xs" placeholder="Label" />
              <Input value={item.url} onChange={(e) => updateItem(item.id, "url", e.target.value)} className="h-7 text-xs" placeholder={kids.length ? "URL (# = opens the dropdown only)" : "URL"} />
              {depth === 0 && (
                <>
                  <Input value={item.lang ?? ""} onChange={(e) => updateItem(item.id, "lang", e.target.value.trim() || undefined)} className="h-7 text-xs" placeholder="Language switch: code (e.g. bn), opens this page in that language" title="When set, the link opens the current page in this language; the URL above is the fallback." />
                  <select value={item.highlight ?? ""} onChange={(e) => updateItem(item.id, "highlight", e.target.value || undefined)} className="w-full h-7 text-xs rounded-md border bg-background px-2">
                    <option value="">Normal link</option>
                    <option value="gold">Highlight: gold pill</option>
                    <option value="brand">Highlight: brand-colour pill</option>
                    <option value="dark">Highlight: dark pill, gold outline</option>
                  </select>
                  {hasGroups && item.megaLinksAs === "column" && (
                    <Input value={item.megaLinksTitle ?? ""} onChange={(e) => updateItem(item.id, "megaLinksTitle", e.target.value || undefined)} className="h-7 text-xs" placeholder="Heading over the single links column (optional)" />
                  )}
                </>
              )}
              {depth < 2 && (item.childSource && item.childSource !== "manual" ? (
                <p className="text-[10px] text-muted-foreground">Dropdown filled automatically ({item.childSource.replace(/_/g, " ")}).</p>
              ) : (
                <>
                  <button type="button" onClick={() => setOpen((o) => ({ ...o, [item.id]: !isOpen }))}
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                    {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {depth === 0 ? "Dropdown links" : "Links under this heading"} ({kids.length})
                  </button>
                  {isOpen && (
                    <div className="pl-2 border-l-2">
                      <NavItemsEditor items={kids} onChange={(c) => setChildren(item.id, c)} depth={depth + 1} />
                    </div>
                  )}
                </>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Items in a subtree, all levels. */
function countAll(items: NavItem[] | undefined): number {
  return (items ?? []).reduce((n, i) => n + 1 + countAll(i.children), 0);
}
