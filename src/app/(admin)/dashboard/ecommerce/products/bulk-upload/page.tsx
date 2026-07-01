"use client";

import React, { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, FileText, ImageIcon, Loader2, Plus, Trash2, Check, X, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getClientTenantId } from "@/lib/tenant/client";
import { createSlug } from "@/lib/utils";
import { uploadMediaFile } from "@/app/(admin)/dashboard/media/actions";
import { toast } from "sonner";

interface RowProduct {
  _key: string;
  image: string | null;
  imageFile: File | null;
  name: string;
  price: string;
  sale_price: string;
  short_description: string;
  category_id: string;  // single category for this row
  category_all: boolean; // apply this category to all rows below
}

interface Category { id: string; name: string; }

function uid() { return Math.random().toString(36).slice(2); }

function parseCSV(text: string): Omit<RowProduct, "_key" | "imageFile" | "category_id" | "category_all">[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, ""));
  return lines.slice(1).map((line) => {
    // Handle quoted fields
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { cols.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    cols.push(cur.trim());

    const get = (keys: string[]) => {
      for (const k of keys) {
        const idx = headers.indexOf(k);
        if (idx !== -1 && cols[idx]) return cols[idx];
      }
      return "";
    };

    const imageUrl = get(["image_url", "image", "images", "image_link", "picture"]);
    return {
      name: get(["name", "product_name", "title"]),
      price: get(["price", "regular_price"]),
      sale_price: get(["sale_price", "compare_price", "compare"]),
      short_description: get(["short_description", "description", "desc"]),
      image: imageUrl || null,
    };
  }).filter((r) => r.name);
}

