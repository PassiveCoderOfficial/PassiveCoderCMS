"use client";

import React from "react";
import Link from "next/link";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { generateId } from "@/lib/utils";
import { CREDIT_TEXT_MAX, DEFAULT_CREDIT_TEXT, DEFAULT_CREDIT_URL, sanitizeCreditText, sanitizeCreditUrl } from "@/lib/site/footer-credit-shared";
import type { FooterBlockProps, FooterColumn, FooterSocial, FooterColumnLink } from "@/types/cms";
import { UiTextFields } from "./ui-text-fields";

/**
 * The footer block's own settings — never existed until now (2026-09-12,
 * found via a Playwright audit of the footer builder): the
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
  const SOCIAL_PLATFORMS: FooterSocial["platform"][] = ["facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok", "whatsapp", "snapchat", "github"];
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
  // Retail draws only link columns, social icons, copyright, payment image and
  // a note; the logo, tagline, booking / newsletter strips, bottom links and
  // credit belong to the Dark / Light layouts, so they are not offered there.
  const retail = block.data.style === "retail";
  const year = new Date().getFullYear();
  const defaultCopyright = `© ${block.data.copyrightYear !== false ? year : ""} ${block.data.logoText ?? ""}. All rights reserved.`;

  return (
    <div className="space-y-4">
      {block.data.style === "retail" && (
        <div className="space-y-2 rounded-lg border p-2.5 bg-muted/20">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Retail footer</p>
          <div className="space-y-1.5"><Label className="text-xs">Social column heading</Label><Input value={block.data.followTitle ?? ""} onChange={(e) => update("followTitle", e.target.value)} className="h-8 text-xs" placeholder="Follow us" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Payment logos image</Label><MediaPickerInput compact value={block.data.paymentImage ?? ""} onChange={(v) => update("paymentImage", v)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Bottom note (optional)</Label><Input value={block.data.bottomNote ?? ""} onChange={(e) => update("bottomNote", e.target.value)} className="h-8 text-xs" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[10px] text-muted-foreground">Background</Label><ColorPicker value={block.data.backgroundColor ?? ""} onChange={(v) => update("backgroundColor", v || undefined)} /></div>
            <div><Label className="text-[10px] text-muted-foreground">Text</Label><ColorPicker value={block.data.textColor ?? ""} onChange={(v) => update("textColor", v || undefined)} /></div>
          </div>
        </div>
      )}
      {!retail && (<>
      <div className="space-y-1.5">
        <Label className="text-xs">Logo Text</Label>
        <Input value={block.data.logoText ?? ""} onChange={(e) => update("logoText", e.target.value)} className="h-8 text-xs" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Logo Icon (before text)</Label>
        <MediaPickerInput compact value={block.data.logoIconUrl ?? ""} onChange={(v) => update("logoIconUrl", v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Giant wordmark at bottom</Label>
        <Switch checked={!!block.data.wordmark} onCheckedChange={(v) => update("wordmark", v)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Logo Image (optional override)</Label>
        <MediaPickerInput compact value={block.data.logo ?? ""} onChange={(url) => update("logo", url)} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label className="text-xs">Light logo on dark footers</Label>
          <p className="text-[10px] text-muted-foreground">Uses your logo for dark backgrounds (Identity) when the footer is dark</p>
        </div>
        <Switch checked={!!block.data.autoLightLogo} onCheckedChange={(v) => update("autoLightLogo", v || undefined)} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label className="text-xs">White backing behind logo</Label>
          <p className="text-[10px] text-muted-foreground">Keeps a dark logo readable on a dark footer</p>
        </div>
        <Switch checked={!!block.data.logoPlate} onCheckedChange={(v) => update("logoPlate", v || undefined)} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs">Logo height (px, empty = standard)</Label>
        <Input type="number" min={16} max={200} value={block.data.logoHeight ?? ""} onChange={(e) => update("logoHeight", e.target.value ? Number(e.target.value) : undefined)} className="h-8 text-xs w-24" />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Bigger links on phones</Label>
        <Switch checked={!!block.data.largeTapTargets} onCheckedChange={(v) => update("largeTapTargets", v || undefined)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Tagline / Description</Label>
        <Input value={block.data.tagline ?? ""} onChange={(e) => update("tagline", e.target.value)} className="h-8 text-xs" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Small text under the tagline (optional)</Label>
        <Textarea value={block.data.logoCaption ?? ""} onChange={(e) => update("logoCaption", e.target.value || undefined)} className="text-[11px] resize-none min-h-0" rows={2} placeholder="e.g. a registration number" />
      </div>
      </>)}

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
              <Textarea value={col.text ?? ""} onChange={(e) => updateColumn(col.id, { text: e.target.value || undefined })} className="text-[11px] resize-none min-h-0" rows={2} placeholder="Plain text, e.g. address, phone, opening hours (optional)" />
              <div className="pl-2 space-y-1">
                {col.links.map((link) => (
                  <div key={link.id} className="flex items-center gap-1">
                    <Input value={link.label} onChange={(e) => updateColumnLink(col.id, link.id, { label: e.target.value })} className="h-6 text-[11px] flex-1" placeholder="Label" />
                    <Input value={link.url} onChange={(e) => updateColumnLink(col.id, link.id, { url: e.target.value })} className="h-6 text-[11px] flex-1" placeholder="URL" />
                    <Input value={link.lang ?? ""} onChange={(e) => updateColumnLink(col.id, link.id, { lang: e.target.value.trim() || undefined })} className="h-6 text-[11px] w-12" placeholder="lang" title="Language switch code (e.g. bn): opens the current page in that language" />
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
          <div>
            <Label className="text-xs">Show social icons</Label>
            <p className="text-[10px] text-muted-foreground">From Business Profile → Social Media (one list for the whole site)</p>
          </div>
          <Switch checked={!!block.data.showSocials} onCheckedChange={(v) => update("showSocials", v)} />
        </div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold">{block.data.showSocials ? "Fallback links, used only while that list is empty" : "Social Links"} ({socials.length})</Label>
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
        {(socials.length > 0 || block.data.showSocials) && (
          <div className="space-y-1.5 mt-2">
            {!retail && (
              <Input value={block.data.followTitle ?? ""} onChange={(e) => update("followTitle", e.target.value)} className="h-7 text-xs" placeholder="Heading above icons (optional), e.g. Connect" />
            )}
            {!retail && (
              <div className="flex items-center justify-between">
                <Label className="text-xs">Brand colours (white chips)</Label>
                <Switch checked={!!block.data.socialBrandColors} onCheckedChange={(v) => update("socialBrandColors", v)} />
              </div>
            )}
          </div>
        )}
      </div>

      {!retail && (
      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Booking section</Label>
          <Switch checked={!!block.data.showBooking} onCheckedChange={(v) => update("showBooking", v)} />
        </div>
        {block.data.showBooking && (
          <>
            <Input value={block.data.bookingTitle ?? ""} onChange={(e) => update("bookingTitle", e.target.value)} className="h-7 text-xs" placeholder="Book an appointment" />
            <Input value={block.data.bookingText ?? ""} onChange={(e) => update("bookingText", e.target.value)} className="h-7 text-xs" placeholder="Pick a day and time that suits you." />
            <Input value={block.data.bookingLabel ?? ""} onChange={(e) => update("bookingLabel", e.target.value)} className="h-7 text-xs" placeholder="Button label: Book now" />
            <Input value={block.data.bookingUrl ?? ""} onChange={(e) => update("bookingUrl", e.target.value)} className="h-7 text-xs" placeholder="Booking page: /book" />
          </>
        )}
        <div className="flex items-center justify-between">
          <Label className="text-xs">Show Newsletter Signup</Label>
          <Switch checked={!!block.data.showNewsletter} onCheckedChange={(v) => update("showNewsletter", v)} />
        </div>
        {block.data.showNewsletter && (
          <>
            <Input value={block.data.newsletterLabel ?? ""} onChange={(e) => update("newsletterLabel", e.target.value)} className="h-7 text-xs" placeholder="Newsletter title: Get Updates" />
            <Input value={block.data.newsletterPlaceholder ?? ""} onChange={(e) => update("newsletterPlaceholder", e.target.value)} className="h-7 text-xs" placeholder="Email box text: Enter your email" />
            <UiTextFields block={block} title="Newsletter words" open />
          </>
        )}
      </div>
      )}

      <div className="border-t pt-3 space-y-2">
        <Label className="text-xs font-semibold">Copyright</Label>
        <Input value={block.data.copyrightText ?? ""} onChange={(e) => update("copyrightText", e.target.value)} className="h-7 text-xs" placeholder={retail ? "e.g. © {year} Your Shop" : defaultCopyright} />
        <p className="text-[10px] text-muted-foreground">
          {retail ? "Empty = no copyright line. " : "Empty = the line shown in grey. Typing replaces the whole line. "}Write {"{year}"} for the current year.
        </p>
        {!retail && !block.data.copyrightText && (
          <div className="flex items-center justify-between">
            <Label className="text-xs">Show current year automatically</Label>
            <Switch checked={block.data.copyrightYear !== false} onCheckedChange={(v) => update("copyrightYear", v)} />
          </div>
        )}
      </div>

      {retail
        ? <p className="text-[10px] text-muted-foreground border-t pt-3">The Retail layout has no &quot;Powered by&quot; credit line or bottom links.</p>
        : <FooterCreditSettings block={block} />}

      {!retail && (
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
              <Input value={link.lang ?? ""} onChange={(e) => updateBottomLink(link.id, { lang: e.target.value.trim() || undefined })} className="h-7 text-xs w-14" placeholder="lang" title="Language switch code (e.g. bn): opens the current page in that language" />
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeBottomLink(link.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">e.g. Privacy Policy, Terms &amp; Conditions, shown beside the copyright line.</p>
      </div>
      )}
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
            <SelectItem value="retail" className="text-xs">Retail</SelectItem>
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

/** "Footer credit": Pro/Biz/Custom may hide or change it; Basic sees it locked. */
function FooterCreditSettings({ block }: { block: FooterBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const [policy, setPolicy] = React.useState<{ editable: boolean; partner?: boolean; base?: { show: boolean; text: string; url: string } } | null>(null);
  React.useEffect(() => {
    let live = true;
    fetch("/api/site/footer-credit").then((r) => (r.ok ? r.json() : { editable: false })).then((j) => live && setPolicy(j), () => live && setPolicy({ editable: false }));
    return () => { live = false; };
  }, []);
  const editable = policy ? policy.editable : null;
  const baseText = policy?.base?.text ?? DEFAULT_CREDIT_TEXT;
  const baseUrl = policy?.base?.url ?? DEFAULT_CREDIT_URL;
  const credit = block.data.credit ?? {};
  const [urlDraft, setUrlDraft] = React.useState(credit.url ?? "");
  const set = (patch: Partial<NonNullable<FooterBlockProps["data"]["credit"]>>) =>
    updateBlock(block.id, { data: { ...block.data, credit: { ...credit, ...patch } } });
  const locked = editable !== true;
  const urlBad = !!urlDraft.trim() && !sanitizeCreditUrl(urlDraft);
  return (
    <div className="border-t pt-3 space-y-2">
      <Label className="text-xs font-semibold">Footer credit</Label>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show &quot;Powered by&quot; credit</Label>
        <Switch disabled={locked} checked={locked ? policy?.base?.show !== false : credit.show !== false} onCheckedChange={(v) => set({ show: v })} />
      </div>
      <Input disabled={locked || credit.show === false} maxLength={CREDIT_TEXT_MAX} value={locked ? baseText : credit.text ?? ""}
        onChange={(e) => set({ text: sanitizeCreditText(e.target.value) || undefined })} className="h-7 text-xs" placeholder={baseText} />
      <Input disabled={locked || credit.show === false} value={locked ? baseUrl : urlDraft}
        onChange={(e) => { setUrlDraft(e.target.value); const u = sanitizeCreditUrl(e.target.value); if (u || !e.target.value.trim()) set({ url: u || undefined }); }}
        className="h-7 text-xs" placeholder={baseUrl} />
      {urlBad && <p className="text-[10px] text-destructive">Use a full link starting with http:// or https://</p>}
      {editable === false && policy?.partner && (
        <p className="text-[10px] text-muted-foreground">The footer credit is set by your web partner.</p>
      )}
      {editable === false && !policy?.partner && (
        <p className="text-[10px] text-muted-foreground">
          Upgrade to Pro to remove or change the credit. <Link href="/dashboard/subscription" className="underline">See plans</Link>
        </p>
      )}
    </div>
  );
}
