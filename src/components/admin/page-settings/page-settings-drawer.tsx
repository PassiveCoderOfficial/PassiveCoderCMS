"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, X, Loader2, Globe, Code, Layout, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Page } from "@/types/cms";
import { cn } from "@/lib/utils";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9-/]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function PageSettingsDrawer({ page, open, onClose }: { page: Page; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"general" | "seo" | "layout" | "code">("general");

  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [excerpt, setExcerpt] = useState(page.excerpt ?? "");

  const seo = (page.seo ?? {}) as Record<string, string | boolean>;
  const settings = (page.settings ?? {}) as Record<string, unknown>;

  const [seoTitle, setSeoTitle] = useState((seo.title as string) ?? "");
  const [seoDesc, setSeoDesc] = useState((seo.description as string) ?? "");
  const [seoKeywords, setSeoKeywords] = useState((seo.keywords as string) ?? "");
  const [ogTitle, setOgTitle] = useState((seo.og_title as string) ?? "");
  const [ogDesc, setOgDesc] = useState((seo.og_description as string) ?? "");
  const [ogImage, setOgImage] = useState((seo.og_image as string) ?? "");
  const [noIndex, setNoIndex] = useState(!!(seo.no_index));
  const [canonical, setCanonical] = useState((seo.canonical as string) ?? "");

  const [showHeader, setShowHeader] = useState(settings.show_header !== false);
  const [showFooter, setShowFooter] = useState(settings.show_footer !== false);
  const [customCss, setCustomCss] = useState((settings.custom_css as string) ?? "");
  const [customJs, setCustomJs] = useState((settings.custom_js as string) ?? "");

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("pages").update({
      title,
      slug,
      excerpt,
      seo: { title: seoTitle, description: seoDesc, keywords: seoKeywords, og_title: ogTitle, og_description: ogDesc, og_image: ogImage, no_index: noIndex, canonical },
      settings: { show_header: showHeader, show_footer: showFooter, custom_css: customCss, custom_js: customJs },
    }).eq("id", page.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Page settings saved");
    router.refresh();
    onClose();
  }

  const TABS = [
    { id: "general", label: "General", icon: Globe },
    { id: "seo", label: "SEO", icon: Search },
    { id: "layout", label: "Layout", icon: Layout },
    { id: "code", label: "Code", icon: Code },
  ] as const;

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}
      <div className={cn(
        "fixed top-0 right-0 h-full w-[380px] z-50 bg-background border-l shadow-2xl flex flex-col transition-transform duration-200",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between px-4 h-12 border-b shrink-0">
          <span className="font-semibold text-sm flex items-center gap-2"><Settings className="w-4 h-4" /> Page Settings</span>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b shrink-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2",
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === "general" && (
            <>
              <div className="space-y-1.5">
                <Label>Page Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Page title" />
              </div>
              <div className="space-y-1.5">
                <Label>URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">domain.com/</span>
                  <Input value={slug} onChange={e => setSlug(slugify(e.target.value))} placeholder="page-slug" className="font-mono text-sm" />
                </div>
                <p className="text-xs text-muted-foreground">Use <span className="font-mono">home</span> for the homepage.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Excerpt</Label>
                <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short description..." rows={3} />
              </div>
            </>
          )}

          {tab === "seo" && (
            <>
              <div className="space-y-1.5">
                <Label>SEO Title</Label>
                <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder={title || "Page title"} />
                <p className="text-xs text-muted-foreground">{seoTitle.length}/60 chars</p>
              </div>
              <div className="space-y-1.5">
                <Label>Meta Description</Label>
                <Textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} placeholder="Describe this page..." rows={3} />
                <p className="text-xs text-muted-foreground">{seoDesc.length}/160 chars</p>
              </div>
              <div className="space-y-1.5">
                <Label>Keywords</Label>
                <Input value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} placeholder="keyword1, keyword2" />
              </div>
              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Open Graph</p>
                <div className="space-y-1.5">
                  <Label>OG Title</Label>
                  <Input value={ogTitle} onChange={e => setOgTitle(e.target.value)} placeholder={seoTitle || title} />
                </div>
                <div className="space-y-1.5">
                  <Label>OG Description</Label>
                  <Textarea value={ogDesc} onChange={e => setOgDesc(e.target.value)} placeholder={seoDesc} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>OG Image URL</Label>
                  <Input value={ogImage} onChange={e => setOgImage(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>No Index</Label>
                    <p className="text-xs text-muted-foreground">Hide from search engines</p>
                  </div>
                  <Switch checked={noIndex} onCheckedChange={setNoIndex} />
                </div>
                <div className="space-y-1.5">
                  <Label>Canonical URL</Label>
                  <Input value={canonical} onChange={e => setCanonical(e.target.value)} placeholder="https://..." />
                </div>
              </div>
            </>
          )}

          {tab === "layout" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Show Header</p>
                  <p className="text-xs text-muted-foreground">Display site navigation</p>
                </div>
                <Switch checked={showHeader} onCheckedChange={setShowHeader} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Show Footer</p>
                  <p className="text-xs text-muted-foreground">Display site footer</p>
                </div>
                <Switch checked={showFooter} onCheckedChange={setShowFooter} />
              </div>
            </div>
          )}

          {tab === "code" && (
            <>
              <div className="space-y-1.5">
                <Label>Custom CSS</Label>
                <p className="text-xs text-muted-foreground">Injected into this page only</p>
                <Textarea value={customCss} onChange={e => setCustomCss(e.target.value)}
                  placeholder=".my-class { color: red; }" rows={8} className="font-mono text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label>Custom JavaScript</Label>
                <p className="text-xs text-muted-foreground">Runs at end of page</p>
                <Textarea value={customJs} onChange={e => setCustomJs(e.target.value)}
                  placeholder="console.log('hello');" rows={8} className="font-mono text-xs" />
              </div>
            </>
          )}
        </div>

        <div className="px-4 py-3 border-t shrink-0 flex gap-2">
          <Button onClick={save} disabled={saving} className="flex-1">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Settings
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </>
  );
}
