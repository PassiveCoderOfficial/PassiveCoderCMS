"use client";

import React from "react";
import { IconPicker } from "@/components/ui/icon-picker";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { ColorPicker } from "@/components/ui/color-picker";
import type { HeroBlockProps } from "@/types/cms";
import { Switch } from "@/components/ui/switch";
import { AlignLeft, AlignCenter, AlignRight, Columns2 } from "lucide-react";
import { CountryMultiPicker } from "@/components/admin/country-multi-picker";
import { MultiImagePicker } from "@/components/admin/multi-image-picker";
import { cn } from "@/lib/utils";
import { TextField, ItemsEditor, MetersEditor, ShowcaseColorsEditor } from "./showcase-fields";
import { InlineLeadFormSettings } from "./lead-form-settings";

export function HeroSettings({ block }: { block: HeroBlockProps }) {
  const { updateBlock } = useBuilderStore();

  const update = (field: string, value: unknown) => {
    updateBlock(block.id, { data: { ...block.data, [field]: value } });
  };

  // "fullscreen-overlay" renders its photo as the whole section's background
  // (painted by the shared BlockRenderer wrapper via block.background so it
  // covers padding too — see block-utils.ts getBlockBackground()), not as an
  // inline content image. Keep block.background in sync here so picking a
  // photo from this Content tab actually shows up section-wide.
  const isFullscreen = block.templateVariant === "fullscreen-overlay";
  const updateButtonField = (btn: "primaryButton" | "secondaryButton" | "tertiaryButton", field: "label" | "url", value: string) => {
    const existing = block.data[btn] ?? { label: "", url: "", variant: btn === "primaryButton" ? "primary" : "outline" };
    updateBlock(block.id, { data: { ...block.data, [btn]: { ...existing, [field]: value } } });
  };

  const updateImage = (url: string) => {
    if (isFullscreen) {
      updateBlock(block.id, {
        data: { ...block.data, imageUrl: url },
        background: { ...block.background, type: "image", imageUrl: url },
      });
    } else {
      update("imageUrl", url);
    }
  };

  // "centered-bold" and "corporate" are single-column, always-centered
  // designs by intent (no image split, no side-pinned text) — Layout has
  // nothing to control there, so hide it instead of showing a dropdown that
  // silently does nothing when changed.
  const showcase = block.templateVariant === "spec-card" || block.templateVariant === "page-banner";
  const specCard = block.templateVariant === "spec-card";
  const card = block.data.specCard ?? {};
  const setCard = (patch: Partial<NonNullable<HeroBlockProps["data"]["specCard"]>>) => update("specCard", { ...card, ...patch });
  type SidePhoto = NonNullable<HeroBlockProps["data"]["sidePhoto"]>;
  const side = block.data.sidePhoto;
  const setSide = (patch: Partial<SidePhoto> | null) => update("sidePhoto", patch === null ? undefined : { ...(side ?? { imageUrl: "" }), ...patch });
  const v = block.templateVariant ?? "";
  // The phone photo is drawn only where the design uses its own photo element:
  // not by the classic default layout, not by Fullscreen Overlay (its photo is
  // the section background), and not under a slideshow or the whole-image fit.
  const slideshowOn = (block.data.bgSlides ?? []).filter(Boolean).length >= 2;
  const phoneImageApplies = !slideshowOn && (
    ["centered-bold", "dark-gradient-left", "corporate", "spec-card", "page-banner"].includes(v)
    || (v === "split-image-right" && block.data.imageFit !== "full"));

  return (
    <div className="space-y-4">

      {block.templateVariant === "page-banner" && (
        <FieldGroup label="Icon above title (optional)">
          <div className="flex items-center gap-2">
            <IconPicker value={block.data.icon ?? ""} onChange={(v) => update("icon", v || undefined)} />
            {block.data.icon && <button type="button" onClick={() => update("icon", undefined)} className="text-[11px] text-muted-foreground underline">Remove</button>}
          </div>
        </FieldGroup>
      )}

      {specCard && (
        <TextField label="Highlight line above the badge" value={block.data.topLine} onChange={(v) => update("topLine", v || undefined)} placeholder="e.g. 24/7 Emergency Electrician in Singapore" />
      )}

      <FieldGroup label={block.templateVariant === "page-banner" ? "Small label above title" : "Badge text"}>
        <Input value={block.data.badge ?? ""} onChange={(e) => update("badge", e.target.value)} className="h-8 text-xs" placeholder="Optional badge" />
      </FieldGroup>

      <FieldGroup label="Title">
        <Input value={block.data.title} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs" />
      </FieldGroup>

      {(showcase || ["dark-gradient-left", "split-image-right", "centered-bold", "product"].includes(v)) && (
        <TextField label="Second title line (accent colour)" value={block.data.titleAccent} onChange={(val) => update("titleAccent", val)} placeholder="Optional" />
      )}
      {!showcase && (
        <FieldGroup label="Subtitle">
          <Input value={block.data.subtitle ?? ""} onChange={(e) => update("subtitle", e.target.value)} className="h-8 text-xs" />
        </FieldGroup>
      )}

      <FieldGroup label="Description">
        <Textarea value={block.data.description ?? ""} onChange={(e) => update("description", e.target.value)} className="text-xs resize-none" rows={3} />
      </FieldGroup>

      {(block.templateVariant === "split-image-right" || block.templateVariant === "product") && (
        <FieldGroup label="Bullet points (one per line)">
          <Textarea value={(block.data.bullets ?? []).join("\n")} onChange={(e) => update("bullets", e.target.value ? e.target.value.split("\n") : undefined)} className="text-xs resize-none" rows={3} />
        </FieldGroup>
      )}

      {block.templateVariant === "product" && (
        <div className="space-y-3 rounded-lg border p-2">
          <TextField label="Command under the buttons (with a copy button)" value={block.data.command} onChange={(val) => update("command", val || undefined)} placeholder="docker compose up -d" />
          <TextField label="Address in the screenshot window bar" value={block.data.frameUrl} onChange={(val) => update("frameUrl", val || undefined)} placeholder="yoursite.com/dashboard" hint="Type none to hide the window bar." />
          <TextField label="Screenshot shape (width divided by height)" value={block.data.imageRatio ? String(block.data.imageRatio) : ""} onChange={(val) => update("imageRatio", Number(val) > 0 ? Number(val) : undefined)} placeholder="1.6" />
          <ItemsEditor title="Numbers under the text" max={4} items={block.data.statRow} onChange={(val) => update("statRow", val)}
            make={() => ({ value: "24/7", label: "Support" })} itemLabel={(it) => `${it.value} ${it.label}`}
            render={(it, set) => (
              <div className="flex gap-1">
                <Input value={it.value} onChange={(e) => set({ value: e.target.value })} className="h-7 text-xs w-20" placeholder="Value" />
                <Input value={it.label} onChange={(e) => set({ label: e.target.value })} className="h-7 text-xs flex-1" placeholder="Label" />
              </div>
            )} />
          <p className="text-[10px] text-muted-foreground">Light or dark text follows the section Background (Layout tab). Text position: Centre puts the screenshot under the text, Split puts it beside.</p>
        </div>
      )}

      <HeroTrustFields data={block.data} update={update} />
      {(!block.templateVariant || block.templateVariant === "split-image-right") ? (
        <InlineLeadFormSettings value={block.data.leadForm} onChange={(v) => update("leadForm", v)} />
      ) : (
        <p className="text-[10px] text-muted-foreground rounded-lg border p-2">An enquiry form in the banner is available with the <b>Split Image</b> design (Style tab).</p>
      )}

      <FieldGroup label="Image">
        <MediaPickerInput compact value={block.data.imageUrl ?? ""} onChange={updateImage}
          focus={block.data.imageFocus ?? (block.data.imagePosition ? { focus: block.data.imagePosition } : undefined)}
          onFocusChange={(f) => update("imageFocus", f)} />
      </FieldGroup>
      {(block.data.imageUrl || slideshowOn) && (
        <TextField label="Photo description (for search engines)" value={block.data.imageAlt} onChange={(val) => update("imageAlt", val || undefined)} placeholder="Empty = the title" />
      )}

      {phoneImageApplies && (
        <FieldGroup label="Phone image (optional)">
          <p className="text-[10px] text-muted-foreground">Shown instead of the image above on phones (under 768px). Use a portrait photo when the main one is wide. Leave empty to use the same image.</p>
          <MediaPickerInput compact value={block.data.mobileImageUrl ?? ""} onChange={(url) => update("mobileImageUrl", url || undefined)}
            focus={block.data.mobileImageFocus} onFocusChange={(f) => update("mobileImageFocus", f)} />
        </FieldGroup>
      )}

      {(block.templateVariant ?? "") === "split-image-right" && (
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={block.data.imageFit === "full"} onChange={(e) => update("imageFit", e.target.checked ? "full" : undefined)} />
          Show the whole image (for banners with text, no cropping)
        </label>
      )}

      {["fullscreen-overlay", "dark-gradient-left", "corporate", "split-image-right"].includes(block.templateVariant ?? "") && (
        <FieldGroup label="Background slideshow (optional)">
          <p className="text-[10px] text-muted-foreground">Add 2 or more photos and they fade in turn behind the text. Leave empty to show the single image.</p>
          <MultiImagePicker value={(block.data.bgSlides ?? []).map((url) => ({ url }))} onChange={(v) => update("bgSlides", v.map((x) => x.url))} />
          {(block.data.bgSlides?.length ?? 0) >= 2 && (
            <select value={String(block.data.slideInterval ?? 5)} onChange={(e) => update("slideInterval", Number(e.target.value))} className="w-full h-8 text-xs mt-2 rounded-md border bg-background px-2">
              {[3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n} seconds per photo</option>)}
            </select>
          )}
        </FieldGroup>
      )}

      <div className="pt-2 border-t space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Primary Button</p>
        <div className="space-y-1.5">
          <Input value={block.data.primaryButton?.label ?? ""} onChange={(e) => updateButtonField("primaryButton", "label", e.target.value)} className="h-8 text-xs" placeholder="Label, e.g. Get a Free Quote" />
          <Input value={block.data.primaryButton?.url ?? ""} onChange={(e) => updateButtonField("primaryButton", "url", e.target.value)} className="h-8 text-xs" placeholder="Link URL, e.g. /contact" />
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Secondary Button</p>
        <div className="space-y-1.5">
          <Input value={block.data.secondaryButton?.label ?? ""} onChange={(e) => updateButtonField("secondaryButton", "label", e.target.value)} className="h-8 text-xs" placeholder="Label, e.g. WhatsApp Us" />
          <Input value={block.data.secondaryButton?.url ?? ""} onChange={(e) => updateButtonField("secondaryButton", "url", e.target.value)} className="h-8 text-xs" placeholder="Link URL" />
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Third Button (optional)</p>
        <div className="space-y-1.5">
          <Input value={block.data.tertiaryButton?.label ?? ""} onChange={(e) => updateButtonField("tertiaryButton", "label", e.target.value)} className="h-8 text-xs" placeholder="Label, e.g. Call Us" />
          <Input value={block.data.tertiaryButton?.url ?? ""} onChange={(e) => updateButtonField("tertiaryButton", "url", e.target.value)} className="h-8 text-xs" placeholder="Link URL, e.g. tel:+6512345678" />
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Button colors are in the Style tab.
        </p>
      </div>

      {block.templateVariant === "page-banner" && (
        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">Show breadcrumb</Label>
              <p className="text-[10px] text-muted-foreground">Built automatically from the page address</p>
            </div>
            <Switch checked={block.data.showBreadcrumb !== false} onCheckedChange={(val) => update("showBreadcrumb", val)} />
          </div>
          {block.data.showBreadcrumb !== false && (
            <TextField label="First link text" value={block.data.homeLabel} onChange={(val) => update("homeLabel", val || undefined)}
              placeholder="Home" hint="Empty = Home, in the page's language" />
          )}
        </div>
      )}

      {specCard && (
        <div className="pt-2 border-t space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Side photo</p>
          <p className="text-[10px] text-muted-foreground">A framed photo beside the headline, shown instead of the side card below. Leave empty to show the card.</p>
          <MediaPickerInput compact value={side?.imageUrl ?? ""} onChange={(url) => setSide(url ? { imageUrl: url } : null)}
            focus={side?.imageFocus} onFocusChange={(f) => side && setSide({ imageFocus: f })} />
          {side?.imageUrl && (
            <>
              <TextField label="Photo description (for search engines)" value={side.alt} onChange={(v) => setSide({ alt: v })} />
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={side.imageFit === "full"} onChange={(e) => setSide({ imageFit: e.target.checked ? "full" : undefined })} />
                Show the whole image (for banners with text, no cropping)
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={side.badgeSize === "sm"} onChange={(e) => setSide({ badgeSize: e.target.checked ? "sm" : undefined })} />
                Small badges inside the photo corners
              </label>
              <ItemsEditor title="Badges on the photo (up to 4)" max={4} items={side.badges} onChange={(v) => setSide({ badges: v })}
                make={() => ({ title: "Admission", text: "Open now", position: "top-right" as const })} itemLabel={(it) => it.title}
                render={(it, set) => (
                  <div className="space-y-1">
                    <Input value={it.title} onChange={(e) => set({ title: e.target.value })} className="h-7 text-xs" placeholder="Title" />
                    <Input value={it.text ?? ""} onChange={(e) => set({ text: e.target.value })} className="h-7 text-xs" placeholder="Small text" />
                    <Input value={it.link ?? ""} onChange={(e) => set({ link: e.target.value || undefined })} className="h-7 text-xs" placeholder="Link (optional)" />
                    <div className="flex gap-2 items-center">
                      <select value={it.position ?? "top-right"} onChange={(e) => set({ position: e.target.value as "top-right" | "top-left" | "bottom-right" | "bottom-left" })} className="h-7 text-xs rounded-md border bg-background px-1 flex-1">
                        <option value="top-right">Top right</option><option value="top-left">Top left</option>
                        <option value="bottom-right">Bottom right</option><option value="bottom-left">Bottom left</option>
                      </select>
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!it.stars} onChange={(e) => set({ stars: e.target.checked || undefined })} /> Stars</label>
                    </div>
                  </div>
                )} />
            </>
          )}
        </div>
      )}

      {specCard && !side?.imageUrl && (
        <div className="pt-2 border-t space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Side card</p>
          <TextField label="Card label" value={card.label} onChange={(v) => setCard({ label: v })} placeholder="Featured package" />
          <TextField label="Card title" value={card.title} onChange={(v) => setCard({ title: v })} />
          <MetersEditor value={card.meters} onChange={(v) => setCard({ meters: v })} />
          <ItemsEditor title="Card stats (up to 3)" max={3} items={card.stats} onChange={(v) => setCard({ stats: v })}
            make={() => ({ value: "10 yr", label: "warranty" })} itemLabel={(it) => `${it.value} ${it.label}`}
            render={(it, set) => (
              <div className="flex gap-1">
                <Input value={it.value} onChange={(e) => set({ value: e.target.value })} className="h-7 text-xs w-20" placeholder="Value" />
                <Input value={it.label} onChange={(e) => set({ label: e.target.value })} className="h-7 text-xs flex-1" placeholder="Label" />
              </div>
            )} />
        </div>
      )}

      {specCard && (
        <div className="pt-2 border-t space-y-3">
          <ItemsEditor title="Stat boxes (under buttons)" items={block.data.statRow} onChange={(v) => update("statRow", v)}
            make={() => ({ value: "24/7", label: "Enquiries" })} itemLabel={(it) => `${it.value} ${it.label}`}
            render={(it, set) => (
              <div className="flex gap-1">
                <Input value={it.value} onChange={(e) => set({ value: e.target.value })} className="h-7 text-xs w-20" placeholder="Value" />
                <Input value={it.label} onChange={(e) => set({ label: e.target.value })} className="h-7 text-xs flex-1" placeholder="Label" />
              </div>
            )} />
          <ItemsEditor title="Highlight chips (e.g. 1000+ Jobs Completed)" items={block.data.chipRow} onChange={(v) => update("chipRow", v)}
            make={() => ({ icon: "BadgeCheck", text: "Licensed & Insured" })} itemLabel={(it) => it.text}
            render={(it, set) => (
              <div className="flex gap-1 items-center">
                <IconPicker value={it.icon ?? ""} onChange={(v) => set({ icon: v || undefined })} />
                <Input value={it.text} onChange={(e) => set({ text: e.target.value })} className="h-7 text-xs flex-1" placeholder="Chip text" />
              </div>
            )} />
          <p className="text-[10px] text-muted-foreground">Chip size and border: Style tab.</p>
        </div>
      )}

      {specCard && (
        <div className="pt-2 border-t">
          <ItemsEditor title="Link strip (bottom)" items={block.data.strip} onChange={(v) => update("strip", v)}
            make={() => ({ title: "Service", subtitle: "", url: "/services" })} itemLabel={(it) => it.title}
            render={(it, set) => (
              <div className="space-y-1">
                <Input value={it.title} onChange={(e) => set({ title: e.target.value })} className="h-7 text-xs" placeholder="Title" />
                <Input value={it.subtitle ?? ""} onChange={(e) => set({ subtitle: e.target.value })} className="h-7 text-xs" placeholder="Small text" />
                <Input value={it.url ?? ""} onChange={(e) => set({ url: e.target.value })} className="h-7 text-xs" placeholder="Link, e.g. /services/car-tint" />
              </div>
            )} />
        </div>
      )}

      {showcase && (
        <div className="pt-2 border-t">
          <ShowcaseColorsEditor value={block.data.colors} onChange={(v) => update("colors", v)} />
          <p className="text-[10px] text-muted-foreground mt-1">Photo darkness: Style tab, Overlay Opacity.</p>
        </div>
      )}

    </div>
  );
}