// ─── Category select for a row ─────────────────────────────────────────────────
function CategorySelect({
  value,
  applyAll,
  categories,
  onChange,
  onApplyAllChange,
  rowIndex,
  totalRows,
}: {
  value: string;
  applyAll: boolean;
  categories: Category[];
  onChange: (id: string) => void;
  onApplyAllChange: (v: boolean, fromIndex: number) => void;
  rowIndex: number;
  totalRows: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const selected = categories.find((c) => c.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs border rounded px-2 py-1.5 w-full text-left hover:bg-muted/40 transition-colors min-w-[120px]"
      >
        <span className="flex-1 truncate">{selected?.name ?? <span className="text-muted-foreground">— none —</span>}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-background border rounded-xl shadow-xl p-2 min-w-[200px] space-y-1">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className="w-full text-left text-xs px-3 py-1.5 rounded hover:bg-muted text-muted-foreground"
          >
            — No category —
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onChange(c.id); setOpen(false); }}
              className={`w-full text-left text-xs px-3 py-1.5 rounded hover:bg-muted ${value === c.id ? "font-semibold" : ""}`}
            >
              {c.name}
            </button>
          ))}

          {rowIndex < totalRows - 1 && (
            <div className="border-t pt-2 mt-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer px-1">
                <input
                  type="checkbox"
                  checked={applyAll}
                  onChange={(e) => { onApplyAllChange(e.target.checked, rowIndex); setOpen(false); }}
                  className="accent-primary"
                />
                Apply this to all rows below
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function BulkUploadPage() {
  const router = useRouter();
  const [rows, setRows] = useState<RowProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, startSubmit] = useTransition();
  const [uploadingImages, setUploadingImages] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // Batch-level defaults applied to ALL rows on save
  const [batchStatus, setBatchStatus] = useState<"draft" | "active">("draft");
  const [batchTracked, setBatchTracked] = useState(false); // false = "In Stock" (untracked)
  const [batchStock, setBatchStock] = useState("0");

  // Inline category creation
  const [newCategory, setNewCategory] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    getClientTenantId().then((tenantId) => {
      let q = supabase.from("categories").select("id,name").eq("type", "product").order("name");
      if (tenantId) q = q.eq("tenant_id", tenantId);
      q.then(({ data }) => setCategories((data as Category[]) ?? []));
    });
  }, []);

  async function createCategory() {
    const name = newCategory.trim();
    if (!name) return;
    setCreatingCat(true);
    try {
      const supabase = createClient();
      const tenantId = await getClientTenantId();
      const { data, error } = await supabase
        .from("categories")
        .insert({ name, slug: createSlug(name), type: "product", tenant_id: tenantId })
        .select("id,name")
        .single();
      if (error) throw error;
      setCategories((prev) => [...prev, data as Category].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategory("");
      toast.success(`Category "${name}" created`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setCreatingCat(false);
    }
  }

  // ── Drop zone handler ──────────────────────────────────────────────────────
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);

    const csvFiles = files.filter((f) => f.name.endsWith(".csv") || f.type === "text/csv");
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));

    if (csvFiles.length > 0) {
      // CSV mode
      const text = await csvFiles[0].text();
      const parsed = parseCSV(text);
      const newRows: RowProduct[] = parsed.map((r) => ({
        _key: uid(),
                imageFile: null,
        category_id: "",
        category_all: false,
        ...r,
      }));
      setRows(newRows);
      toast.success(`${newRows.length} products loaded from CSV`);
    } else if (imageFiles.length > 0) {
      // Image mode — create one row per image
      const newRows: RowProduct[] = imageFiles.map((f) => ({
        _key: uid(),
        image: URL.createObjectURL(f),
        imageFile: f,
        name: f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        price: "",
        sale_price: "",
        short_description: "",
        category_id: "",
        category_all: false,
      }));
      setRows((prev) => [...prev, ...newRows]);
      toast.success(`${imageFiles.length} image(s) added as product rows`);
    }
  }, []);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() { setDragging(false); }

  // ── Manual file input ──────────────────────────────────────────────────────
  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const csvFiles = files.filter((f) => f.name.endsWith(".csv") || f.type === "text/csv");
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));

    if (csvFiles.length > 0) {
      const text = await csvFiles[0].text();
      const parsed = parseCSV(text);
      const newRows: RowProduct[] = parsed.map((r) => ({
        _key: uid(),
                imageFile: null,
        category_id: "",
        category_all: false,
        ...r,
      }));
      setRows(newRows);
      toast.success(`${newRows.length} products loaded from CSV`);
    }
    if (imageFiles.length > 0) {
      const newRows: RowProduct[] = imageFiles.map((f) => ({
        _key: uid(),
        image: URL.createObjectURL(f),
        imageFile: f,
        name: f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        price: "",
        sale_price: "",
        short_description: "",
        category_id: "",
        category_all: false,
      }));
      setRows((prev) => [...prev, ...newRows]);
    }
    e.target.value = "";
  }

  // ── Row mutations ──────────────────────────────────────────────────────────
  function updateRow(key: string, patch: Partial<RowProduct>) {
    setRows((prev) => prev.map((r) => r._key === key ? { ...r, ...patch } : r));
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r._key !== key));
  }

  function addBlankRow() {
    setRows((prev) => [...prev, {
      _key: uid(), image: null, imageFile: null,
      name: "", price: "", sale_price: "", short_description: "",
      category_id: "", category_all: false,
    }]);
  }

  function handleApplyAllCategory(categoryId: string, fromIndex: number) {
    setRows((prev) => prev.map((r, i) => i > fromIndex ? { ...r, category_id: categoryId } : r));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const valid = rows.filter((r) => r.name.trim());
    if (!valid.length) { toast.error("No valid products to save"); return; }

    startSubmit(async () => {
      try {
        setUploadingImages(true);
        const supabase = createClient();
        const tenantId = await getClientTenantId();

        // Upload pending images
        const withUrls = await Promise.all(valid.map(async (row) => {
          if (row.imageFile) {
            const fd = new FormData();
            fd.append("file", row.imageFile);
            const result = await uploadMediaFile(fd);
            return { ...row, image: result.url ?? null };
          }
          return row;
        }));
        setUploadingImages(false);

        // Build insert rows — batch-level status/stock applied to all
        const stockN = parseInt(batchStock, 10) || 0;
        const inserts = withUrls.map((row) => ({
          name: row.name.trim(),
          slug: createSlug(row.name.trim()) + "-" + uid().slice(0, 4),
          price: parseFloat(row.price) || 0,
          compare_price: parseFloat(row.sale_price) || null,
          short_description: row.short_description || null,
          images: row.image ? [row.image] : [],
          category_ids: row.category_id ? [row.category_id] : [],
          status: batchStatus,
          type: "simple",
          track_inventory: batchTracked,
          stock_quantity: batchTracked ? stockN : 0,
          low_stock_threshold: 5,
          featured: false,
          tenant_id: tenantId,
        }));

        const { error } = await supabase.from("products").insert(inserts);
        if (error) throw error;

        toast.success(`${inserts.length} products created successfully`);
        router.push("/dashboard/ecommerce/products");
      } catch (err) {
        setUploadingImages(false);
        toast.error(err instanceof Error ? err.message : "Failed to save products");
      }
    });
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/ecommerce/products" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Multiple Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Drop a CSV file or multiple images to bulk-create products</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          dragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/40 hover:bg-muted/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,text/csv,image/*"
          className="hidden"
          onChange={handleFileInput}
        />
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-xs text-muted-foreground">CSV file</span>
          </div>
          <span className="text-muted-foreground text-sm">or</span>
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-xs text-muted-foreground">Multiple images</span>
          </div>
        </div>
        <p className="text-sm font-medium">Drop files here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1.5">
          <strong>CSV:</strong> columns — name, price, sale_price, short_description &nbsp;·&nbsp;
          <strong>Images:</strong> one row per image, edit details below
        </p>
      </div>

      {/* CSV template download hint */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          CSV columns: <code className="bg-muted px-1 rounded">name, price, sale_price, short_description, image_url</code>
          {" "}— first row must be headers.
          <br />
          <code className="bg-muted px-1 rounded">image_url</code>: a full web URL (https://…) to fetch the image from,
          or a media-library link you copied from{" "}
          <Link href="/dashboard/media" className="underline">Media</Link>.
        </span>
      </div>

      {/* Product rows grid */}
      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">{rows.length} product{rows.length !== 1 ? "s" : ""} to import</h2>
            <button
              type="button"
              onClick={addBlankRow}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border rounded-lg px-3 py-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Add Row
            </button>
          </div>

          {/* Batch settings — applied to ALL rows on save */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-muted/30 p-3 text-xs">
            <span className="font-semibold text-muted-foreground">Apply to all:</span>

            <label className="flex items-center gap-1.5">
              Status
              <select
                value={batchStatus}
                onChange={(e) => setBatchStatus(e.target.value as "draft" | "active")}
                className="border rounded px-2 py-1 bg-background outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="draft">Draft</option>
                <option value="active">Active (published)</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5">
              Stock
              <select
                value={batchTracked ? "tracked" : "instock"}
                onChange={(e) => setBatchTracked(e.target.value === "tracked")}
                className="border rounded px-2 py-1 bg-background outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="instock">In Stock (untracked)</option>
                <option value="tracked">Track quantity</option>
              </select>
            </label>

            {batchTracked && (
              <label className="flex items-center gap-1.5">
                Qty
                <input
                  type="number"
                  min="0"
                  value={batchStock}
                  onChange={(e) => setBatchStock(e.target.value)}
                  className="border rounded px-2 py-1 w-20 bg-background outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
            )}

            {/* Add category inline */}
            <div className="flex items-center gap-1.5 ml-auto">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); createCategory(); } }}
                placeholder="New category…"
                className="border rounded px-2 py-1 bg-background outline-none focus:ring-1 focus:ring-primary w-36"
              />
              <button
                type="button"
                onClick={createCategory}
                disabled={creatingCat || !newCategory.trim()}
                className="flex items-center gap-1 border rounded px-2 py-1 hover:bg-muted disabled:opacity-50"
              >
                {creatingCat ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add
              </button>
            </div>
          </div>

          {/* Table header */}
          <div className="rounded-xl border overflow-hidden">
            <div className="grid grid-cols-[56px_1fr_110px_110px_1fr_160px_32px] gap-0 bg-muted/40 border-b text-xs font-medium text-muted-foreground px-3 py-2.5">
              <span>Image</span>
              <span className="px-2">Product Name</span>
              <span className="px-2">Regular Price</span>
              <span className="px-2">Sale Price</span>
              <span className="px-2">Short Description</span>
              <span className="px-2">Category</span>
              <span />
            </div>

            <div className="divide-y">
              {rows.map((row, idx) => (
                <div key={row._key} className="grid grid-cols-[56px_1fr_110px_110px_1fr_160px_32px] gap-0 items-center px-3 py-2 hover:bg-muted/10 transition-colors">
                  {/* Image thumbnail */}
                  <div className="w-11 h-11 rounded-lg border overflow-hidden bg-muted shrink-0 relative group">
                    {row.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.image} alt={row.name} className="w-full h-full object-cover" />
                    ) : (
                      <label className="w-full h-full flex items-center justify-center cursor-pointer">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            updateRow(row._key, { image: URL.createObjectURL(file), imageFile: file });
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Name */}
                  <div className="px-2">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(row._key, { name: e.target.value })}
                      placeholder="Product name *"
                      className="w-full text-xs border rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary bg-background"
                    />
                  </div>

                  {/* Regular price */}
                  <div className="px-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.price}
                      onChange={(e) => updateRow(row._key, { price: e.target.value })}
                      placeholder="0.00"
                      className="w-full text-xs border rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary bg-background"
                    />
                  </div>

                  {/* Sale price */}
                  <div className="px-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.sale_price}
                      onChange={(e) => updateRow(row._key, { sale_price: e.target.value })}
                      placeholder="0.00"
                      className="w-full text-xs border rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary bg-background"
                    />
                  </div>

                  {/* Short description */}
                  <div className="px-2">
                    <input
                      type="text"
                      value={row.short_description}
                      onChange={(e) => updateRow(row._key, { short_description: e.target.value })}
                      placeholder="Short description"
                      className="w-full text-xs border rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary bg-background"
                    />
                  </div>

                  {/* Category */}
                  <div className="px-2">
                    <CategorySelect
                      value={row.category_id}
                      applyAll={row.category_all}
                      categories={categories}
                      rowIndex={idx}
                      totalRows={rows.length}
                      onChange={(id) => updateRow(row._key, { category_id: id })}
                      onApplyAllChange={(checked, fromIndex) => {
                        updateRow(row._key, { category_all: checked });
                        if (checked) handleApplyAllCategory(row.category_id, fromIndex);
                      }}
                    />
                  </div>

                  {/* Remove */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row._key)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || uploadingImages}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {(submitting || uploadingImages)
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Check className="h-4 w-4" />}
              {uploadingImages ? "Uploading images…" : submitting ? "Saving…" : `Save ${rows.filter(r => r.name.trim()).length} Products`}
            </button>
            <Link href="/dashboard/ecommerce/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
