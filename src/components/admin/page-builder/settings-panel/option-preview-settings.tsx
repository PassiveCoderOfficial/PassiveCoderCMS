"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import type { OptionPreviewBlockProps } from "@/types/cms";
import { TextField, ImageField, ItemsEditor, ShowcaseColorsEditor } from "./showcase-fields";

type D = OptionPreviewBlockProps["data"];

export function OptionPreviewSettings({ block }: { block: OptionPreviewBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const d = block.data;
  const set = <K extends keyof D>(k: K, v: D[K]) => updateBlock(block.id, { data: { ...d, [k]: v } } as Partial<OptionPreviewBlockProps>);
  const panel = d.panel ?? {};
  const setPanel = (patch: Partial<NonNullable<D["panel"]>>) => set("panel", { ...panel, ...patch });

  return (
    <div className="space-y-3">
      <TextField label="Small label above title" value={d.eyebrow} onChange={(v) => set("eyebrow", v)} />
      <TextField label="Title" value={d.title} onChange={(v) => set("title", v)} />
      <TextField label="Text" value={d.subtitle} onChange={(v) => set("subtitle", v)} multiline />
      <ImageField label="Main photo" value={d.imageUrl} onChange={(v) => set("imageUrl", v)} />
      <div className="flex items-center justify-between">
        <Label className="text-xs">Dark section</Label>
        <Switch checked={d.tone !== "light"} onCheckedChange={(v) => set("tone", v ? "dark" : "light")} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show label on photo</Label>
        <Switch checked={d.showLabel !== false} onCheckedChange={(v) => set("showLabel", v)} />
      </div>
      {d.showLabel !== false && <TextField label="Label prefix" value={d.labelPrefix} onChange={(v) => set("labelPrefix", v)} placeholder="e.g. VLT" />}

      <div className="border-t pt-3">
        <ItemsEditor title="Options" items={d.options} onChange={(v) => set("options", v)}
          make={() => ({ label: "Option", sublabel: "", mode: "tint" as const, color: "#06111F", strength: 50 })}
          itemLabel={(o) => o.label}
          render={(o, up) => (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                <Input value={o.label} onChange={(e) => up({ label: e.target.value })} className="h-7 text-xs flex-1" placeholder="Label (50%)" />
                <Input value={o.sublabel ?? ""} onChange={(e) => up({ sublabel: e.target.value })} className="h-7 text-xs flex-1" placeholder="Small text" />
              </div>
              <select value={o.mode ?? "tint"} onChange={(e) => up({ mode: e.target.value as "tint" | "image" })} className="w-full h-7 text-xs rounded-md border bg-background px-2">
                <option value="tint">Tint the main photo</option>
                <option value="image">Show its own photo</option>
              </select>
              {(o.mode ?? "tint") === "tint" ? (
                <>
                  <ColorPicker value={o.color ?? "#06111F"} onChange={(v) => up({ color: v })} />
                  <Label className="text-[10px] text-muted-foreground">Strength {o.strength ?? 50}%</Label>
                  <Input type="range" min={0} max={100} value={o.strength ?? 50} onChange={(e) => up({ strength: Number(e.target.value) })} className="h-6" />
                </>
              ) : (
                <ImageField label="Option photo" value={o.imageUrl} onChange={(v) => up({ imageUrl: v })} />
              )}
            </div>
          )} />
        {!!d.options?.length && (
          <div className="mt-2">
            <Label className="text-xs">Selected at start</Label>
            <select value={d.defaultIndex ?? 0} onChange={(e) => set("defaultIndex", Number(e.target.value))} className="w-full h-8 text-xs rounded-md border bg-background px-2 mt-1">
              {d.options.map((o, i) => <option key={o.id} value={i}>{o.label}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Side panel</p>
          <Switch checked={panel.show !== false} onCheckedChange={(v) => setPanel({ show: v })} />
        </div>
        {panel.show !== false && (
          <>
            <TextField label="Panel title" value={panel.title} onChange={(v) => setPanel({ title: v })} />
            <ItemsEditor title="Rows (label + value)" items={panel.rows} onChange={(v) => setPanel({ rows: v })}
              make={() => ({ label: "Label", value: "Value" })} itemLabel={(r) => `${r.label}: ${r.value}`}
              render={(r, up) => (
                <div className="flex gap-1">
                  <Input value={r.label} onChange={(e) => up({ label: e.target.value })} className="h-7 text-xs flex-1" />
                  <Input value={r.value} onChange={(e) => up({ value: e.target.value })} className="h-7 text-xs w-20" />
                </div>
              )} />
            <TextField label="Panel text" value={panel.text} onChange={(v) => setPanel({ text: v })} multiline />
            <TextField label="Button text" value={panel.buttonLabel} onChange={(v) => setPanel({ buttonLabel: v })} />
            <div className="flex items-center justify-between">
              <Label className="text-xs">Button opens WhatsApp</Label>
              <Switch checked={panel.whatsapp ?? false} onCheckedChange={(v) => setPanel({ whatsapp: v })} />
            </div>
            {panel.whatsapp
              ? <TextField label="WhatsApp message" value={panel.whatsappText} onChange={(v) => setPanel({ whatsappText: v })} multiline />
              : <TextField label="Button link" value={panel.buttonUrl} onChange={(v) => setPanel({ buttonUrl: v })} />}
          </>
        )}
      </div>
      <ShowcaseColorsEditor value={d.colors} onChange={(v) => set("colors", v)} />
    </div>
  );
}
