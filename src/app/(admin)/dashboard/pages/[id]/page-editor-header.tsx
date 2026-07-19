"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Settings, Eye, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSettingsDrawer } from "@/components/admin/page-settings/page-settings-drawer";
import { createClient } from "@/lib/supabase/client";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { duplicatePage } from "../content-status";
import { createSlug } from "@/lib/utils";
import { toast } from "sonner";
import type { Page } from "@/types/cms";

export function PageEditorHeader({ page }: { page: Page }) {
  const router = useRouter();
  const [status, setStatus] = useState(page.status);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const isMobile = useIsMobile();

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [editingSlug, setEditingSlug] = useState(false);
  const [slug, setSlug] = useState(page.slug);

  // The mobile builder shell is a full-screen overlay with its own top bar —
  // this desktop editor header would just render (uselessly) behind it and
  // its back link intercepts taps meant for the canvas. Hide it on mobile.
  if (isMobile) return null;

  const handleStatusChange = async (newStatus: string) => {
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
    if (error || !newId) { toast.error("Failed to duplicate page"); setDuplicating(false); return; }
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

          <Button variant="outline" size="icon" className="h-7 w-7" title="Duplicate" onClick={handleDuplicate} disabled={duplicating}>
            <Copy className="h-3.5 w-3.5" />
          </Button>

          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
            <Link href={`/${page.slug}`} target="_blank">
              <Eye className="h-3 w-3" /> View
            </Link>
          </Button>

          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <PageSettingsDrawer page={page} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
