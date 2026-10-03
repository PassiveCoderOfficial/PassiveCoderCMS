"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateTime, cn } from "@/lib/utils";
import { updateStatus, updateScheduledAt } from "./content-status";
import { PageActions } from "./page-actions";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/language-provider";

export type PageRowData = {
    id: string;
    title: string;
    slug: string;
    status: string;
    updated_at: string;
    scheduled_at?: string | null;
    deleted_at?: string | null;
    /** Live page with saved edits that aren't published yet (migration 105/106). */
    has_draft?: boolean | null;
    /** SEO meta description set? Missing ones are flagged in the list. */
    has_seo_description?: boolean;
    /** Came in through Import / Export; "rebuilt" once AI has redesigned it. */
    imported?: "imported" | "rebuilt";
};

interface PageRowProps {
  page: PageRowData;
  inTrash?: boolean;
  /** Public site origin, e.g. https://example.com — links open the real site. */
  siteBase: string;
  selected?: boolean;
  onSelect?: () => void;
}

export function PageRow({ page, inTrash, siteBase, selected, onSelect }: PageRowProps) {
  const router = useRouter();
  const t = useT();
  const isHome = page.slug === "home";
  const path = isHome ? "/" : `/${page.slug}`;

  return (
    <tr
      className="hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => router.push(`/dashboard/pages/${page.id}`)}
    >
      <td className="pl-4 py-3 w-8" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" aria-label={`Select ${page.title}`} checked={!!selected} onChange={() => onSelect?.()} />
      </td>
      <td className="px-4 py-3 max-w-[140px] sm:max-w-none">
        <span className="font-medium text-sm flex items-center gap-2 min-w-0">
          <span className="truncate">{page.title}</span>
          {isHome && <span className="shrink-0 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">{t("pages.homeBadge")}</span>}
          {page.imported && <span className="shrink-0 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-semibold">{t("pages.importedBadge")}</span>}
        </span>
        {!inTrash && page.has_seo_description === false && page.status === "published" && (
          <span className="mt-0.5 block text-[11px] text-muted-foreground">{t("pages.noSeoDescription")}</span>
        )}
        {page.has_draft && page.status === "published" && !inTrash && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {t("pages.unpublishedChanges")}
          </span>
        )}
      </td>
      <td className="px-4 py-3 hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
        <a
          href={`${siteBase}${path}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs bg-muted hover:bg-muted/70 px-1.5 py-0.5 rounded font-mono inline-block"
        >
          {path}
        </a>
      </td>
      <td className="px-4 py-3 hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
        <StatusPicker pageId={page.id} status={page.status} disabled={inTrash} />
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
        <ScheduleTrigger pageId={page.id} updatedAt={page.updated_at} scheduledAt={page.scheduled_at} disabled={inTrash} />
      </td>
      <td className="px-4 py-3 text-right">
        <PageActions pageId={page.id} viewUrl={`${siteBase}${path}`} inTrash={inTrash} imported={page.imported} />
      </td>
    </tr>
  );
}

function StatusPicker({ pageId, status, disabled }: { pageId: string; status: string; disabled?: boolean }) {
  const router = useRouter();
  const t = useT();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  const variants: Record<string, "default" | "success" | "warning" | "outline"> = {
    published: "success", draft: "outline", scheduled: "warning", archived: "secondary" as never,
  };
  const statusLabel: Record<string, string> = {
    published: t("pages.statusPublished"), draft: t("pages.statusDraft"),
    scheduled: t("pages.statusScheduled"), archived: t("pages.statusArchived"),
  };

  if (disabled) {
    return <Badge variant={variants[value] ?? "outline"} className="text-xs">{statusLabel[value] ?? value}</Badge>;
  }

  const handleChange = async (next: string) => {
    setSaving(true);
    const { error } = await updateStatus(pageId, next);
    if (error) { toast.error(t("pages.failedUpdateStatus")); setSaving(false); return; }
    setValue(next);
    toast.success(t("pages.markedStatus", { status: statusLabel[next] ?? next }));
    setSaving(false);
    router.refresh();
  };

  const badgeColor: Record<string, string> = {
    published: "bg-green-100 text-green-800",
    draft: "border text-foreground",
    scheduled: "bg-yellow-100 text-yellow-800",
    archived: "bg-secondary text-secondary-foreground",
  };

  return (
    <Select value={value} onValueChange={handleChange} disabled={saving}>
      <SelectTrigger
        className={cn(
          "h-6 text-xs w-auto min-w-24 border-none px-2.5 py-0.5 rounded-full font-semibold shadow-none focus:ring-0 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-60",
          badgeColor[value] ?? "border text-foreground",
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="draft" className="text-xs">{t("pages.statusDraft")}</SelectItem>
        <SelectItem value="published" className="text-xs">{t("pages.statusPublished")}</SelectItem>
        <SelectItem value="scheduled" className="text-xs">{t("pages.statusScheduled")}</SelectItem>
        <SelectItem value="archived" className="text-xs">{t("pages.statusArchived")}</SelectItem>
      </SelectContent>
    </Select>
  );
}

function ScheduleTrigger({
  pageId, updatedAt, scheduledAt, disabled,
}: { pageId: string; updatedAt: string; scheduledAt?: string | null; disabled?: boolean }) {
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(() => toLocalInputValue(scheduledAt ?? updatedAt));
  const [saving, setSaving] = useState(false);

  if (disabled) return <span>{formatDateTime(updatedAt)}</span>;

  const handleSave = async () => {
    if (!value) return;
    setSaving(true);
    const iso = new Date(value).toISOString();
    const { error } = await updateScheduledAt(pageId, iso);
    if (error) { toast.error(t("pages.failedUpdateSchedule")); setSaving(false); return; }
    toast.success(new Date(iso) > new Date() ? t("pages.scheduled") : t("pages.timestampUpdated"));
    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="hover:underline underline-offset-2 text-left">
          {formatDateTime(updatedAt)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="start">
        <div className="space-y-1">
          <label className="text-xs font-medium">{t("pages.publishScheduleDate")}</label>
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full h-8 rounded-md border bg-background px-2 text-xs"
          />
          <p className="text-[10px] text-muted-foreground">
            {t("pages.scheduleHint")}
          </p>
        </div>
        <Button size="sm" className="w-full h-7 text-xs" onClick={handleSave} disabled={saving}>
          {saving ? t("pages.saving") : t("common.save")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
