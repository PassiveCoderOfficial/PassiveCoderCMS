"use client";

import { compressImageForUpload } from "@/lib/media/client-compress";
import React, { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { ImageFocusPicker } from "@/components/admin/image-focus-picker";
import type { ImageFocus } from "@/lib/image-focus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ImageIcon, X, Upload, Search, Grid3X3, List, Check, Loader2,
  Link2, FolderOpen, Info, Copy, ExternalLink, Trash2, Play,
} from "lucide-react";
import { uploadMediaFile, deleteMediaFile, getMediaUsage, updateMediaAlt } from "@/app/(admin)/dashboard/media/actions";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MediaItem {
  id: string;
  name: string;
  original_name: string;
  url: string;
  mime_type: string;
  size: number;
  alt?: string;
  storage_path?: string;
  created_at: string;
}

// ─── Tiny upload zone (inline, inside picker dialog) ──────────────────────────

const MAX_SIZE = 50 * 1024 * 1024;

function InlineUploadZone({ onDone, onSelect }: { onDone: () => void; onSelect: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, startUpload] = useTransition();

  const upload = (files: FileList | null) => {
    if (!files?.length) return;
    const valid = Array.from(files).filter((f) => {
      if (f.size > MAX_SIZE) { toast.error(`${f.name} exceeds 50 MB`); return false; }
      return true;
    });
    if (!valid.length) return;
    startUpload(async () => {
      const results = await Promise.all(valid.map(async (file) => {
        const fd = new FormData();
        fd.append("file", await compressImageForUpload(file));
        return uploadMediaFile(fd);
      }));
      toast.success(`${valid.length} file(s) uploaded`);
      onDone();
      // Auto-apply a single upload — this picker exists to fill ONE field
      // (logo, favicon, hero image...), and uploading used to only refresh
      // the library grid, leaving the caller to notice their file appear and
      // click it a second time to actually use it. Easy to miss, especially
      // mid-onboarding-wizard: a real report was a logo genuinely uploaded
      // and never applied, because "upload" looked like the whole action.
      // Multiple files still land in the library only — there's no single
      // field to auto-fill for those.
      if (results.length === 1 && "url" in results[0] && results[0].url) {
        onSelect(results[0].url);
      }
    });
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}
      onClick={() => !uploading && inputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all flex items-center justify-center gap-3",
        dragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 hover:bg-muted/30",
        uploading && "pointer-events-none opacity-60",
      )}
    >
      <input ref={inputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.zip" className="hidden" onChange={(e) => upload(e.target.files)} />
      {uploading
        ? <><Loader2 className="h-4 w-4 animate-spin text-primary" /><span className="text-xs text-muted-foreground">Uploading…</span></>
        : <><Upload className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Upload new file — drag & drop or click</span></>
      }
    </div>
  );
}

// ─── Library browser (inside picker dialog) ────────────────────────────────────

