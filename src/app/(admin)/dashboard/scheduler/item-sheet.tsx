"use client";

import { useState, useTransition } from "react";
import { Copy, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { SidePanel } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CONTENT_TYPES, CONTENT_TYPE_LABELS, STATUSES, STATUS_LABELS,
  PILLARS, PILLAR_LABELS, PLATFORM_LABELS, PLATFORM_COLORS,
  type BrandChannel, type BrandProfile, type ContentItem, type ContentType,
  type Pillar, type Platform, type ContentStatus,
} from "@/lib/scheduler/types";
import { wallClockToUtc, utcToWallClock } from "@/lib/scheduler/tz";
import {
  saveContentItem, deleteContentItem, duplicateContentItem, markTargetPublished,
} from "./actions";
import { useT } from "@/lib/i18n/language-provider";

export function ItemSheet({
  item, brands, channels, open, onClose, onSaved,
}: {
  item: ContentItem | null;
  brands: BrandProfile[];
  channels: BrandChannel[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [brandId, setBrandId] = useState(item?.brand_id ?? brands[0]?.id ?? "");
  const brand = brands.find((b) => b.id === brandId);
  const tz = brand?.timezone ?? "Asia/Dhaka";

  const [title, setTitle] = useState(item?.title ?? "");
  const [hook, setHook] = useState(item?.hook ?? "");
  const [body, setBody] = useState(item?.body ?? "");
  const [cta, setCta] = useState(item?.cta ?? "");
  const [type, setType] = useState(item?.content_type ?? "short_video");
  const [pillar, setPillar] = useState(item?.pillar ?? "educational");
  const [status, setStatus] = useState<ContentStatus>(item?.status ?? "idea");
  const [when, setWhen] = useState(utcToWallClock(item?.scheduled_at ?? null, tz));
  const [platforms, setPlatforms] = useState<Platform[]>(
    (item?.content_targets ?? []).map((tgt) => tgt.platform as Platform),
  );

  // Only platforms the selected brand actually runs are offerable.
  const available = channels
    .filter((c) => c.brand_id === brandId && c.is_active)
    .map((c) => c.platform as Platform);

  const save = () => {
    setError(null);
    if (!title.trim()) return setError(t("scheduler.titleRequired"));
    if (!brandId) return setError(t("scheduler.pickBrand"));

    startTransition(async () => {
      const res = await saveContentItem({
        id: item?.id,
        brand_id: brandId,
        title: title.trim(),
        hook,
        body,
        cta,
        content_type: type,
        pillar,
        status,
        scheduled_at: wallClockToUtc(when, tz),
        platforms,
      });
      if (res?.error) setError(res.error);
      else onSaved();
    });
  };

  return (
    <SidePanel
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={item ? t("scheduler.editContent") : t("scheduler.newContent")}
      description={brand ? t("scheduler.brandTz", { brand: brand.name, tz }) : undefined}
      footer={
        <>
          {item && (
            <>
              <Button variant="outline" size="icon" title={t("scheduler.duplicate")}
                onClick={() => startTransition(async () => {
                  await duplicateContentItem(item.id); onSaved();
                })}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" title={t("scheduler.delete")}
                className="text-red-600 hover:text-red-700"
                onClick={() => startTransition(async () => {
                  await deleteContentItem(item.id); onSaved();
                })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={onClose}>{t("scheduler.cancel")}</Button>
            <Button onClick={save} disabled={pending}>
              {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {t("scheduler.save")}
            </Button>
          </div>
        </>
      }
    >
        <div className="space-y-4 px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("scheduler.brand")}>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger><SelectValue placeholder={t("scheduler.selectBrand")} /></SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t("scheduler.type2")}>
              <Select value={type} onValueChange={(v) => setType(v as ContentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((ct) => (
                    <SelectItem key={ct} value={ct}>{CONTENT_TYPE_LABELS[ct]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label={t("scheduler.title")}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={t("scheduler.titlePlaceholder")} />
          </Field>

          <Field label={t("scheduler.hook")} hint={t("scheduler.hookHint")}>
            <Input value={hook} onChange={(e) => setHook(e.target.value)}
              placeholder={t("scheduler.hookPlaceholder")} />
          </Field>

          <Field label={t("scheduler.scriptCaption")}>
            <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)}
              placeholder={t("scheduler.scriptPlaceholder")} />
          </Field>

          <Field label={t("scheduler.callToAction")}>
            <Input value={cta} onChange={(e) => setCta(e.target.value)}
              placeholder={t("scheduler.ctaPlaceholder")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("scheduler.pillar")}>
              <Select value={pillar} onValueChange={(v) => setPillar(v as Pillar)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PILLARS.map((p) => (
                    <SelectItem key={p} value={p}>{PILLAR_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t("scheduler.status2")}>
              <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label={t("scheduler.scheduledFor")} hint={t("scheduler.brandTimezoneHint", { tz })}>
            <Input type="datetime-local" value={when}
              onChange={(e) => setWhen(e.target.value)} />
          </Field>

          <Field label={t("scheduler.publishTo")}>
            {available.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("scheduler.noChannelsHint")}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {available.map((p) => {
                  const on = platforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatforms((prev) =>
                        prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition-colors",
                        on ? "text-white border-transparent" : "hover:bg-muted",
                      )}
                      style={on ? { background: PLATFORM_COLORS[p] } : undefined}
                    >
                      {PLATFORM_LABELS[p]}
                    </button>
                  );
                })}
              </div>
            )}
          </Field>

          {/* Manual publishing: mark each platform done and keep the live URL
              for later reference. API adapters will replace this block. */}
          {item && (item.content_targets ?? []).length > 0 && (
            <Field label={t("scheduler.publishStatus")}>
              <div className="space-y-1.5">
                {(item.content_targets ?? []).map((tgt) => (
                  <TargetRow key={tgt.id} targetId={tgt.id} platform={tgt.platform as Platform}
                    status={tgt.status} url={tgt.external_post_url} onDone={onSaved} />
                ))}
              </div>
            </Field>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    </SidePanel>
  );
}

function TargetRow({
  targetId, platform, status, url, onDone,
}: {
  targetId: string; platform: Platform; status: string;
  url: string | null; onDone: () => void;
}) {
  const t = useT();
  const [value, setValue] = useState(url ?? "");
  const [pending, startTransition] = useTransition();
  const done = status === "published";

  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs" style={{ color: PLATFORM_COLORS[platform] }}>
        {PLATFORM_LABELS[platform]}
      </span>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={done ? t("scheduler.postUrl") : t("scheduler.pastePostUrl")}
        className="h-8 text-xs"
      />
      {done && value ? (
        <a href={value} target="_blank" rel="noreferrer"
          className="text-muted-foreground hover:text-foreground">
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <Button size="sm" variant={done ? "outline" : "default"} className="h-8 shrink-0 text-xs"
          disabled={pending}
          onClick={() => startTransition(async () => {
            await markTargetPublished(targetId, value || null); onDone();
          })}>
          {done ? t("scheduler.saved") : t("scheduler.markDone")}
        </Button>
      )}
    </div>
  );
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
