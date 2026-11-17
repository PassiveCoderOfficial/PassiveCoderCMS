"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Settings, Eye, Copy, History, CalendarClock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSettingsDrawer } from "@/components/admin/page-settings/page-settings-drawer";
import { PageHistoryDrawer } from "@/components/admin/page-history-drawer";
import { createClient } from "@/lib/supabase/client";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { duplicatePage, updateScheduledAt } from "../content-status";
import { createSlug } from "@/lib/utils";
import { toast } from "sonner";
import { isPageLimitError } from "@/lib/usage/page-limit";
import { toastPageLimit } from "@/components/admin/page-limit-notice";
import type { Page } from "@/types/cms";
import { publicUrl } from "@/lib/tenant/site-urls";
import { DateTimeField } from "@/components/ui/date-time-field";

/** Schedule slots are quarter hours (the publish check runs every 15 min): snap a datetime-local value. */
const snap15 = (v: string) => {
  const m = /^(.*T\d{2}):(\d{2})/.exec(v);
  if (!m) return v;
  const mins = Math.round(Number(m[2]) / 15) * 15;
  if (mins < 60) return `${m[1]}:${String(mins).padStart(2, "0")}`;
  const d = new Date(`${m[1]}:45`); d.setMinutes(d.getMinutes() + 15);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function PageEditorHeader({
  page, tenantSlug, tenantCustomDomain,
}: {
  page: Page; tenantSlug: string | null; tenantCustomDomain?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(page.status);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const isMobile = useIsMobile();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string | null>(page.scheduled_at ?? null);
  const [scheduleValue, setScheduleValue] = useState(() => toLocalInputValue(page.scheduled_at ?? new Date(Date.now() + 3600_000).toISOString()));

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [editingSlug, setEditingSlug] = useState(false);
  const [slug, setSlug] = useState(page.slug);

  // The mobile builder shell is a full-screen overlay with its own top bar —
  // this desktop editor header would just render (uselessly) behind it and
  // its back link intercepts taps meant for the canvas. Hide it on mobile.
  if (isMobile) return null;

  const handleSchedule = async () => {
    if (!scheduleValue) return;
    const picked = new Date(scheduleValue);
    if (picked.getTime() <= Date.now()) { toast.error("Pick a future time, or choose Published to go live now"); return; }
    setSaving(true);
    const { error } = await updateScheduledAt(page.id, picked.toISOString());
    setSaving(false);
    if (error) { toast.error("Failed to schedule"); return; }
    setStatus("scheduled");
    setScheduledAt(picked.toISOString());
    setScheduleOpen(false);
    toast.success(`Scheduled for ${formatDateTime(picked)}`);
    router.refresh();
  };

  const handleStatusChange = async (newStatus: string) => {
    // Scheduling needs a time: open the picker instead of flipping status.
    if (newStatus === "scheduled") { setScheduleOpen(true); return; }
    setSaving(true);
    const supabase = createClient();
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "published" && !page.published_at) {
      updates.published_at = new Date().toISOString();
    }
    const { error } = await supabase.from("pages").update(updates).eq("id", page.id);
    if (error) { toast.error("Failed to update status"); setSaving(false); return; }
    setStatus(newStatus as Page["status"]);
    toast.success(`Page ${newStatus}`);
    setSaving(false);
    router.refresh();
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    const { id: newId, error } = await duplicatePage(page.id);
    if (error || !newId) {
      if (error && isPageLimitError(error)) toastPageLimit(error); else toast.error("Failed to duplicate page");
      setDuplicating(false);
      return;
    }
    toast.success("Page duplicated");
    router.push(`/dashboard/pages/${newId}`);
  };

  const saveTitle = async () => {
    setEditingTitle(false);
    if (title === page.title || !title.trim()) { setTitle(page.title); return; }
    const supabase = createClient();
    const { error } = await supabase.from("pages").update({ title }).eq("id", page.id);
    if (error) { toast.error("Failed to update title"); setTitle(page.title); return; }
    router.refresh();
  };

  const saveSlug = async () => {
    setEditingSlug(false);
    const cleaned = createSlug(slug);
    if (!cleaned || cleaned === page.slug) { setSlug(page.slug); return; }
    const supabase = createClient();
    const { error } = await supabase.from("pages").update({ slug: cleaned }).eq("id", page.id);
    if (error) { toast.error("Failed to update slug"); setSlug(page.slug); return; }
    setSlug(cleaned);
    toast.success("Slug updated");
    router.refresh();
  };

  const statusColor = { published: "success", draft: "outline", scheduled: "warning", archived: "secondary" as never };

  return (
    <>
      <div className="flex items-center gap-3 px-4 h-12 border-b bg-background shrink-0">
        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
          <Link href="/dashboard/pages"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>

        <div className="flex items-center gap-2 min-w-0">
          {editingTitle ? (
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") { setTitle(page.title); setEditingTitle(false); }
              }}
              className="h-6 text-sm w-40"
            />
          ) : (
            <button
              className="font-medium text-sm truncate hover:bg-muted rounded px-1 -mx-1"
              onClick={() => setEditingTitle(true)}
              title="Click to rename"
            >
              {title}
            </button>
          )}

          {editingSlug ? (
            <Input
              autoFocus
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              onBlur={saveSlug}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveSlug();
                if (e.key === "Escape") { setSlug(page.slug); setEditingSlug(false); }
              }}
              className="h-6 text-xs w-32 font-mono"
            />
          ) : (
            <button
              className="text-xs text-muted-foreground font-mono hover:bg-muted rounded px-1 -mx-1 shrink-0"
              onClick={() => setEditingSlug(true)}
              title="Click to edit slug"
            >
              /{slug}
            </button>
          )}

          <Badge variant={(statusColor[status] ?? "outline") as never} className="capitalize text-xs shrink-0">{status}</Badge>
          {status === "scheduled" && scheduledAt && (
            <span className="text-xs text-muted-foreground shrink-0" title="Publishes automatically (your local time)">{formatDateTime(scheduledAt)}</span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Select value={status} onValueChange={handleStatusChange} disabled={saving}>
            <SelectTrigger className="h-7 text-xs w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft" className="text-xs">Draft</SelectItem>
              <SelectItem value="published" className="text-xs">Published</SelectItem>
              <SelectItem value="scheduled" className="text-xs">Scheduled</SelectItem>
              <SelectItem value="archived" className="text-xs">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Popover open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" title="Schedule publish" disabled={saving}>
                <CalendarClock className="h-3 w-3" /> {status === "scheduled" ? "Reschedule" : "Schedule"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 space-y-3" align="end">
              <div className="space-y-1">
                <label className="text-xs font-medium">Publish automatically at</label>
                <DateTimeField
                  type="datetime-local"
                  value={scheduleValue}
                  onChange={(e) => setScheduleValue(snap15(e.target.value))}
                  className="w-full h-8 rounded-md border bg-background px-2 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">Your local time ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p>
              </div>
              <Button size="sm" className="w-full h-7 text-xs" onClick={handleSchedule} disabled={saving}>
                {status === "scheduled" ? "Reschedule" : "Schedule"}
              </Button>
              {status === "scheduled" && (
                <Button size="sm" variant="outline" className="w-full h-7 text-xs" disabled={saving}
                  onClick={() => { setScheduleOpen(false); void handleStatusChange("draft"); }}>
                  Unschedule (back to draft)
                </Button>
              )}
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" className="h-7 w-7" title="Duplicate" onClick={handleDuplicate} disabled={duplicating}>
            <Copy className="h-3.5 w-3.5" />
          </Button>

          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
            {tenantSlug ? (
              // Relative /slug resolves against whatever subdomain the tab happens to
              // be on — wrong when a staff member has multiple tenant tabs open. Build the
              // preview URL against the page's own tenant explicitly. Uses the real
              // custom domain when one is attached — this is what a visitor sees,
              // unlike admin/dashboard links which must stay on the subdomain.
              <a
                href={publicUrl({ slug: tenantSlug, custom_domain: tenantCustomDomain }, `/${page.slug}`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Eye className="h-3 w-3" /> View
              </a>
            ) : (
              <Link href={`/${page.slug}`} target="_blank">
                <Eye className="h-3 w-3" /> View
              </Link>
            )}
          </Button>

          <Button variant="outline" size="icon" className="h-7 w-7" title="Page History" onClick={() => setHistoryOpen(true)}>
            <History className="h-3.5 w-3.5" />
          </Button>

          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <PageSettingsDrawer page={page} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <PageHistoryDrawer pageId={page.id} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
}

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
