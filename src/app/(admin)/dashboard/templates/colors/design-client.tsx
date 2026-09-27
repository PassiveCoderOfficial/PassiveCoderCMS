"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FONT_OPTIONS, googleFontsHref } from "@/modules/themes/fonts";
import type { SiteDesign, TemplatePalette, TemplateTypography } from "@/modules/themes/template-types";

const TEMPLATE = "__template";

const ROUNDNESS: { value: NonNullable<SiteDesign["roundness"]>; label: string; px: number }[] = [
  { value: "sharp", label: "Sharp", px: 0 },
  { value: "soft", label: "Soft", px: 6 },
  { value: "rounded", label: "Rounded", px: 12 },
  { value: "extra", label: "Extra round", px: 22 },
];
const SHADOWS: { value: NonNullable<SiteDesign["shadow"]>; label: string; css: string }[] = [
  { value: "none", label: "Flat", css: "none" },
  { value: "subtle", label: "Subtle", css: "0 2px 8px -2px rgb(0 0 0 / .06)" },
  { value: "normal", label: "Normal", css: "0 6px 16px -4px rgb(0 0 0 / .12)" },
  { value: "bold", label: "Bold", css: "0 14px 32px -8px rgb(0 0 0 / .24)" },
];
const WEIGHTS = [
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra bold" },
];
const TRACKING = [
  { value: "-0.03em", label: "Tight" },
  { value: "-0.01em", label: "Slightly tight" },
  { value: "0em", label: "Normal" },
  { value: "0.04em", label: "Wide" },
];

