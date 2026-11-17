"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { IconPicker } from "@/components/ui/icon-picker";
import { TextField, ImageField, ItemsEditor } from "./showcase-fields";
import type { CodeBlockProps, CodeTab, MediaTabItem, MediaTabsBlockProps, SectionNavBlockProps } from "@/types/cms";

const TONE_HINT = "Light or dark text follows the section Background (Layout tab).";

function ButtonFields({ label, value, onChange }: { label: string; value?: { label: string; url: string }; onChange: (v: { label: string; url: string }) => void }) {
  const v = value ?? { label: "", url: "" };
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-1">
        <Input value={v.label} onChange={(e) => onChange({ ...v, label: e.target.value })} className="h-8 text-xs flex-1" placeholder="Text (empty = no button)" />
        <Input value={v.url} onChange={(e) => onChange({ ...v, url: e.target.value })} className="h-8 text-xs flex-1" placeholder="Link" />
      </div>
    </div>
  );
}

function SelectField<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <select className="w-full h-8 text-xs mt-1 rounded-md border bg-background px-2" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

/** Code & Terminal: heading, steps, the tabs of the window and its buttons. */
export function CodeSettings({ block }: { block: CodeBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const d = block.data;
  const set = (patch: Partial<CodeBlockProps["data"]>) => updateBlock(block.id, { data: { ...d, ...patch } });
  return (
    <div className="space-y-3">
      <TextField label="Small label above title" value={d.eyebrow} onChange={(v) => set({ eyebrow: v })} />
      <TextField label="Title" value={d.title} onChange={(v) => set({ title: v })} />
      <TextField label="Subtitle" value={d.subtitle} onChange={(v) => set({ subtitle: v })} multiline />
      <SelectField label="Layout" value={d.layout ?? "split"} options={[["split", "Steps beside the window"], ["stacked", "Heading above the window"]]} onChange={(v) => set({ layout: v })} />
      <div className="border-t pt-3">
        <ItemsEditor title="Numbered steps" items={d.steps} onChange={(v) => set({ steps: v })}
          make={() => ({ title: "New step", description: "" })} itemLabel={(it, i) => `${i + 1}. ${it.title}`}
          render={(it, up) => (
            <div className="space-y-1">
              <Input value={it.title} onChange={(e) => up({ title: e.target.value })} className="h-7 text-xs" placeholder="Step title" />
              <textarea className="w-full text-xs border rounded-md p-2 resize-y bg-background" rows={2} value={it.description ?? ""} placeholder="Description" onChange={(e) => up({ description: e.target.value })} />
            </div>
          )} />
      </div>
      <div className="border-t pt-3">
        <ItemsEditor<CodeTab> title="Windows (tabs)" items={d.tabs} onChange={(v) => set({ tabs: v })}
          make={() => ({ label: "Terminal", kind: "terminal" as const, code: "$ " })} itemLabel={(it) => it.label}
          render={(it, up) => (
            <div className="space-y-1">
              <div className="flex gap-1">
                <Input value={it.label} onChange={(e) => up({ label: e.target.value })} className="h-7 text-xs flex-1" placeholder="Tab name" />
                <select value={it.kind} onChange={(e) => up({ kind: e.target.value as CodeTab["kind"] })} className="h-7 text-xs rounded-md border bg-background px-2" aria-label="Kind">
                  <option value="terminal">Terminal</option><option value="code">File</option>
                </select>
              </div>
              <textarea className="w-full text-xs font-mono border rounded-md p-2 resize-y bg-background" rows={7} spellCheck={false} value={it.code} onChange={(e) => up({ code: e.target.value })}
                placeholder={it.kind === "terminal" ? "$ a command\nits output\n# a comment" : "KEY=value"} />
              <p className="text-[10px] text-muted-foreground">{it.kind === "terminal" ? "Lines starting with $ are commands; only those are copied. # starts a comment." : "The whole text is copied."}</p>
            </div>
          )} />
      </div>
      <div className="border-t pt-3 space-y-2">
        <ButtonFields label="Button" value={d.primaryButton} onChange={(v) => set({ primaryButton: v })} />
        <ButtonFields label="Second button" value={d.secondaryButton} onChange={(v) => set({ secondaryButton: v })} />
        <TextField label="Small line under the window" value={d.note} onChange={(v) => set({ note: v })} />
        <div className="grid grid-cols-2 gap-1.5">
          <Input value={d.copyLabel ?? ""} onChange={(e) => set({ copyLabel: e.target.value })} className="h-7 text-xs" placeholder="Copy" aria-label="Copy button text" />
          <Input value={d.copiedLabel ?? ""} onChange={(e) => set({ copiedLabel: e.target.value })} className="h-7 text-xs" placeholder="Copied" aria-label="Text after copying" />
        </div>
        <p className="text-[10px] text-muted-foreground">{TONE_HINT} The window itself is always dark.</p>
      </div>
    </div>
  );
}

/** Screenshot Tabs: heading, the items (each with its screenshot) and layout. */
export function MediaTabsSettings({ block }: { block: MediaTabsBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const d = block.data;
  const set = (patch: Partial<MediaTabsBlockProps["data"]>) => updateBlock(block.id, { data: { ...d, ...patch } });
  return (
    <div className="space-y-3">
      <TextField label="Small label above title" value={d.eyebrow} onChange={(v) => set({ eyebrow: v })} />
      <TextField label="Title" value={d.title} onChange={(v) => set({ title: v })} />
      <TextField label="Subtitle" value={d.subtitle} onChange={(v) => set({ subtitle: v })} multiline />
      <SelectField label="Layout" value={d.layout ?? "side"} options={[["side", "List beside the picture"], ["top", "Tabs above the picture"]]} onChange={(v) => set({ layout: v })} />
      {(d.layout ?? "side") === "side" && (
        <SelectField label="Picture side" value={d.mediaSide ?? "right"} options={[["right", "Right"], ["left", "Left"]]} onChange={(v) => set({ mediaSide: v })} />
      )}
      <TextField label="Picture shape (width divided by height)" value={d.imageRatio ? String(d.imageRatio) : ""} onChange={(v) => set({ imageRatio: Number(v) > 0 ? Number(v) : undefined })} placeholder="1.6"
        hint="All pictures use the same shape, so nothing jumps when they change." />
      <div className="border-t pt-3">
        <ItemsEditor<MediaTabItem> title="Items" items={d.items} onChange={(v) => set({ items: v })}
          make={() => ({ icon: "Star", title: "New item", description: "", imageUrl: "", imageAlt: "", frameUrl: "" })} itemLabel={(it) => it.title}
          render={(it, up) => (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <IconPicker value={it.icon ?? ""} onChange={(v) => up({ icon: v || undefined })} />
                <Input value={it.title} onChange={(e) => up({ title: e.target.value })} className="h-7 text-xs flex-1" placeholder="Title" />
              </div>
              <textarea className="w-full text-xs border rounded-md p-2 resize-y bg-background" rows={2} value={it.description ?? ""} placeholder="Description" onChange={(e) => up({ description: e.target.value })} />
              <ImageField label="Screenshot" value={it.imageUrl} onChange={(v) => up({ imageUrl: v })} />
              <Input value={it.imageAlt ?? ""} onChange={(e) => up({ imageAlt: e.target.value })} className="h-7 text-xs" placeholder="Picture description (for search engines)" />
              <Input value={it.frameUrl ?? ""} onChange={(e) => up({ frameUrl: e.target.value })} className="h-7 text-xs" placeholder="Address in the window bar (optional)" />
            </div>
          )} />
      </div>
      <div className="border-t pt-3 space-y-2">
        <ButtonFields label="Button under the section" value={d.primaryButton} onChange={(v) => set({ primaryButton: v })} />
        <p className="text-[10px] text-muted-foreground">{TONE_HINT} On phones every item is shown with its picture.</p>
      </div>
    </div>
  );
}

/** Section Links: the links, the optional button and the sticky switch. */
export function SectionNavSettings({ block }: { block: SectionNavBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const d = block.data;
  const set = (patch: Partial<SectionNavBlockProps["data"]>) => updateBlock(block.id, { data: { ...d, ...patch } });
  return (
    <div className="space-y-3">
      <TextField label="Small label before the links" value={d.label} onChange={(v) => set({ label: v })} placeholder="On this page" />
      <ItemsEditor title="Links" items={d.items} onChange={(v) => set({ items: v })}
        make={() => ({ label: "Section", anchor: "" })} itemLabel={(it) => it.label}
        render={(it, up) => (
          <div className="flex gap-1">
            <Input value={it.label} onChange={(e) => up({ label: e.target.value })} className="h-7 text-xs flex-1" placeholder="Label" />
            <Input value={it.anchor} onChange={(e) => up({ anchor: e.target.value.replace(/[^A-Za-z0-9-]/g, "") })} className="h-7 text-xs flex-1" placeholder="Section anchor" />
          </div>
        )} />
      <p className="text-[10px] text-muted-foreground">Give each section its anchor under Layout, Section anchor, and type the same word here.</p>
      <div className="border-t pt-3 space-y-3">
        <ButtonFields label="Button on the right" value={d.button} onChange={(v) => set({ button: v })} />
        <div className="flex items-center justify-between">
          <Label className="text-xs">Stay at the top while scrolling</Label>
          <Switch checked={d.sticky !== false} onCheckedChange={(v) => set({ sticky: v })} />
        </div>
        {d.sticky !== false && (
          <TextField label="Distance from the top (px)" value={String(d.topOffset ?? 64)} onChange={(v) => set({ topOffset: Math.max(0, Number(v) || 0) })} hint="The height of your site header when it also stays at the top; 0 when it does not." />
        )}
        <p className="text-[10px] text-muted-foreground">{TONE_HINT}</p>
      </div>
    </div>
  );
}