type Kind = "all" | "image" | "video";
const isVideo = (m: MediaItem) => m.mime_type.startsWith("video/");
const isImage = (m: MediaItem) => m.mime_type.startsWith("image/");
const fmtSize = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** File details inside the picker: preview, URL to copy, alt text, delete, use. */
function MediaDetails({ item, onBack, onSelect, onChanged }: { item: MediaItem; onBack: () => void; onSelect: (url: string) => void; onChanged: () => void }) {
  const [alt, setAlt] = useState(item.alt ?? "");
  const [busy, setBusy] = useState<"alt" | "del" | null>(null);
  const [copied, setCopied] = useState(false);

  async function saveAlt() {
    setBusy("alt");
    const r = await updateMediaAlt(item.id, alt) as { error?: string } | undefined;
    setBusy(null);
    if (r?.error) toast.error(r.error); else { toast.success("Saved"); onChanged(); }
  }
  async function remove() {
    const used = await getMediaUsage(item.id).catch(() => [] as { kind: string; title: string }[]);
    const where = used.length ? `\n\nIt is used on: ${used.slice(0, 5).map((u) => u.title).join(", ")}${used.length > 5 ? "…" : ""}. Those places will show nothing.` : "";
    if (!confirm(`Delete ${item.original_name}? This can't be undone.${where}`)) return;
    setBusy("del");
    const r = await deleteMediaFile(item.id) as { error?: string } | undefined;
    setBusy(null);
    if (r?.error) { toast.error(r.error); return; }
    toast.success("Deleted");
    onChanged();
    onBack();
  }

  return (
    <div className="flex flex-col gap-3 min-h-0 flex-1 overflow-y-auto">
      <button type="button" onClick={onBack} className="self-start text-xs text-muted-foreground hover:text-foreground">← Back to library</button>
      <div className="rounded-lg border bg-muted flex items-center justify-center overflow-hidden max-h-72">
        {isVideo(item)
          ? <video src={item.url} controls playsInline className="max-h-72 max-w-full" />
          : <MediaThumb src={item.url} alt={item.alt ?? item.name} className="max-h-72 max-w-full object-contain" />}
      </div>
      <div className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-1.5 text-xs">
        <span className="text-muted-foreground">File</span><span className="break-all">{item.original_name}</span>
        <span className="text-muted-foreground">Type</span><span>{item.mime_type}</span>
        <span className="text-muted-foreground">Size</span><span>{fmtSize(item.size)}</span>
        <span className="text-muted-foreground">Uploaded</span><span>{new Date(item.created_at).toLocaleString()}</span>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">URL</p>
        <div className="flex gap-1">
          <Input readOnly value={item.url} className="h-8 text-xs font-mono" onFocus={(e) => e.currentTarget.select()} />
          <Button type="button" size="sm" variant="outline" className="h-8" aria-label="Copy URL"
            onClick={() => { navigator.clipboard.writeText(item.url); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-8" asChild>
            <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label="Open in new tab"><ExternalLink className="h-3.5 w-3.5" /></a>
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{isVideo(item) ? "Description (for accessibility)" : "Alt text (describes the image for Google and screen readers)"}</p>
        <div className="flex gap-1">
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} className="h-8 text-xs" placeholder="e.g. Orange perfume bottle on a stone table" />
          <Button type="button" size="sm" variant="outline" className="h-8" disabled={busy !== null || alt === (item.alt ?? "")} onClick={saveAlt}>
            {busy === "alt" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" size="sm" onClick={() => onSelect(item.url)}><Check className="h-3.5 w-3.5 mr-1" /> Use this</Button>
        <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy !== null} onClick={remove}>
          {busy === "del" ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />} Delete
        </Button>
      </div>
    </div>
  );
}

function LibraryBrowser({ onSelect, kind }: { onSelect: (url: string) => void; kind: Kind }) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [detail, setDetail] = useState<MediaItem | null>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      if (res.ok) setMedia(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);
  useEffect(() => { setDetail(null); }, [kind]);

  const q = search.toLowerCase();
  const filtered = media.filter((m) =>
    (kind === "image" ? isImage(m) : kind === "video" ? isVideo(m) : isImage(m) || isVideo(m)) &&
    (m.original_name.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)));
  const noun = kind === "image" ? "photos" : kind === "video" ? "videos" : "media";

  if (detail) {
    const fresh = media.find((m) => m.id === detail.id) ?? detail;
    return <MediaDetails item={fresh} onBack={() => setDetail(null)} onSelect={onSelect} onChanged={fetchMedia} />;
  }

  const infoBtn = (item: MediaItem, cls: string) => (
    <button type="button" title="Details" aria-label="File details" onClick={(e) => { e.stopPropagation(); setDetail(item); }}
      className={cn("h-6 w-6 rounded-full bg-background/90 border flex items-center justify-center hover:bg-background", cls)}>
      <Info className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <div className="flex flex-col gap-3 min-h-0 flex-1">
      <InlineUploadZone onDone={fetchMedia} onSelect={onSelect} />

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${noun}…`} className="pl-7 h-8 text-xs" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex rounded-md border overflow-hidden">
          {(["grid", "list"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} aria-label={v === "grid" ? "Grid view" : "List view"}
              className={cn("p-1.5 transition-colors", view === v ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
              {v === "grid" ? <Grid3X3 className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 rounded-lg border bg-muted/20">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">{search ? `No ${noun} match your search` : `No ${noun} in the library yet`}</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-4 gap-2 p-2">
            {filtered.map((item) => (
              <div key={item.id} role="button" tabIndex={0} onClick={() => onSelect(item.url)}
                onKeyDown={(e) => { if (e.key === "Enter") onSelect(item.url); }}
                className="group relative aspect-square rounded-md overflow-hidden border-2 border-transparent hover:border-primary transition-all focus:outline-none focus:border-primary bg-muted cursor-pointer">
                <MediaThumb src={item.url} alt={item.alt ?? item.name} className="w-full h-full object-cover" />
                {isVideo(item) && <span className="absolute bottom-1 left-1 rounded bg-black/70 text-white px-1 py-0.5"><Play className="h-3 w-3" /></span>}
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center"><Check className="h-3.5 w-3.5 text-primary-foreground" /></span>
                </div>
                {infoBtn(item, "absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus:opacity-100")}
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((item) => (
              <div key={item.id} role="button" tabIndex={0} onClick={() => onSelect(item.url)}
                onKeyDown={(e) => { if (e.key === "Enter") onSelect(item.url); }}
                className="group w-full flex items-center gap-3 p-2 hover:bg-muted/60 transition-colors text-left cursor-pointer">
                <div className="h-10 w-10 rounded overflow-hidden border shrink-0 bg-muted">
                  <MediaThumb src={item.url} alt={item.alt ?? item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.original_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{isVideo(item) ? "Video" : "Photo"} · {fmtSize(item.size)} · {item.url}</p>
                </div>
                {infoBtn(item, "shrink-0")}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main exported component ───────────────────────────────────────────────────

interface MediaPickerInputProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  /** compact: small thumbnail strip used inside page builder panels */
  compact?: boolean;
  className?: string;
  /** Pass both to show the focal-point control under the preview (compact mode). */
  focus?: ImageFocus | null;
  onFocusChange?: (f: ImageFocus | undefined) => void;
}

const VIDEO_FILE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;
const VIDEO_LINK = /youtube\.com|youtu\.be|vimeo\.com/i;

/** Thumbnail for any picked media: images as <img>, video files as a paused
 *  first frame, YouTube/Vimeo links as a labelled tile (an <img> of a video
 *  showed as a broken "preview" icon). */
function MediaThumb({ src, alt, className }: { src: string; alt: string; className?: string }) {
  if (VIDEO_FILE.test(src)) return <video src={`${src}#t=0.1`} muted playsInline preload="metadata" className={className} aria-label={alt} />;
  if (VIDEO_LINK.test(src)) {
    return <div className={cn(className, "flex items-center justify-center text-xs text-muted-foreground p-2 text-center break-all")}>Video link: {src.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60)}</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}

