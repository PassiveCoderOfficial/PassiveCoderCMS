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

interface PageRowProps {
  page: {
    id: string;
    title: string;
    slug: string;
    status: string;
    updated_at: string;
    scheduled_at?: string | null;
    deleted_at?: string | null;
  };
  inTrash?: boolean;
}

export function PageRow({ page, inTrash }: PageRowProps) {
  const router = useRouter();

  return (
    <tr
      className="hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => router.push(`/dashboard/pages/${page.id}`)}
    >
      <td className="px-4 py-3 max-w-[140px] sm:max-w-none">
        <span className="font-medium text-sm block truncate">{page.title}</span>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
        <a
          href={`/${page.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs bg-muted hover:bg-muted/70 px-1.5 py-0.5 rounded font-mono inline-block"
        >
          /{page.slug}
        </a>
      </td>
      <td className="px-4 py-3 hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
        <StatusPicker pageId={page.id} status={page.status} disabled={inTrash} />
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
        <ScheduleTrigger pageId={page.id} updatedAt={page.updated_at} scheduledAt={page.scheduled_at} disabled={inTrash} />
      </td>
      <td className="px-4 py-3 text-right">
        <PageActions pageId={page.id} pageSlug={page.slug} inTrash={inTrash} />
      </td>
    </tr>
  );
}

function StatusPicker({ pageId, status, disabled }: { pageId: string; status: string; disabled?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  const variants: Record<string, "default" | "success" | "warning" | "outline"> = {
    published: "success", draft: "outline", scheduled: "warning", archived: "secondary" as never,
  };

  if (disabled) {
    return <Badge variant={variants[value] ?? "outline"} className="capitalize text-xs">{value}</Badge>;
  }

  const handleChange = async (next: string) => {
    setSaving(true);
    const { error } = await updateStatus(pageId, next);
    if (error) { toast.error("Failed to update status"); setSaving(false); return; }
    setValue(next);
    toast.success(`Marked ${next}`);
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
          "h-6 text-xs w-auto min-w-24 border-none px-2.5 py-0.5 rounded-full capitalize font-semibold shadow-none focus:ring-0 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-60",
          badgeColor[value] ?? "border text-foreground",
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="draft" className="text-xs">Draft</SelectItem>
        <SelectItem value="published" className="text-xs">Published</SelectItem>
        <SelectItem value="scheduled" className="text-xs">Scheduled</SelectItem>
        <SelectItem value="archived" className="text-xs">Archived</SelectItem>
      </SelectContent>
    </Select>
  );
}

function ScheduleTrigger({
  pageId, updatedAt, scheduledAt, disabled,
}: { pageId: string; updatedAt: string; scheduledAt?: string | null; disabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(() => toLocalInputValue(scheduledAt ?? updatedAt));
  const [saving, setSaving] = useState(false);

  if (disabled) return <span>{formatDateTime(updatedAt)}</span>;

  const handleSave = async () => {
    if (!value) return;
    setSaving(true);
    const iso = new Date(value).toISOString();
    const { error } = await updateScheduledAt(pageId, iso);
    if (error) { toast.error("Failed to update schedule"); setSaving(false); return; }
    toast.success(new Date(iso) > new Date() ? "Scheduled" : "Timestamp updated");
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
          <label className="text-xs font-medium">Publish / schedule date</label>
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full h-8 rounded-md border bg-background px-2 text-xs"
          />
          <p className="text-[10px] text-muted-foreground">
            Future time auto-schedules and publishes then. Past/now just adjusts the timestamp.
          </p>
        </div>
        <Button size="sm" className="w-full h-7 text-xs" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
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