function FontSelect({ label, value, templateValue, onChange }: {
  label: string; value?: string; templateValue: string; onChange: (v: string | undefined) => void;
}) {
  const groups = ["sans", "serif", "display"] as const;
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value ?? TEMPLATE} onValueChange={(v) => onChange(v === TEMPLATE ? undefined : v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={TEMPLATE}>Template default ({templateValue.replace(/var\([^)]*\),\s*/g, "")})</SelectItem>
          {groups.map((g) => (
            <SelectGroup key={g}>
              <SelectLabel className="capitalize">{g === "sans" ? "Clean (sans-serif)" : g === "serif" ? "Elegant (serif)" : "Bold (display)"}</SelectLabel>
              {FONT_OPTIONS.filter((f) => f.category === g).map((f) => (
                <SelectItem key={f.name} value={f.name}><span style={{ fontFamily: `'${f.name}'` }}>{f.name}</span></SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Choice<T extends string>({ options, value, onChange, render }: {
  options: { value: T; label: string }[]; value?: T; onChange: (v: T | undefined) => void;
  render?: (o: { value: T; label: string }) => React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(value === o.value ? undefined : o.value)}
          className={cn(
            "rounded-md border px-3 py-2 text-sm text-left transition-colors",
            value === o.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted",
          )}
        >
          {render ? render(o) : o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Site-wide design settings: fonts, heading style, corner roundness and
 * shadow depth. Saved to site_identity.design_overrides and applied through
 * the same theme CSS as the colours, so every block on every page follows.
 * Clicking a selected option again clears it back to the template default.
 */
export function DesignClient({ initial, typography, palette, tenantId }: {
  initial: SiteDesign;
  typography: TemplateTypography;
  palette: TemplatePalette;
  tenantId: string;
}) {
  const router = useRouter();
  const [d, setD] = useState<SiteDesign>(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof SiteDesign>(k: K, v: SiteDesign[K] | undefined) =>
    setD((prev) => { const next = { ...prev }; if (v === undefined) delete next[k]; else next[k] = v; return next; });

  const headingFont = d.headingFont ?? typography.headingFont;
  const bodyFont = d.bodyFont ?? typography.bodyFont;
  const fontsHref = useMemo(() => googleFontsHref(FONT_OPTIONS.map((f) => f.name)), []);
  const radius = ROUNDNESS.find((r) => r.value === (d.roundness ?? "rounded"))!.px;
  const shadow = SHADOWS.find((s) => s.value === (d.shadow ?? "normal"))!.css;
  const q = (f: string) => (/var\(|,/.test(f) ? f : `'${f}'`);

  async function persist(value: SiteDesign | null) {
    setSaving(true);
    const { error } = await createClient().from("site_identity").upsert(
      { tenant_id: tenantId, design_overrides: value, updated_at: new Date().toISOString() },
      { onConflict: "tenant_id" },
    );
    setSaving(false);
    if (error) { toast.error(error.message); return false; }
    router.refresh();
    return true;
  }

  return (
    <div className="space-y-6">
      {/* Loads every offered font so the dropdown and preview show real type. Admin-only page. */}
      {fontsHref && <link rel="stylesheet" href={fontsHref} />}

      <div className="space-y-5 rounded-lg border p-4 bg-card">
        <div className="grid sm:grid-cols-2 gap-4">
          <FontSelect label="Heading font" value={d.headingFont} templateValue={typography.headingFont} onChange={(v) => set("headingFont", v)} />
          <FontSelect label="Body font" value={d.bodyFont} templateValue={typography.bodyFont} onChange={(v) => set("bodyFont", v)} />
        </div>
        <div className="space-y-1.5">
          <Label>Heading weight</Label>
          <Choice options={WEIGHTS} value={d.headingWeight} onChange={(v) => set("headingWeight", v)}
            render={(o) => <span style={{ fontFamily: q(headingFont), fontWeight: Number(o.value) }}>{o.label}</span>} />
        </div>
        <div className="space-y-1.5">
          <Label>Heading letter spacing</Label>
          <Choice options={TRACKING} value={d.letterSpacing} onChange={(v) => set("letterSpacing", v)}
            render={(o) => <span style={{ fontFamily: q(headingFont), letterSpacing: o.value }}>{o.label}</span>} />
        </div>
        <div className="space-y-1.5">
          <Label>Corners</Label>
          <Choice options={ROUNDNESS} value={d.roundness} onChange={(v) => set("roundness", v)}
            render={(o) => (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-foreground/60" style={{ borderRadius: ROUNDNESS.find((r) => r.value === o.value)!.px / 2 }} />
                {o.label}
              </span>
            )} />
        </div>
        <div className="space-y-1.5">
          <Label>Shadows</Label>
          <Choice options={SHADOWS} value={d.shadow} onChange={(v) => set("shadow", v)} />
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">Preview</p>
        <div className="rounded-lg border p-6" style={{ background: palette.background, color: palette.foreground, fontFamily: q(bodyFont) }}>
          <div className="p-6 max-w-sm" style={{ background: palette.card, borderRadius: radius, boxShadow: shadow, border: `1px solid ${palette.border}` }}>
            <h3 className="text-2xl mb-2" style={{ fontFamily: q(headingFont), fontWeight: Number(d.headingWeight ?? typography.headingWeight), letterSpacing: d.letterSpacing ?? typography.letterSpacing }}>
              Fresh, fast and local
            </h3>
            <p className="text-sm mb-4" style={{ color: palette.mutedFg }}>
              This is how your headings, text, cards and buttons will look across your site.
            </p>
            <span className="inline-block px-4 py-2 text-sm font-medium" style={{ background: palette.primary, color: palette.primaryFg, borderRadius: Math.min(radius, 999) * 0.75 }}>
              Book now
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={async () => { if (await persist(Object.keys(d).length ? d : null)) toast.success("Design saved"); }} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Design
        </Button>
        <Button variant="outline" disabled={saving || Object.keys(initial).length === 0 && Object.keys(d).length === 0}
          onClick={async () => { if (await persist(null)) { setD({}); toast.success("Reset to template default"); } }}>
          <RotateCcw className="w-4 h-4 mr-2" /> Reset to template default
        </Button>
      </div>
    </div>
  );
}