export function MediaPickerInput({
  value,
  onChange,
  placeholder = "https://…",
  compact = false,
  className,
  focus,
  onFocusChange,
}: MediaPickerInputProps) {
  const [open, setOpen] = useState(false);
  const [urlMode, setUrlMode] = useState(false);

  const handleSelect = (url: string) => {
    onChange(url);
    setOpen(false);
    setUrlMode(false);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  if (compact) {
    // ── Compact mode: used inside page builder settings panel ──────────────────
    return (
      <>
        <div className={cn("flex flex-col gap-1.5", className)}>
          {/* Preview strip */}
          {value && (
            <div className="relative rounded-md overflow-hidden border bg-muted aspect-video w-full group">
              <MediaThumb src={value} alt={"preview"} className="w-full h-full object-cover" />
              <button
                onClick={clear}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {/* Action row */}
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs gap-1.5"
              onClick={() => { setUrlMode(false); setOpen(true); }}
            >
              <ImageIcon className="h-3 w-3" />
              {value ? "Change" : "Choose"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Paste URL directly"
              onClick={() => { setUrlMode(true); setOpen(true); }}
            >
              <Link2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          {value && onFocusChange && !VIDEO_FILE.test(value) && !VIDEO_LINK.test(value) && (
            <ImageFocusPicker value={focus} onChange={onFocusChange} imageUrl={value} label="Photo focus (crop)" />
          )}
        </div>

        <PickerDialog open={open} onOpenChange={setOpen} onSelect={handleSelect} startInUrlMode={urlMode} currentValue={value} />
      </>
    );
  }

  // ── Full mode: used in forms (product form, settings, etc.) ────────────────
  return (
    <>
      <div className={cn("flex flex-col gap-2", className)}>
        {value && (
          <div className="relative rounded-lg overflow-hidden border bg-muted w-full max-h-48 group">
            <MediaThumb src={value} alt={"preview"} className="w-full h-full object-contain max-h-48" />
            <button
              onClick={clear}
              className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => { setUrlMode(false); setOpen(true); }}
          >
            <ImageIcon className="h-4 w-4" />
            {value ? "Change image" : "Choose from library"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Paste URL directly"
            onClick={() => { setUrlMode(true); setOpen(true); }}
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <PickerDialog open={open} onOpenChange={setOpen} onSelect={handleSelect} startInUrlMode={urlMode} currentValue={value} />
    </>
  );
}

// ─── Dialog ────────────────────────────────────────────────────────────────────

function PickerDialog({
  open,
  onOpenChange,
  onSelect,
  startInUrlMode,
  currentValue,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (url: string) => void;
  startInUrlMode: boolean;
  currentValue: string;
}) {
  const [tab, setTab] = useState<"all" | "image" | "video" | "url">(startInUrlMode ? "url" : "all");
  const [manualUrl, setManualUrl] = useState(currentValue);

  // Sync tab when startInUrlMode changes
  useEffect(() => { setTab(startInUrlMode ? "url" : "all"); }, [startInUrlMode]);
  useEffect(() => { if (open) setManualUrl(currentValue); }, [open, currentValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="text-sm font-semibold">Choose media</DialogTitle>
          {/* Tab switcher */}
          <div className="flex gap-1 mt-2">
            {(["all", "image", "video", "url"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {t === "all" ? "Media Library" : t === "image" ? "Photos" : t === "video" ? "Videos" : "Paste URL"}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden p-4 flex flex-col">
          {tab !== "url" ? (
            <LibraryBrowser onSelect={onSelect} kind={tab} />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Paste any image or video URL (YouTube and Vimeo links work too).</p>
                <Input
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="font-mono text-xs"
                  autoFocus
                />
              </div>
              {manualUrl && (
                <div className="rounded-lg border overflow-hidden bg-muted flex items-center justify-center max-h-64">
                  <MediaThumb src={manualUrl} alt="preview" className="max-h-64 max-w-full object-contain" />
                </div>
              )}
              <Button
                onClick={() => manualUrl.trim() && onSelect(manualUrl.trim())}
                disabled={!manualUrl.trim()}
                className="self-start"
              >
                Use this URL
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
