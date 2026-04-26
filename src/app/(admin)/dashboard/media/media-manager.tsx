"use client";

import React, { useCallback, useRef, useState, useTransition } from "react";
import { uploadMediaFile, deleteMediaFile, updateMediaAlt } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Upload, Grid3X3, List, Search, Copy, Trash2, Pencil, X,
  FileText, FileVideo, FileAudio, File, Check, Loader2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith("video/")) return <FileVideo className={className} />;
  if (mimeType.startsWith("audio/")) return <FileAudio className={className} />;
  if (mimeType.includes("pdf") || mimeType.includes("text")) return <FileText className={className} />;
  return <File className={className} />;
}

function MediaThumbnail({ item, className }: { item: MediaItem; className?: string }) {
  if (item.mime_type.startsWith("image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt={item.alt ?? item.name}
        className={cn("w-full h-full object-cover", className)}
        loading="lazy"
      />
    );
  }
  return (
    <div className={cn("w-full h-full flex items-center justify-center bg-muted", className)}>
      <FileIcon mimeType={item.mime_type} className="h-8 w-8 text-muted-foreground" />
    </div>
  );
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

interface UploadError {
  name: string;
  reason: string;
}

interface UploadProgress {
  name: string;
  done: boolean;
  error?: string;
}

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
  uploading: boolean;
  progress: UploadProgress[];
  errors: UploadError[];
  onClearErrors: () => void;
}

