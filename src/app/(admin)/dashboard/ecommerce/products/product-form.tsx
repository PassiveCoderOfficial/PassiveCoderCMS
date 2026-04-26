"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { createSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Star } from "lucide-react";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import type { Product } from "@/types/cms";

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

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(product?.images ?? []);

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

  const addImage = (url: string) => {
    if (url && !images.includes(url)) setImages((prev) => [...prev, url]);
  };

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, j) => j !== i));

  const setPrimary = (i: number) => {
    if (i === 0) return;
    setImages((prev) => [prev[i], ...prev.filter((_, j) => j !== i)]);
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const payload = {
        ...values,
        images,
        compare_price: values.compare_price || null,
        cost_price: values.cost_price || null,
        weight: values.weight || null,
      };

      if (product?.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw error;
        toast.success("Product updated");
      } else {
        const { error } = await supabase.from("products").insert(payload);
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
    <form onSubmit={form.handleSubmit(onSubmit as never)}>
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="images">Images {images.length > 0 && <span className="ml-1 text-xs opacity-60">({images.length})</span>}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card><CardContent className="pt-4 space-y-4">
            <div className="space-y-1.5"><Label>Product Name</Label><Input {...form.register("name")} onChange={handleNameChange} /></div>
            <div className="space-y-1.5"><Label>Slug</Label><Input {...form.register("slug")} /></div>
            <div className="space-y-1.5"><Label>Short Description</Label><Textarea {...form.register("short_description")} rows={2} /></div>
            <div className="space-y-1.5"><Label>Full Description</Label><Textarea {...form.register("description")} rows={6} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Product Type</Label>
                <Select defaultValue={form.getValues("type")} onValueChange={(v) => form.setValue("type", v as "simple" | "variable" | "digital")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="variable">Variable</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select defaultValue={form.getValues("status")} onValueChange={(v) => form.setValue("status", v as "active" | "draft" | "archived")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Featured Product</Label>
              <Switch {...form.register("featured")} onCheckedChange={(v) => form.setValue("featured", v)} defaultChecked={form.getValues("featured")} />
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card><CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Regular Price</Label><Input type="number" step="0.01" {...form.register("price")} /></div>
              <div className="space-y-1.5"><Label>Compare Price</Label><Input type="number" step="0.01" {...form.register("compare_price")} placeholder="Strikethrough price" /></div>
              <div className="space-y-1.5"><Label>Cost Price</Label><Input type="number" step="0.01" {...form.register("cost_price")} placeholder="Your cost" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>SKU</Label><Input {...form.register("sku")} /></div>
              <div className="space-y-1.5"><Label>Barcode</Label><Input {...form.register("barcode")} /></div>
            </div>
            <div className="space-y-1.5"><Label>Weight (kg)</Label><Input type="number" step="0.001" {...form.register("weight")} className="max-w-xs" /></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card><CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div><Label>Track Inventory</Label><p className="text-xs text-muted-foreground">Monitor stock levels</p></div>
              <Switch defaultChecked={form.getValues("track_inventory")} onCheckedChange={(v) => form.setValue("track_inventory", v)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Stock Quantity</Label><Input type="number" {...form.register("stock_quantity")} /></div>
              <div className="space-y-1.5"><Label>Low Stock Threshold</Label><Input type="number" {...form.register("low_stock_threshold")} /></div>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <Card><CardContent className="pt-4 space-y-4">
            {/* Existing images grid */}
            {images.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Product images — first image is the primary. Click ★ to set primary.
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {images.map((url, i) => (
                    <div key={i} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {/* Primary badge */}
                      {i === 0 && (
                        <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-medium">
                          Primary
                        </span>
                      )}
                      {/* Hover actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        {i !== 0 && (
                          <button
                            type="button"
                            onClick={() => setPrimary(i)}
                            title="Set as primary"
                            className="h-7 w-7 rounded-full bg-white/20 hover:bg-yellow-500 text-white flex items-center justify-center transition-colors"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          title="Remove"
                          className="h-7 w-7 rounded-full bg-white/20 hover:bg-destructive text-white flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add slot */}
                  <div className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                    <MediaPickerInput
                      value=""
                      onChange={addImage}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Empty state — full picker */}
            {images.length === 0 && (
              <div className="space-y-2">
                <Label>Product Images</Label>
                <MediaPickerInput
                  value=""
                  onChange={addImage}
                  placeholder="Choose from media library"
                />
              </div>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 mt-6">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {product ? "Update Product" : "Create Product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
