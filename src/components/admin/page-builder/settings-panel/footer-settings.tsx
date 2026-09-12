"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { Plus, Trash2 } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { FooterBlockProps, FooterColumn, FooterSocial, FooterColumnLink } from "@/types/cms";

/**
 * The footer block's own settings — never existed until now (2026-09-12,
 * found via a Playwright audit of the footer builder Wali asked for): the
 * settings-panel switch had no `case "footer"` at all, so selecting the
 * footer showed "No settings for this block type" — the one block that IS
 * the site footer had no way to edit its columns, links, socials, logo, or
 * copyright text through the UI. Pre-existing since the footer block type
 * was added, not a regression from recent work.
 */
export function FooterSettings({ block }: { block: FooterBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  const columns = block.data.columns ?? [];
  const updateColumn = (id: string, patch: Partial<FooterColumn>) => {
    update("columns", columns.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };
  const addColumn = () => update("columns", [...columns, { id: generateId(), heading: "New Column", links: [] }]);
  const removeColumn = (id: string) => update("columns", columns.filter((c) => c.id !== id));

  const updateColumnLink = (colId: string, linkId: string, patch: Partial<FooterColumnLink>) => {
    updateColumn(colId, {
      links: (columns.find((c) => c.id === colId)?.links ?? []).map((l) => (l.id === linkId ? { ...l, ...patch } : l)),
    });
  };
  const addColumnLink = (colId: string) => {
    const col = columns.find((c) => c.id === colId);
    if (!col) return;
    updateColumn(colId, { links: [...col.links, { id: generateId(), label: "New Link", url: "#" }] });
  };
  const removeColumnLink = (colId: string, linkId: string) => {
    const col = columns.find((c) => c.id === colId);
    if (!col) return;
    updateColumn(colId, { links: col.links.filter((l) => l.id !== linkId) });
  };

  const socials = block.data.socials ?? [];
  const SOCIAL_PLATFORMS: FooterSocial["platform"][] = ["facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok", "whatsapp"];
  const updateSocial = (i: number, patch: Partial<FooterSocial>) => {
    update("socials", socials.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const addSocial = () => update("socials", [...socials, { platform: "facebook", url: "" }]);
  const removeSocial = (i: number) => update("socials", socials.filter((_, idx) => idx !== i));

  const bottomLinks = block.data.bottomLinks ?? [];
  const updateBottomLink = (id: string, patch: Partial<FooterColumnLink>) => {
    update("bottomLinks", bottomLinks.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };
  const addBottomLink = () => update("bottomLinks", [...bottomLinks, { id: generateId(), label: "New Link", url: "#" }]);
  const removeBottomLink = (id: string) => update("bottomLinks", bottomLinks.filter((l) => l.id !== id));

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Logo Text</Label>
        <Input value={block.data.logoText ?? ""} onChange={(e) => update("logoText", e.target.value)} className="h-8 text-xs" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Logo Image (optional override)</Label>
        <MediaPickerInput compact value={block.data.logo ?? ""} onChange={(url) => update("logo", url)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Tagline / Description</Label>
        <Input value={block.data.tagline ?? ""} onChange={(e) => update("tagline", e.target.value)} className="h-8 text-xs" />
      </div>

      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold">Link Columns ({columns.length})</Label>
          <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={addColumn}><Plus className="h-3 w-3 mr-1" /> Add</Button>
        </div>
        <div className="space-y-2">
          {columns.map((col) => (
            <div key={col.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex items-center gap-1.5">
                <Input value={col.heading} onChange={(e) => updateColumn(col.id, { heading: e.target.value })} className="h-7 text-xs flex-1" placeholder="Column heading" />
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeColumn(col.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
              <div className="pl-2 space-y-1">
                {col.links.map((link) => (
                  <div key={link.id} className="flex items-center gap-1">
                    <Input value={link.label} onChange={(e) => updateColumnLink(col.id, link.id, { label: e.target.value })} className="h-6 text-[11px] flex-1" placeholder="Label" />
                    <Input value={link.url} onChange={(e) => updateColumnLink(col.id, link.id, { url: e.target.value })} className="h-6 text-[11px] flex-1" placeholder="URL" />
                    <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => removeColumnLink(col.id, link.id)}><Trash2 className="h-2.5 w-2.5 text-destructive" /></Button>
                  </div>
                ))}
                <button onClick={() => addColumnLink(col.id)} className="text-[11px] text-primary hover:underline">+ Add link</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold">Social Links ({socials.length})</Label>
          <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={addSocial}><Plus className="h-3 w-3 mr-1" /> Add</Button>
        </div>
        <div className="space-y-1.5">
          {socials.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Select value={s.platform} onValueChange={(v) => updateSocial(i, { platform: v as FooterSocial["platform"] })}>
                <SelectTrigger className="h-7 text-xs w-28 shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORMS.map((p) => <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input value={s.url} onChange={(e) => updateSocial(i, { url: e.target.value })} className="h-7 text-xs flex-1" placeholder="Profile URL" />
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeSocial(i)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Show Newsletter Signup</Label>
          <Switch checked={!!block.data.showNewsletter} onCheckedChange={(v) => update("showNewsletter", v)} />
        </div>
        {block.data.showNewsletter && (
          <>
            <Input value={block.data.newsletterLabel ?? ""} onChange={(e) => update("newsletterLabel", e.target.value)} className="h-7 text-xs" placeholder="Newsletter label, e.g. Subscribe to updates" />
            <Input value={block.data.newsletterPlaceholder ?? ""} onChange={(e) => update("newsletterPlaceholder", e.target.value)} className="h-7 text-xs" placeholder="Email input placeholder" />
          </>
        )}
      </div>

      <div className="border-t pt-3 space-y-2">
        <Label className="text-xs font-semibold">Copyright</Label>
        <Input value={block.data.copyrightText ?? ""} onChange={(e) => update("copyrightText", e.target.value)} className="h-7 text-xs" placeholder="e.g. All rights reserved." />
        <div className="flex items-center justify-between">
          <Label className="text-xs">Show current year automatically</Label>
          <Switch checked={block.data.copyrightYear !== false} onCheckedChange={(v) => update("copyrightYear", v)} />
        </div>
      </div>

      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold">Bottom Links ({bottomLinks.length})</Label>
          <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={addBottomLink}><Plus className="h-3 w-3 mr-1" /> Add</Button>
        </div>
        <div className="space-y-1.5">
          {bottomLinks.map((link) => (
            <div key={link.id} className="flex items-center gap-1.5">
              <Input value={link.label} onChange={(e) => updateBottomLink(link.id, { label: e.target.value })} className="h-7 text-xs flex-1" placeholder="Label" />
              <Input value={link.url} onChange={(e) => updateBottomLink(link.id, { url: e.target.value })} className="h-7 text-xs flex-1" placeholder="URL" />
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeBottomLink(link.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">e.g. Privacy Policy, Terms &amp; Conditions — shown beside the copyright line.</p>
      </div>
    </div>
  );
}

export function FooterStyleSettings({ block }: { block: FooterBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Style</Label>
        <Select value={block.data.style ?? "dark"} onValueChange={(v) => update("style", v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="dark" className="text-xs">Dark</SelectItem>
            <SelectItem value="light" className="text-xs">Light</SelectItem>
            <SelectItem value="colored" className="text-xs">Colored</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border-t pt-3 grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground">Background</Label>
          <ColorPicker value={block.data.backgroundColor ?? "#0f172a"} onChange={(v) => update("backgroundColor", v)} className="mt-0.5" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Text Color</Label>
          <ColorPicker value={block.data.textColor ?? "#e2e8f0"} onChange={(v) => update("textColor", v)} className="mt-0.5" />
        </div>
      </div>
      <div>
        <Label className="text-[10px] text-muted-foreground">Accent / Heading Color</Label>
        <ColorPicker value={block.data.accentColor ?? block.data.textColor ?? "#ffffff"} onChange={(v) => update("accentColor", v)} className="mt-0.5" />
      </div>
      {(block.data.backgroundColor || block.data.textColor || block.data.accentColor) && (
        <button
          onClick={() => { update("backgroundColor", ""); update("textColor", ""); update("accentColor", ""); }}
          className="text-[11px] text-muted-foreground underline"
        >
          Use theme default instead
        </button>
      )}
    </div>
  );
}
