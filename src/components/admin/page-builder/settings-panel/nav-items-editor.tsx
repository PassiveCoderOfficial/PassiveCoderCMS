"use client";

/**
 * Shared "edit these nav items" list — extracted from NavigationSettings
 * (2026-09-06) so the new HeaderNavSettings doesn't duplicate this list UI.
 * Top-level items only (label + URL); dropdown/mega-menu children are edited
 * via the nav menu manager (nav_menus), same as before this extraction —
 * this component's scope hasn't changed, just its location.
 */
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { NavItem } from "@/types/cms";

export function NavItemsEditor({ items, onChange }: { items: NavItem[]; onChange: (items: NavItem[]) => void }) {
  const updateItem = (id: string, field: "label" | "url", value: string) => {
    onChange(items.map((it) => it.id === id ? { ...it, [field]: value } : it));
  };
  const addItem = () => onChange([...items, { id: generateId(), label: "New Link", url: "#" }]);
  const removeItem = (id: string) => onChange(items.filter((it) => it.id !== id));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs font-semibold">Nav Items ({items.length})</Label>
        <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add</Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
            <Input value={item.label} onChange={(e) => updateItem(item.id, "label", e.target.value)} className="h-7 text-xs" placeholder="Label" />
            <Input value={item.url} onChange={(e) => updateItem(item.id, "url", e.target.value)} className="h-7 text-xs" placeholder="URL" />
          </div>
        ))}
      </div>
    </div>
  );
}