function UploadZone({ onUpload, uploading, progress, errors, onClearErrors }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const validate = (files: FileList | File[]): { valid: File[]; rejected: UploadError[] } => {
    const valid: File[] = [];
    const rejected: UploadError[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        rejected.push({ name: file.name, reason: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB — max 50 MB)` });
      } else {
        valid.push(file);
      }
    }
    return { valid, rejected };
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const { valid, rejected } = validate(e.dataTransfer.files);
    if (rejected.length) {
      // Surface size errors immediately via the parent
      onUpload([]);
    }
    if (valid.length) onUpload(valid);
    // Show rejected as errors by passing them through the same channel
    if (rejected.length && valid.length === 0) return;
  }, [onUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const { valid } = validate(e.target.files);
    onUpload(valid);
    e.target.value = "";
  };

  const doneCount = progress.filter((p) => p.done && !p.error).length;
  const totalCount = progress.length;

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
          dragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/40",
          uploading && "pointer-events-none",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
          className="hidden"
          onChange={handleChange}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-4 border-muted flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[9px] font-bold text-primary-foreground">{doneCount}/{totalCount}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Uploading files…</p>
              <p className="text-xs text-muted-foreground">{doneCount} of {totalCount} complete</p>
            </div>
            {/* Per-file progress list */}
            {progress.length > 0 && (
              <div className="w-full max-w-xs space-y-1 text-left">
                {progress.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 text-xs">
                    {p.error ? (
                      <span className="h-3.5 w-3.5 rounded-full bg-destructive/20 text-destructive flex items-center justify-center shrink-0">✕</span>
                    ) : p.done ? (
                      <span className="h-3.5 w-3.5 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center shrink-0">✓</span>
                    ) : (
                      <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin shrink-0" />
                    )}
                    <span className={cn("truncate", p.error ? "text-destructive" : p.done ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center transition-colors",
              dragging ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <Upload className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {dragging ? "Drop files to upload" : "Drag & drop or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground">
                Images · Videos · Audio · PDFs · Documents — max <strong>50 MB</strong> per file
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload errors */}
      {errors.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <span className="h-5 w-5 rounded-full bg-destructive/15 flex items-center justify-center text-xs font-bold">!</span>
              <span className="text-sm font-medium">{errors.length} file{errors.length > 1 ? "s" : ""} failed to upload</span>
            </div>
            <button
              onClick={onClearErrors}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          </div>
          <ul className="divide-y divide-destructive/10">
            {errors.map((err, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="h-4 w-4 text-destructive/70" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{err.name}</p>
                  <p className="text-xs text-destructive/80 mt-0.5">{err.reason}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface MediaDetailProps {
  item: MediaItem;
  onClose: () => void;
  onDelete: (item: MediaItem) => void;
  onAltSaved: (id: string, alt: string) => void;
}

function MediaDetail({ item, onClose, onDelete, onAltSaved }: MediaDetailProps) {
  const [alt, setAlt] = useState(item.alt ?? "");
  const [saving, startSaving] = useTransition();
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveAlt = () => {
    startSaving(async () => {
      const result = await updateMediaAlt(item.id, alt);
      if (result.error) toast.error(result.error);
      else { toast.success("Alt text saved"); onAltSaved(item.id, alt); }
    });
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="truncate text-sm">{item.original_name}</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Preview */}
        <div className="aspect-square rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
          <MediaThumbnail item={item} />
        </div>
        {/* Info */}
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Details</p>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span>{item.mime_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size</span>
                <span>{formatBytes(item.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uploaded</span>
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">File URL</Label>
            <div className="flex gap-1.5">
              <Input value={item.url} readOnly className="text-xs h-8 font-mono" />
              <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={copyUrl}>
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Alt Text</Label>
            <Input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the image..."
              className="text-xs h-8"
            />
            <Button size="sm" variant="outline" onClick={saveAlt} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Save Alt
            </Button>
          </div>
        </div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="destructive" size="sm" onClick={() => onDelete(item)}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete
        </Button>
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
}

interface Props {
  initialMedia: MediaItem[];
}

export function MediaManager({ initialMedia }: Props) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "image" | "video" | "document">("all");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [toDelete, setToDelete] = useState<MediaItem | null>(null);
  const [deleting, startDelete] = useTransition();

  const handleUpload = async (files: File[]) => {
    if (!files.length) return;

    // Client-side size validation
    const oversized: UploadError[] = [];
    const valid: File[] = [];
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE) {
        oversized.push({ name: f.name, reason: `Too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is 50 MB.` });
      } else {
        valid.push(f);
      }
    }
    if (oversized.length) setUploadErrors((prev) => [...prev, ...oversized]);
    if (!valid.length) return;

    setIsUploading(true);
    setUploadProgress(valid.map((f) => ({ name: f.name, done: false })));

    const newErrors: UploadError[] = [];
    let succeeded = 0;

    await Promise.all(
      valid.map(async (file, i) => {
        try {
          const fd = new FormData();
          fd.append("file", file);
          const result = await uploadMediaFile(fd);
          if (result.error) {
            newErrors.push({ name: file.name, reason: result.error });
            setUploadProgress((prev) => prev.map((p, j) => j === i ? { ...p, done: true, error: result.error } : p));
          } else {
            succeeded++;
            setUploadProgress((prev) => prev.map((p, j) => j === i ? { ...p, done: true } : p));
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unexpected error";
          newErrors.push({ name: file.name, reason: msg });
          setUploadProgress((prev) => prev.map((p, j) => j === i ? { ...p, done: true, error: msg } : p));
        }
      })
    );

    if (newErrors.length) setUploadErrors((prev) => [...prev, ...newErrors]);
    if (succeeded) {
      toast.success(`${succeeded} file${succeeded > 1 ? "s" : ""} uploaded successfully`);
      const res = await fetch("/api/media");
      if (res.ok) setMedia(await res.json());
    }

    // Brief pause so user sees final state, then reset
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress([]);
    }, 800);
  };

  const handleDelete = (item: MediaItem) => {
    setToDelete(item);
    setSelected(null);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    startDelete(async () => {
      const result = await deleteMediaFile(toDelete.id, toDelete.storage_path ?? "");
      if (result.error) toast.error(result.error);
      else {
        toast.success("File deleted");
        setMedia((m) => m.filter((x) => x.id !== toDelete.id));
      }
      setToDelete(null);
    });
  };

  const handleAltSaved = (id: string, alt: string) => {
    setMedia((m) => m.map((x) => x.id === id ? { ...x, alt } : x));
  };

  const filtered = media.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.original_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "image" && item.mime_type.startsWith("image/")) ||
      (filter === "video" && item.mime_type.startsWith("video/")) ||
      (filter === "document" && !item.mime_type.startsWith("image/") && !item.mime_type.startsWith("video/"));
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{media.length} file{media.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Upload Zone */}
      <UploadZone
        onUpload={handleUpload}
        uploading={isUploading}
        progress={uploadProgress}
        errors={uploadErrors}
        onClearErrors={() => setUploadErrors([])}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex rounded-lg border overflow-hidden">
          {(["all", "image", "video", "document"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs capitalize transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setView("grid")}
            className={cn("p-1.5 transition-colors", view === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn("p-1.5 transition-colors", view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/30">
          <Upload className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">{search ? "No files match your search" : "No media yet"}</p>
          <p className="text-sm text-muted-foreground">
            {search ? "Try a different search term" : "Upload your first file using the area above"}
          </p>
        </div>
      )}

      {/* Grid view */}
      {view === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              className="group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            >
              <MediaThumbnail item={item} />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.url); toast.success("URL copied"); }}
                    className="p-1 rounded bg-white/20 hover:bg-white/40 text-white"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                    className="p-1 rounded bg-white/20 hover:bg-red-500/80 text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-white text-xs truncate">{item.original_name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && filtered.length > 0 && (
        <div className="border rounded-lg overflow-hidden divide-y">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer group"
              onClick={() => setSelected(item)}
            >
              <div className="h-10 w-10 rounded overflow-hidden border shrink-0 bg-muted">
                <MediaThumbnail item={item} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.original_name}</p>
                <p className="text-xs text-muted-foreground">{item.mime_type} · {formatBytes(item.size)}</p>
              </div>
              <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost" size="icon" className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.url); toast.success("URL copied"); }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); setSelected(item); }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground hidden md:block shrink-0">
                {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <MediaDetail
            item={selected}
            onClose={() => setSelected(null)}
            onDelete={handleDelete}
            onAltSaved={handleAltSaved}
          />
        )}
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{toDelete?.original_name}</strong> will be permanently removed from storage and the database. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
