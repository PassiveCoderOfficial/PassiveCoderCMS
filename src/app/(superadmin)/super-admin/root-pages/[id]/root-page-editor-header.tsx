"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Eye, Globe, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSettingsDrawer } from "@/components/admin/page-settings/page-settings-drawer";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Page } from "@/types/cms";

export function RootPageEditorHeader({ page }: { page: Page }) {
  const router = useRouter();
  const [status, setStatus] = useState(page.status);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const statusColor: Record<string, string> = { published: "success", draft: "outline", scheduled: "warning", archived: "secondary" };

  return (
    <>
      <div className="flex items-center gap-3 px-4 h-12 border-b bg-background shrink-0">
        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
          <Link href="/super-admin/root-pages"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>

        <Globe className="w-4 h-4 text-indigo-500 shrink-0" />

        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-sm truncate">{page.title}</span>
          <span className="text-xs text-muted-foreground font-mono">/{page.slug}</span>
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
              <SelectItem value="archived" className="text-xs">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
            <a href={page.slug === "home" ? "/" : `/${page.slug}`} target="_blank" rel="noopener noreferrer">
              <Eye className="h-3 w-3" /> View Live
            </a>
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