export function HeroStyleSettings({ block }: { block: HeroBlockProps }) {
  const { updateBlock } = useBuilderStore();

  const update = (field: string, value: unknown) => {
    updateBlock(block.id, { data: { ...block.data, [field]: value } });
  };

  // 111 saved heroes have no typography object; reading it unguarded crashed this tab.
  const typo = block.data.typography ?? { titleSize: "5xl", titleColor: "", subtitleColor: "", descColor: "" };
  const updateTypo = (field: string, value: string) => {
    updateBlock(block.id, { data: { ...block.data, typography: { ...typo, [field]: value } } });
  };
  const variant = block.templateVariant ?? "";
  const showcase = variant === "spec-card" || variant === "page-banner";
  // Corporate and the showcase designs draw their text in fixed colours.
  const typoColorsApply = !["corporate", "spec-card", "page-banner"].includes(variant);

  const updateButton = (btn: "primaryButton" | "secondaryButton" | "tertiaryButton", field: string, value: string) => {
    const existing = block.data[btn] ?? { label: "", url: "", variant: "primary" };
    updateBlock(block.id, { data: { ...block.data, [btn]: { ...existing, [field]: value } } });
  };

  const layoutApplies = !["centered-bold", "corporate", "spec-card", "page-banner"].includes(block.templateVariant ?? "");
  const ALIGN = [
    { v: "left", icon: AlignLeft, label: "Left" },
    { v: "centered", icon: AlignCenter, label: "Center" },
    { v: "right", icon: AlignRight, label: "Right" },
    { v: "split", icon: Columns2, label: "Split" },
  ] as const;

  return (
    <div className="space-y-4">
      {layoutApplies && (
        <div className="space-y-1.5">
          <Label className="text-xs">Align</Label>
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
            {ALIGN.map(({ v, icon: Icon, label }) => (
              <button key={v} type="button" title={label} aria-label={label} onClick={() => update("layout", v)}
                className={cn("flex flex-col items-center gap-0.5 rounded-md py-1.5 text-[10px] transition-colors",
                  (block.data.layout ?? "left") === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {variant === "spec-card" && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Spec Card look</p>
          <div>
            <Label className="text-[10px] text-muted-foreground">Badge look</Label>
            <select value={block.data.badgeStyle ?? "pill"} onChange={(e) => update("badgeStyle", e.target.value === "pill" ? undefined : e.target.value)} className="w-full h-8 text-xs mt-0.5 rounded-md border bg-background px-2">
              <option value="pill">Rounded badge</option>
              <option value="text">Plain coloured text</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Faint grid lines on the photo</Label>
            <Switch checked={!!block.data.gridTexture} onCheckedChange={(val) => update("gridTexture", val || undefined)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Logos and rating above the buttons</Label>
            <Switch checked={!!block.data.trustFirst} onCheckedChange={(val) => update("trustFirst", val || undefined)} />
          </div>
        </div>
      )}

      {showcase && block.data.titleAccent && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">Accent words on the same line</Label>
          <Switch checked={!!block.data.accentInline} onCheckedChange={(val) => update("accentInline", val || undefined)} />
        </div>
      )}

      {(variant === "fullscreen-overlay" || variant === "split-image-right") && (
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xs">Shorter banner</Label>
            <p className="text-[10px] text-muted-foreground">For inner pages: less height, same look.</p>
          </div>
          <Switch checked={!!block.data.compact} onCheckedChange={(val) => update("compact", val || undefined)} />
        </div>
      )}

      {!showcase && <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Badge Style</p>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Background" value={block.data.badgeBgColor ?? "#ffffff"} onChange={(v) => update("badgeBgColor", v)} />
          <ColorField label="Text Color" value={block.data.badgeTextColor ?? "#000000"} onChange={(v) => update("badgeTextColor", v)} />
        </div>
        {(block.data.badgeBgColor || block.data.badgeTextColor) && (
          <button onClick={() => { update("badgeBgColor", ""); update("badgeTextColor", ""); }} className="text-[11px] text-muted-foreground underline">Use theme default instead</button>
        )}
      </div>}

      <div className="pt-1 border-t space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Section Overlay</p>
        <p className="text-[10px] text-muted-foreground">Tints the whole section — covers the background image set in the Layout tab. Set a color to apply it.</p>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Overlay Color" value={block.data.overlayColor ?? "#000000"} onChange={(v) => update("overlayColor", v)} />
          <ColorField label="Gradient To (optional)" value={block.data.overlayColorTo || block.data.overlayColor || "#000000"} onChange={(v) => update("overlayColorTo", v)} />
        </div>
        {block.data.overlayColorTo && (
          <button onClick={() => update("overlayColorTo", "")} className="text-[11px] text-muted-foreground underline">Clear gradient</button>
        )}
        <FieldGroup label={`Overlay Opacity (${Math.round((block.data.overlayOpacity ?? 0.55) * 100)}%)`}>
          <Input type="range" min={0} max={1} step={0.05} value={block.data.overlayOpacity ?? 0.55}
            onChange={(e) => update("overlayOpacity", parseFloat(e.target.value))} className="h-8" />
        </FieldGroup>
        {block.templateVariant === "fullscreen-overlay" && (
          <>
            <FieldGroup label="Overlay shape">
              <select value={block.data.overlayStyle ?? "diagonal"} onChange={(e) => update("overlayStyle", e.target.value === "diagonal" ? undefined : e.target.value)} className="w-full h-8 text-xs rounded-md border bg-background px-2">
                <option value="diagonal">Even tint (diagonal)</option>
                <option value="left-fade">Dark on the left, fading to clear</option>
              </select>
            </FieldGroup>
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label className="text-xs">Overlay covers the whole section</Label>
                <p className="text-[10px] text-muted-foreground">Tints the padding too, so no darker box shows around the text.</p>
              </div>
              <Switch checked={!!block.data.overlayFullBleed} onCheckedChange={(v) => update("overlayFullBleed", v || undefined)} />
            </div>
          </>
        )}
      </div>

      <div className="pt-1 border-t">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Primary Button Color</p>
        {block.data.primaryButton?.label && <ButtonLook value={block.data.primaryButton.variant} onChange={(val) => updateButton("primaryButton", "variant", val)} showcase={showcase} />}
        <div className="grid grid-cols-2 gap-1.5">
          <ColorField label="Background" value={block.data.primaryButton?.bgColor || "#ffffff"} onChange={(v) => updateButton("primaryButton", "bgColor", v)} />
          <ColorField label="Text" value={block.data.primaryButton?.textColor || "#000000"} onChange={(v) => updateButton("primaryButton", "textColor", v)} />
        </div>
        {block.data.primaryButton?.bgColor && (
          <button onClick={() => { updateButton("primaryButton", "bgColor", ""); updateButton("primaryButton", "textColor", ""); }} className="text-[11px] text-muted-foreground underline mt-1">Use theme default instead</button>
        )}
      </div>

      <div className="pt-1 border-t">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Secondary Button Color</p>
        {!showcase && block.data.secondaryButton?.label && <ButtonLook value={block.data.secondaryButton.variant ?? "outline"} onChange={(val) => updateButton("secondaryButton", "variant", val)} />}
        <div className="grid grid-cols-2 gap-1.5">
          <ColorField label="Background" value={block.data.secondaryButton?.bgColor || "#00000000"} onChange={(v) => updateButton("secondaryButton", "bgColor", v)} />
          <ColorField label="Text" value={block.data.secondaryButton?.textColor || "#ffffff"} onChange={(v) => updateButton("secondaryButton", "textColor", v)} />
        </div>
        {block.data.secondaryButton?.bgColor && (
          <button onClick={() => { updateButton("secondaryButton", "bgColor", ""); updateButton("secondaryButton", "textColor", ""); }} className="text-[11px] text-muted-foreground underline mt-1">Use theme default instead</button>
        )}
      </div>

      {block.data.tertiaryButton?.label && (
        <div className="pt-1 border-t">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Third Button Color</p>
          {!showcase && <ButtonLook value={block.data.tertiaryButton?.variant ?? "outline"} onChange={(val) => updateButton("tertiaryButton", "variant", val)} />}
          <div className="grid grid-cols-2 gap-1.5">
            <ColorField label="Background" value={block.data.tertiaryButton?.bgColor || "#25D366"} onChange={(v) => updateButton("tertiaryButton", "bgColor", v)} />
            <ColorField label="Text" value={block.data.tertiaryButton?.textColor || "#ffffff"} onChange={(v) => updateButton("tertiaryButton", "textColor", v)} />
          </div>
          {block.data.tertiaryButton?.bgColor && (
            <button onClick={() => { updateButton("tertiaryButton", "bgColor", ""); updateButton("tertiaryButton", "textColor", ""); }} className="text-[11px] text-muted-foreground underline mt-1">Use theme default instead</button>
          )}
        </div>
      )}

      {block.templateVariant === "spec-card" && (
        <div className="pt-1 border-t space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Highlight chips</p>
          <div>
            <Label className="text-[10px] text-muted-foreground">Text size</Label>
            <Select value={block.data.chipSize ?? "sm"} onValueChange={(v) => update("chipSize", v)}>
              <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {([["sm", "Small"], ["md", "Medium"], ["lg", "Large"]] as const).map(([v, l]) => <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Rounded border</Label>
            <Switch checked={block.data.chipBorder !== false} onCheckedChange={(v) => update("chipBorder", v)} />
          </div>
        </div>
      )}

      <div className="pt-1 border-t">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Typography</p>
        <div className="space-y-2">
          {variant !== "page-banner" && (
            <div>
              <Label className="text-[10px] text-muted-foreground">Title Size</Label>
              <Select value={typo.titleSize ?? "5xl"} onValueChange={(val) => updateTypo("titleSize", val)}>
                <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["3xl","4xl","5xl","6xl","7xl"].map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                </SelectContent>
              </Select>
              {variant === "spec-card" && <p className="text-[10px] text-muted-foreground mt-1">This design shows 4xl and 5xl as chosen; every other size is extra large.</p>}
            </div>
          )}
          {typoColorsApply ? (
            <>
              <ColorField label="Title Color" value={typo.titleColor ?? ""} onChange={(val) => updateTypo("titleColor", val)} />
              <ColorField label="Subtitle Color" value={typo.subtitleColor ?? ""} onChange={(val) => updateTypo("subtitleColor", val)} />
              <ColorField label="Description Color" value={typo.descColor ?? ""} onChange={(val) => updateTypo("descColor", val)} />
            </>
          ) : (
            <p className="text-[10px] text-muted-foreground">This design sets its own text colours (light on the dark photo).</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <ColorPicker value={value} onChange={onChange} className="h-7 mt-0.5" />
    </div>
  );
}

/** Button look: Filled / Soft / Outline (the "variant" every hero button has
 *  carried; it had no control). Showcase designs only tell outline apart. */
function ButtonLook({ value, onChange, showcase }: { value?: string; onChange: (v: string) => void; showcase?: boolean }) {
  return (
    <div className="mb-1.5">
      <Label className="text-[10px] text-muted-foreground">Look</Label>
      <select value={showcase && value !== "outline" ? "primary" : (value ?? "primary")} onChange={(e) => onChange(e.target.value)} className="w-full h-7 text-xs mt-0.5 rounded-md border bg-background px-2">
        <option value="primary">Filled</option>
        {!showcase && <option value="secondary">Soft</option>}
        <option value="outline">Outline</option>
      </select>
    </div>
  );
}

const RATING_STYLES = [
  { v: "stars", label: "Stars + score" },
  { v: "pill", label: "Pill" },
  { v: "google", label: "Google badge" },
  { v: "big", label: "Big score" },
] as const;

/** Trust signals under the hero buttons: countries, logos, rating. */
function HeroTrustFields({ data, update }: { data: HeroBlockProps["data"]; update: (field: string, value: unknown) => void }) {
  const rating = data.rating ?? { value: 4.9, count: "", label: "", style: "stars" as const };
  const setRating = (patch: Partial<typeof rating>) => update("rating", { ...rating, ...patch });
  const toggle = (label: string, field: "showCountries" | "showTrustLogos" | "showRating") => (
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <Switch checked={!!data[field]} onCheckedChange={(v) => update(field, v)} />
    </div>
  );
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Trust signals</p>

      {toggle("Show countries served", "showCountries")}
      {data.showCountries && (
        <div className="space-y-2 pl-1">
          <CountryMultiPicker value={data.countries ?? []} onChange={(v) => update("countries", v)} />
          <Input value={data.countriesLabel ?? ""} onChange={(e) => update("countriesLabel", e.target.value)} className="h-8 text-xs" placeholder="Label, e.g. Serving businesses in" />
        </div>
      )}

      {toggle("Show logos (partners, certifications)", "showTrustLogos")}
      {data.showTrustLogos && (
        <div className="space-y-2 pl-1">
          <MultiImagePicker value={data.trustLogos ?? []} onChange={(v) => update("trustLogos", v)} />
          <Input value={data.trustLogosLabel ?? ""} onChange={(e) => update("trustLogosLabel", e.target.value)} className="h-8 text-xs" placeholder="Label, e.g. Certified by" />
          <div className="grid grid-cols-2 gap-1">
            {([["plain", "Plain logos"], ["cards", "White logo cards"]] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => update("trustLogosStyle", v)}
                className={cn("rounded-md border px-2 py-1.5 text-[11px]", (data.trustLogosStyle ?? "plain") === v ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted")}>{l}</button>
            ))}
          </div>
        </div>
      )}

      {toggle("Show star rating", "showRating")}
      {data.showRating && (
        <div className="space-y-2 pl-1">
          <div className="grid grid-cols-2 gap-1">
            {RATING_STYLES.map((r) => (
              <button key={r.v} type="button" onClick={() => setRating({ style: r.v })}
                className={cn("rounded-md border px-2 py-1.5 text-[11px]", (rating.style ?? "stars") === r.v ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted")}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" min={1} max={5} step={0.1} value={rating.value} onChange={(e) => setRating({ value: Math.min(5, Math.max(1, Number(e.target.value) || 5)) })} className="h-8 text-xs" placeholder="4.9" />
            <Input value={rating.count ?? ""} onChange={(e) => setRating({ count: e.target.value })} className="h-8 text-xs" placeholder="Reviews, e.g. 120+" />
          </div>
          <Input value={rating.label ?? ""} onChange={(e) => setRating({ label: e.target.value })} className="h-8 text-xs" placeholder="Custom text (optional)" />
        </div>
      )}
    </div>
  );
}
