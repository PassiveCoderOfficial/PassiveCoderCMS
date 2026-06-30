"use client";

import React, { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { getClientTenantId } from "@/lib/tenant/client";
import { createSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2, Trash2, Star, Upload, ImageIcon, Search, Grid3X3, List,
  X, Check, FolderOpen, Plus, Eye,
} from "lucide-react";
import Link from "next/link";
import { uploadMediaFile } from "@/app/(admin)/dashboard/media/actions";
import type { Product } from "@/types/cms";
import { cn } from "@/lib/utils";

// ─── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  short_description: z.string().optional(),
  type: z.enum(["simple", "variable", "digital"]),
  status: z.enum(["active", "draft", "archived"]),
  price: z.coerce.number().min(0),
  compare_price: z.coerce.number().optional(),
  cost_price: z.coerce.number().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  track_inventory: z.boolean(),
  stock_quantity: z.coerce.number().int().min(0),
  low_stock_threshold: z.coerce.number().int().min(0),
  weight: z.coerce.number().optional(),
  featured: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

// ─── Media library multi-picker dialog ────────────────────────────────────────

interface MediaItem {
  id: string; name: string; original_name: string; url: string;
  mime_type: string; size: number; created_at: string;
}

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

function MediaLibraryDialog({
  open, onOpenChange, onSelect, currentImages,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (urls: string[]) => void;
  currentImages: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, startUpload] = useTransition();

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      if (res.ok) setMedia(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) { fetchMedia(); setSelected(new Set()); }
  }, [open, fetchMedia]);

  const upload = (files: FileList | null) => {
    if (!files?.length) return;
    const valid = Array.from(files).filter(f => {
      if (f.size > MAX_UPLOAD_SIZE) { toast.error(`${f.name} exceeds 50 MB`); return false; }
      return f.type.startsWith("image/");
    });
    if (!valid.length) return;
    startUpload(async () => {
      await Promise.all(valid.map(file => {
        const fd = new FormData();
        fd.append("file", file);
        return uploadMediaFile(fd);
      }));
      toast.success(`${valid.length} image(s) uploaded`);
      fetchMedia();
    });
  };

  const toggle = (url: string) => {
    if (currentImages.includes(url)) return; // already added
    setSelected(prev => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  };

  const confirm = () => {
    if (selected.size) onSelect([...selected]);
    onOpenChange(false);
  };

  const filtered = media.filter(
    m => m.mime_type.startsWith("image/") &&
      (m.original_name.toLowerCase().includes(search.toLowerCase()) || m.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="text-sm font-semibold">Add Product Images</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Select multiple images — click to toggle selection</p>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-3 p-4 overflow-hidden">
          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); }}
            onDrop={e => { e.preventDefault(); upload(e.dataTransfer.files); }}
            onClick={() => !uploading && inputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all flex items-center justify-center gap-3",
              "border-border hover:border-primary/40 hover:bg-muted/30",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => upload(e.target.files)} />
            {uploading
              ? <><Loader2 className="h-4 w-4 animate-spin text-primary" /><span className="text-xs text-muted-foreground">Uploading…</span></>
              : <><Upload className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Upload new images — drag & drop or click</span></>
            }
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search images…" className="pl-7 h-8 text-xs" />
              {search && <button onClick={() => setSearch("")} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
            </div>
            <div className="flex rounded-md border overflow-hidden shrink-0">
              {(["grid", "list"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className={cn("p-1.5 transition-colors", view === v ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                  {v === "grid" ? <Grid3X3 className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Grid / list */}
          <div className="flex-1 overflow-y-auto min-h-0 rounded-lg border bg-muted/20">
            {loading ? (
              <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">{search ? "No images match" : "No images uploaded yet"}</p>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-2">
                {filtered.map(item => {
                  const alreadyAdded = currentImages.includes(item.url);
                  const isSelected = selected.has(item.url);
                  return (
                    <button key={item.id} onClick={() => toggle(item.url)} disabled={alreadyAdded}
                      className={cn(
                        "group relative aspect-square rounded-md overflow-hidden border-2 transition-all focus:outline-none bg-muted",
                        alreadyAdded ? "border-muted opacity-40 cursor-not-allowed" :
                          isSelected ? "border-primary" : "border-transparent hover:border-primary/60"
                      )}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 text-primary-foreground" />
                          </span>
                        </div>
                      )}
                      {alreadyAdded && (
                        <div className="absolute bottom-1 left-1 text-[9px] bg-background/80 px-1 rounded">Added</div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map(item => {
                  const alreadyAdded = currentImages.includes(item.url);
                  const isSelected = selected.has(item.url);
                  return (
                    <button key={item.id} onClick={() => toggle(item.url)} disabled={alreadyAdded}
                      className={cn("w-full flex items-center gap-3 p-2 hover:bg-muted/60 transition-colors text-left", alreadyAdded && "opacity-40 cursor-not-allowed")}>
                      <div className={cn("h-10 w-10 rounded overflow-hidden border-2 shrink-0 bg-muted", isSelected ? "border-primary" : "border-transparent")}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.original_name}</p>
                        <p className="text-[10px] text-muted-foreground">{alreadyAdded ? "Already added" : isSelected ? "Selected" : "Click to select"}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-muted-foreground">
            {selected.size > 0 ? `${selected.size} image${selected.size > 1 ? "s" : ""} selected` : "No images selected"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={confirm} disabled={selected.size === 0}>
              Add {selected.size > 0 ? selected.size : ""} Image{selected.size !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Product form ──────────────────────────────────────────────────────────────

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      short_description: product?.short_description ?? "",
      type: product?.type ?? "simple",
      status: product?.status ?? "draft",
      price: product?.price ?? 0,
      compare_price: product?.compare_price,
      cost_price: product?.cost_price,
      sku: product?.sku ?? "",
      barcode: product?.barcode ?? "",
      track_inventory: product?.track_inventory ?? true,
      stock_quantity: product?.stock_quantity ?? 0,
      low_stock_threshold: product?.low_stock_threshold ?? 5,
      weight: product?.weight,
      featured: product?.featured ?? false,
    },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("name", e.target.value);
    if (!product) form.setValue("slug", createSlug(e.target.value));
  };

  const removeImage = (i: number) => setImages(prev => prev.filter((_, j) => j !== i));
  const setPrimary = (i: number) => setImages(prev => [prev[i], ...prev.filter((_, j) => j !== i)]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const payload = {
        ...values, images,
        compare_price: values.compare_price || null,
        cost_price: values.cost_price || null,
        weight: values.weight || null,
      };
      if (product?.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw error;
        toast.success("Product updated");
      } else {
        const tenantId = await getClientTenantId();
        if (!tenantId) throw new Error("No tenant found for your account");
        const { error } = await supabase.from("products").insert({ ...payload, tenant_id: tenantId });
        if (error) throw error;
        toast.success("Product created");
        router.push("/dashboard/ecommerce/products");
      }
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MediaLibraryDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={urls => setImages(prev => [...prev, ...urls.filter(u => !prev.includes(u))])}
        currentImages={images}
      />

      <form onSubmit={form.handleSubmit(onSubmit as never)} className="space-y-5">

        {/* ── Images (top, prominent) ── */}
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Product Images</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Images
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {images.length === 0 ? (
              <button type="button" onClick={() => setPickerOpen(true)}
                className="w-full border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:bg-muted/20 transition-colors">
                <ImageIcon className="h-8 w-8 opacity-40" />
                <span className="text-sm">Click to add product images</span>
                <span className="text-xs">Choose from media library or upload new</span>
              </button>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {images.map((url, i) => (
                  <div key={i} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded font-semibold leading-tight">
                        Primary
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      {i !== 0 && (
                        <button type="button" onClick={() => setPrimary(i)} title="Set primary"
                          className="h-7 w-7 rounded-full bg-white/20 hover:bg-yellow-500 text-white flex items-center justify-center transition-colors">
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button type="button" onClick={() => removeImage(i)} title="Remove"
                        className="h-7 w-7 rounded-full bg-white/20 hover:bg-destructive text-white flex items-center justify-center transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Add more slot */}
                <button type="button" onClick={() => setPickerOpen(true)}
                  className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/60 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                  <Plus className="h-5 w-5" />
                  <span className="text-[10px]">More</span>
                </button>
              </div>
            )}
            {images.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">First image is the primary. Hover to remove or ★ to set as primary.</p>
            )}
          </CardContent>
        </Card>

        {/* ── Basic info + Status/Type side by side ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Product Details</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="space-y-1.5">
                  <Label>Product Name</Label>
                  <Input {...form.register("name")} onChange={handleNameChange} placeholder="My awesome product" />
                  {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input {...form.register("slug")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Short Description</Label>
                  <Textarea {...form.register("short_description")} rows={2} placeholder="One-line summary shown in listings" />
                </div>
                <div className="space-y-1.5">
                  <Label>Full Description</Label>
                  <Textarea {...form.register("description")} rows={5} placeholder="Detailed product description…" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Pricing</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5"><Label>Regular Price</Label><Input type="number" step="0.01" min="0" {...form.register("price")} /></div>
                  <div className="space-y-1.5"><Label>Compare Price</Label><Input type="number" step="0.01" {...form.register("compare_price")} placeholder="Was…" /></div>
                  <div className="space-y-1.5"><Label>Cost Price</Label><Input type="number" step="0.01" {...form.register("cost_price")} placeholder="Your cost" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>SKU</Label><Input {...form.register("sku")} /></div>
                  <div className="space-y-1.5"><Label>Barcode</Label><Input {...form.register("barcode")} /></div>
                </div>
                <div className="space-y-1.5 max-w-xs"><Label>Weight (kg)</Label><Input type="number" step="0.001" {...form.register("weight")} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Inventory</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div><Label>Track Inventory</Label><p className="text-xs text-muted-foreground">Monitor stock levels</p></div>
                  <Switch defaultChecked={form.getValues("track_inventory")} onCheckedChange={v => form.setValue("track_inventory", v)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Stock Quantity</Label><Input type="number" {...form.register("stock_quantity")} /></div>
                  <div className="space-y-1.5"><Label>Low Stock Threshold</Label><Input type="number" {...form.register("low_stock_threshold")} /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Sidebar: status, type, featured ── */}
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Publish</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select defaultValue={form.getValues("status")} onValueChange={v => form.setValue("status", v as "active" | "draft" | "archived")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Product Type</Label>
                  <Select defaultValue={form.getValues("type")} onValueChange={v => form.setValue("type", v as "simple" | "variable" | "digital")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                      <SelectItem value="digital">Digital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Featured</Label><p className="text-xs text-muted-foreground">Show in featured sections</p></div>
                  <Switch {...form.register("featured")} onCheckedChange={v => form.setValue("featured", v)} defaultChecked={form.getValues("featured")} />
                </div>
                {product && (
                  <Button variant="outline" size="sm" className="w-full gap-1.5" asChild>
                    <Link href={`/products/${form.getValues("slug")}`} target="_blank">
                      <Eye className="h-3.5 w-3.5" /> View Product
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4 px-4">
                <p className="text-xs text-muted-foreground mb-3">{images.length} image{images.length !== 1 ? "s" : ""} added</p>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {product ? "Update Product" : "Create Product"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => router.back()} className="w-full mt-2">
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </>
  );
}
