"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Star } from "lucide-react";
import { generateId, cn } from "@/lib/utils";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import type { TestimonialsBlockProps } from "@/types/cms";
import { Switch } from "@/components/ui/switch";
import { renderedVariant } from "./rendered-variant";

type Item = TestimonialsBlockProps["data"]["items"][number];
type ReviewForm = NonNullable<TestimonialsBlockProps["data"]["reviewForm"]>;

/** Designs that print the subtitle (Quote Cards as the small line above the title). */
const SUBTITLE_VARIANTS = ["quote-cards", "stars-quotes", "photo-cards", "review-cards"];
/** Designs that print each reviewer's company / role. */
const NO_COMPANY = ["transformation-cards", "stars-quotes", "photo-cards", "review-cards"];
const NO_ROLE = ["photo-cards", "review-cards"];

/** Testimonials had no settings panel at all — hit "No settings for this
 *  block type" every time. Found in the full block-editor audit. */
export function TestimonialsSettings({ block }: { block: TestimonialsBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  const items = block.data.items ?? [];

  const addItem = () => {
    const item: Item = { id: generateId(), name: "Customer Name", content: "What they said about your business." };
    update("items", [...items, item]);
  };
  const updateItem = (id: string, f: keyof Item, v: unknown) => {
    update("items", items.map((i) => (i.id === id ? { ...i, [f]: v } : i)));
  };
  const removeItem = (id: string) => update("items", items.filter((i) => i.id !== id));
  const [groups, setGroups] = React.useState<{ id: string; name: string }[]>([]);
  React.useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) =>
      import("@/lib/tenant/client").then(({ getClientTenantId }) => getClientTenantId().then((tid) => {
        if (!tid) return;
        createClient().from("testimonial_groups").select("id, name").eq("tenant_id", tid).order("sort_order").then(({ data }) => setGroups(data ?? []));
      })));
  }, []);
  const fromGroup = block.data.source === "group";
  const rs = block.data.ratingSummary ?? {};
  const setRs = (patch: Partial<NonNullable<TestimonialsBlockProps["data"]["ratingSummary"]>>) => update("ratingSummary", { ...rs, ...patch });
  const sc = block.data.summaryCard ?? {};
  const setSc = (patch: Partial<NonNullable<TestimonialsBlockProps["data"]["summaryCard"]>>) => update("summaryCard", { ...sc, ...patch });

  // Unknown saved variants draw the default design.
  const v = renderedVariant("testimonials", block.templateVariant);
  const formOn = fromGroup && !!block.data.reviewForm?.enabled;
  const centred = v === "formal-cards" && block.data.headingAlign === "center";
  const subtitleApplies = SUBTITLE_VARIANTS.includes(v) || centred || formOn;
  const eyebrowApplies = centred || formOn;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border p-2.5 space-y-2 bg-muted/20">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Summary card above the reviews</Label>
          <Switch checked={!!sc.enabled} onCheckedChange={(v) => setSc({ enabled: v })} />
        </div>
        {sc.enabled && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Show 5 stars</Label>
              <Switch checked={sc.stars !== false} onCheckedChange={(v) => setSc({ stars: v })} />
            </div>
            <Input value={sc.title ?? ""} onChange={(e) => setSc({ title: e.target.value })} className="h-8 text-xs" placeholder="Headline, e.g. Rated highly by our customers" />
            <Input value={sc.text ?? ""} onChange={(e) => setSc({ text: e.target.value })} className="h-8 text-xs" placeholder="Small line under it" />
            <div className="flex gap-1">
              <Input value={sc.buttonLabel ?? ""} onChange={(e) => setSc({ buttonLabel: e.target.value })} className="h-8 text-xs flex-1" placeholder="Button text" />
              <Input value={sc.buttonUrl ?? ""} onChange={(e) => setSc({ buttonUrl: e.target.value })} className="h-8 text-xs flex-1" placeholder="Button link" />
            </div>
            <p className="text-[10px] text-muted-foreground">Typed text only; no rating number is calculated.</p>
          </>
        )}
        {v === "formal-cards" && (
          <div className="flex items-center justify-between">
            <Label className="text-xs">Centred heading with label</Label>
            <Switch checked={block.data.headingAlign === "center"} onCheckedChange={(v) => update("headingAlign", v ? "center" : undefined)} />
          </div>
        )}
      </div>
      <div className="rounded-lg border p-2.5 space-y-2 bg-muted/20">
        <Label className="text-xs">Where the reviews come from</Label>
        <select value={block.data.source ?? "inline"} onChange={(e) => update("source", e.target.value)} className="w-full h-8 text-xs rounded-md border bg-background px-2">
          <option value="inline">Typed here, in this block</option>
          <option value="group">A group in Testimonials (manual entries + featured product reviews)</option>
        </select>
        {fromGroup && (
          <>
            <select value={block.data.source_group_id ?? ""} onChange={(e) => update("source_group_id", e.target.value)} className="w-full h-8 text-xs rounded-md border bg-background px-2">
              <option value="">Choose a group…</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <Input type="number" min={1} max={30} value={block.data.limit ?? 12} onChange={(e) => update("limit", Number(e.target.value) || 12)} className="h-8 text-xs" />
            <p className="text-[10px] text-muted-foreground">Manage entries in Dashboard → Testimonials (names, quotes, photos and stars are edited there). Product reviews appear here after you click &quot;Show on homepage&quot; in Ecommerce → Reviews.</p>
          </>
        )}
      </div>
      {fromGroup && (() => {
        const rf: ReviewForm = block.data.reviewForm ?? {};
        const setRf = (patch: Partial<ReviewForm>) => update("reviewForm", { ...rf, ...patch });
        const word = (k: keyof ReviewForm, placeholder: string) => (
          <Input value={(rf[k] as string | undefined) ?? ""} onChange={(e) => setRf({ [k]: e.target.value || undefined })} className="h-7 text-xs" placeholder={placeholder} />
        );
        return (
          <div className="rounded-lg border p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Visitors can post reviews</Label>
                <p className="text-[10px] text-muted-foreground">Star rating form + score summary above the reviews.</p>
              </div>
              <Switch checked={!!rf.enabled} onCheckedChange={(v) => setRf({ enabled: v })} />
            </div>
            {rf.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <Label className="text-[11px]">Publish instantly (off: approve in Testimonials)</Label>
                  <Switch checked={!!rf.autoPublish} onCheckedChange={(v) => setRf({ autoPublish: v })} />
                </div>
                <Input value={rf.title ?? ""} onChange={(e) => setRf({ title: e.target.value })} className="h-8 text-xs" placeholder="Form title (default: Give Your Rating)" />
                <Input value={rf.text ?? ""} onChange={(e) => setRf({ text: e.target.value })} className="h-8 text-xs" placeholder="Short text under the title" />
                <Input value={rf.buttonLabel ?? ""} onChange={(e) => setRf({ buttonLabel: e.target.value })} className="h-8 text-xs" placeholder="Button (default: Submit Review)" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={rf.ctaLabel ?? ""} onChange={(e) => setRf({ ctaLabel: e.target.value })} className="h-8 text-xs" placeholder="Score card button" />
                  <Input value={rf.ctaUrl ?? ""} onChange={(e) => setRf({ ctaUrl: e.target.value })} className="h-8 text-xs" placeholder="Link, e.g. /get-a-quote" />
                </div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground pt-1">Form wording (empty = the text shown)</p>
                {word("promptText", "Please select a rating")}
                {word("namePlaceholder", "Your Name")}
                {word("placePlaceholder", "Area (optional), e.g. Tampines")}
                {word("textPlaceholder", "Write your review...")}
                {word("photosText", "Add up to 5 photos of the work (optional).")}
                {word("thanksText", "Thank you! Your review has been added.")}
                {word("pendingText", "Thank you! Your review will appear once approved.")}
                {word("countLabel", "{count} customer reviews")}
                <p className="text-[10px] text-muted-foreground">{"{count}"} in the score card line becomes the number of reviews.</p>
              </>
            )}
          </div>
        );
      })()}
      {(v === "photo-cards" || v === "review-cards") && (
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[10px] text-muted-foreground">Card colour</Label><Input value={block.data.cardColor ?? ""} onChange={(e) => updateBlock(block.id, { data: { ...block.data, cardColor: e.target.value || undefined } })} className="h-7 text-xs" placeholder="#DDC69E" /></div>
          <div><Label className="text-[10px] text-muted-foreground">Star colour</Label><Input value={block.data.starColor ?? ""} onChange={(e) => updateBlock(block.id, { data: { ...block.data, starColor: e.target.value || undefined } })} className="h-7 text-xs" placeholder="#e00000" /></div>
        </div>
      )}
      <div className="rounded-lg border p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Google rating card</Label>
          <Switch checked={!!rs.enabled} onCheckedChange={(v) => setRs({ enabled: v })} />
        </div>
        {rs.enabled && (
          <>
            <p className="text-[10px] text-muted-foreground">Copy these from your Google Business profile. Use your real rating and count.</p>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" min={1} max={5} step={0.1} value={rs.value ?? ""} onChange={(e) => setRs({ value: e.target.value ? Math.min(5, Math.max(1, Number(e.target.value))) : undefined })} className="h-8 text-xs" placeholder="Rating, e.g. 4.8" />
              <Input value={rs.count ?? ""} onChange={(e) => setRs({ count: e.target.value || undefined })} className="h-8 text-xs" placeholder="Reviews, e.g. 126" />
            </div>
            <Input value={rs.url ?? ""} onChange={(e) => setRs({ url: e.target.value || undefined })} className="h-8 text-xs" placeholder="Link to your Google reviews" />
            <Input value={rs.label ?? ""} onChange={(e) => setRs({ label: e.target.value || undefined })} className="h-8 text-xs" placeholder="Label (default: Google Reviews)" />
            {rs.count && (
              <Input value={rs.countLabel ?? ""} onChange={(e) => setRs({ countLabel: e.target.value || undefined })} className="h-8 text-xs" placeholder="Count line (default: Based on {count} reviews)" />
            )}
            <select value={rs.position ?? "bottom"} onChange={(e) => setRs({ position: e.target.value === "top" ? "top" : undefined })} className="w-full h-8 text-xs rounded-md border bg-background px-2">
              <option value="bottom">Below the reviews</option>
              <option value="top">Above the reviews</option>
            </select>
          </>
        )}
      </div>
      <div className="rounded-lg border p-2.5 space-y-1.5">
        <Label className="text-xs">Load more button</Label>
        <Input type="number" min={0} max={50} value={block.data.initialCount ?? 0} onChange={(e) => update("initialCount", Math.max(0, Number(e.target.value) || 0))} className="h-8 text-xs" />
        <p className="text-[10px] text-muted-foreground">Show this many reviews first, then a button reveals more. 0 shows all.</p>
        {(block.data.initialCount ?? 0) > 0 && (
          <Input value={block.data.loadMoreLabel ?? ""} onChange={(e) => update("loadMoreLabel", e.target.value)} className="h-8 text-xs" placeholder="Load more reviews" />
        )}
      </div>
      {eyebrowApplies && (
        <div>
          <Label className="text-xs">Small label above the title</Label>
          <Input value={block.data.eyebrow ?? ""} onChange={(e) => update("eyebrow", e.target.value)} className="h-8 text-xs mt-1" />
        </div>
      )}
      <div>
        <Label className="text-xs">Title</Label>
        <Input value={block.data.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" />
      </div>
      {subtitleApplies && (
        <div>
          <Label className="text-xs">{v === "quote-cards" && !formOn ? "Small line above the title" : "Subtitle"}</Label>
          {/* Quote Cards print "What people say" until a subtitle is saved, so the field shows it; clear it to hide the line. */}
          <Input value={block.data.subtitle ?? (v === "quote-cards" && !formOn ? "What people say" : "")} onChange={(e) => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" />
        </div>
      )}
      {!v && (
        <div>
          <Label className="text-xs">Layout</Label>
          <Select value={block.data.layout} onValueChange={(v) => update("layout", v)}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["grid", "carousel", "masonry"].map((l) => (
                <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {!v && (
        <div>
          <Label className="text-xs">Text when there are no reviews</Label>
          <Input value={block.data.emptyText ?? ""} onChange={(e) => update("emptyText", e.target.value || undefined)} className="h-8 text-xs mt-1" placeholder="No testimonials added yet." />
        </div>
      )}
      {!fromGroup && (
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Testimonials</p>
            <Button size="sm" variant="outline" onClick={addItem} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
                <div className="flex items-center gap-1">
                  <Input value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} className="h-7 text-xs flex-1" placeholder="Name" />
                  <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)} className="h-7 w-7 shrink-0 text-destructive hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                {(!NO_ROLE.includes(v) || !NO_COMPANY.includes(v)) && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {!NO_ROLE.includes(v) && <Input value={item.role ?? ""} onChange={(e) => updateItem(item.id, "role", e.target.value)} className="h-7 text-xs" placeholder="Role" />}
                    {!NO_COMPANY.includes(v) && <Input value={item.company ?? ""} onChange={(e) => updateItem(item.id, "company", e.target.value)} className="h-7 text-xs" placeholder="Company" />}
                  </div>
                )}
                <MediaPickerInput compact value={item.avatar ?? ""} onChange={(url) => updateItem(item.id, "avatar", url || undefined)} placeholder="Photo (optional)" />
                {v === "photo-cards" && (
                  <Input value={item.title ?? ""} onChange={(e) => updateItem(item.id, "title", e.target.value)} className="h-7 text-xs" placeholder="Headline (optional, e.g. Unmatched Longevity)" />
                )}
                {v === "review-cards" && (
                  <>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Input value={item.product ?? ""} onChange={(e) => updateItem(item.id, "product", e.target.value)} className="h-7 text-xs" placeholder="Product reviewed" />
                      <Input value={item.productUrl ?? ""} onChange={(e) => updateItem(item.id, "productUrl", e.target.value)} className="h-7 text-xs" placeholder="Product link" />
                    </div>
                    <label className="flex items-center gap-1.5 text-[11px]"><input type="checkbox" checked={item.verified !== false} onChange={(e) => updateItem(item.id, "verified", e.target.checked)} /> Verified buyer tick</label>
                  </>
                )}
                <Textarea value={item.content} onChange={(e) => updateItem(item.id, "content", e.target.value)} className="text-xs min-h-16" placeholder="What they said" />
                <div className="flex items-center gap-1 pt-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => updateItem(item.id, "rating", item.rating === n ? undefined : n)}
                      className="p-0.5"
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    >
                      <Star className={cn("w-3.5 h-3.5", item.rating && n <= item.rating ? "fill-accent text-accent" : "text-muted-foreground/40")} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
