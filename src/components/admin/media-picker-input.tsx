"use client";

import React, { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ImageIcon, X, Upload, Search, Grid3X3, List, Check, Loader2,
  Link2, FolderOpen,
} from "lucide-react";
import { uploadMediaFile } from "@/app/(admin)/dashboard/media/actions";
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

function InlineUploadZone({ onDone }: { onDone: () => void }) {
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
      await Promise.all(valid.map((file) => {
        const fd = new FormData();
        fd.append("file", file);
        return uploadMediaFile(fd);
      }));
      toast.success(`${valid.length} file(s) uploaded`);
      onDone();
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

function LibraryBrowser({ onSelect }: { onSelect: (url: string) => void }) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [hovered, setHovered] = useState<string | null>(null);

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

  const filtered = media.filter(
    (m) =>
      m.mime_type.startsWith("image/") &&
      (m.original_name.toLowerCase().includes(search.toLowerCase()) ||
        m.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-3 min-h-0 flex-1">
      {/* Upload zone */}
      <InlineUploadZone onDone={fetchMedia} />

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search images…"
            className="pl-7 h-8 text-xs"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex rounded-md border overflow-hidden">
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn("p-1.5 transition-colors", view === v ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              {v === "grid" ? <Grid3X3 className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Grid / List */}
      <div className="flex-1 overflow-y-auto min-h-0 rounded-lg border bg-muted/20">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">{search ? "No images match your search" : "No images in the library yet"}</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-4 gap-2 p-2">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.url)}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
                className="group relative aspect-square rounded-md overflow-hidden border-2 border-transparent hover:border-primary transition-all focus:outline-none focus:border-primary bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.alt ?? item.name} className="w-full h-full object-cover" loading="lazy" />
                <div className={cn(
                  "absolute inset-0 bg-primary/20 flex items-center justify-center transition-opacity",
                  hovered === item.id ? "opacity-100" : "opacity-0"
                )}>
                  <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.url)}
                className="w-full flex items-center gap-3 p-2 hover:bg-muted/60 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded overflow-hidden border shrink-0 bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.alt ?? item.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.original_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{item.url}</p>
                </div>
                <Check className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 shrink-0" />
              </button>
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
}

export function MediaPickerInput({
  value,
  onChange,
  placeholder = "https://…",
  compact = false,
  className,
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="preview" className="w-full h-full object-cover" />
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="preview" className="w-full h-full object-contain max-h-48" />
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
  const [tab, setTab] = useState<"library" | "url">(startInUrlMode ? "url" : "library");
  const [manualUrl, setManualUrl] = useState(currentValue);

  // Sync tab when startInUrlMode changes
  useEffect(() => { setTab(startInUrlMode ? "url" : "library"); }, [startInUrlMode]);
  useEffect(() => { if (open) setManualUrl(currentValue); }, [open, currentValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="text-sm font-semibold">Choose Image</DialogTitle>
          {/* Tab switcher */}
          <div className="flex gap-1 mt-2">
            {(["library", "url"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {t === "library" ? "Media Library" : "Paste URL"}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden p-4 flex flex-col">
          {tab === "library" ? (
            <LibraryBrowser onSelect={onSelect} />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Paste any image URL from the web or your media library.</p>
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={manualUrl} alt="preview" className="max-h-64 max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
