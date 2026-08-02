"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SidePanel } from "@/components/ui/side-panel";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  PLATFORMS, PLATFORM_LABELS, PLATFORM_COLORS, BRAND_KINDS,
  type BrandChannel, type BrandKind, type BrandProfile, type Platform,
} from "@/lib/scheduler/types";
import { saveBrand, deleteBrand } from "../actions";

const KIND_LABELS: Record<string, string> = {
  company: "Company", personal: "Personal brand", product: "Product", other: "Other",
};

/** Common IANA zones for the markets Passive Coder works in; free text would
 *  invite typos that silently shift every scheduled post. */
const TIMEZONES = [
  "Asia/Dhaka", "Asia/Singapore", "Asia/Kolkata", "Asia/Dubai",
  "Europe/London", "America/New_York", "Australia/Sydney", "UTC",
];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function BrandsClient({
  brands, channels,
}: { brands: BrandProfile[]; channels: BrandChannel[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<BrandProfile | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Brands</h1>
          <p className="text-sm text-muted-foreground">
            Each brand has its own channels, colour and posting timezone.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setCreating(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> New brand
        </Button>
      </div>

      {brands.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No brands yet. Add one to start scheduling content.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => {
            const own = channels.filter((c) => c.brand_id === b.id);
            return (
              <div key={b.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: b.color }} />
                    <div>
                      <p className="text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {KIND_LABELS[b.kind]} · {b.timezone}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => { setCreating(false); setEditing(b); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {b.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{b.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1">
                  {own.map((c) => (
                    <span key={c.id}
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                      style={{ background: PLATFORM_COLORS[c.platform as Platform] }}>
                      {PLATFORM_LABELS[c.platform as Platform]}
                    </span>
                  ))}
                  {own.length === 0 && (
                    <span className="text-[11px] text-muted-foreground">No channels yet</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(editing || creating) && (
        <BrandSheet
          brand={editing}
          channels={channels}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); router.refresh(); }}
        />
      )}
    </div>
  );
}

function BrandSheet({
  brand, channels, onClose, onSaved,
}: {
  brand: BrandProfile | null;
  channels: BrandChannel[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(brand?.name ?? "");
  const [slug, setSlug] = useState(brand?.slug ?? "");
  const [kind, setKind] = useState(brand?.kind ?? "company");
  const [description, setDescription] = useState(brand?.description ?? "");
  const [color, setColor] = useState(brand?.color ?? "#f97316");
  const [timezone, setTimezone] = useState(brand?.timezone ?? "Asia/Dhaka");
  const [platforms, setPlatforms] = useState<Platform[]>(
    channels.filter((c) => c.brand_id === brand?.id).map((c) => c.platform as Platform),
  );

  const save = () => {
    setError(null);
    if (!name.trim()) return setError("Name is required.");
    startTransition(async () => {
      const res = await saveBrand({
        id: brand?.id,
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        kind,
        description,
        color,
        timezone,
        platforms,
      });
      if (res?.error) setError(res.error);
      else onSaved();
    });
  };

  return (
    <SidePanel
      open
      onOpenChange={(o) => !o && onClose()}
      title={brand ? "Edit brand" : "New brand"}
      widthClass="sm:max-w-md"
      footer={
        <>
          {brand && (
            <Button variant="outline" size="icon" title="Delete brand"
              className="text-red-600 hover:text-red-700"
              onClick={() => startTransition(async () => {
                await deleteBrand(brand.id); onSaved();
              })}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={pending}>
              {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </>
      }
    >
        <div className="space-y-4 px-4 py-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Name</Label>
            <Input value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!brand) setSlug(slugify(e.target.value));
              }}
              placeholder="Passive Coder" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="passive-coder" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Kind</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as BrandKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BRAND_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>{KIND_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Colour</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border bg-transparent" />
              <Input value={color} onChange={(e) => setColor(e.target.value)} className="h-8" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Description</Label>
            <Textarea rows={2} value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this brand posts about" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Channels</Label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.filter((p) => p !== "other").map((p) => {
                const on = platforms.includes(p);
                return (
                  <button key={p} type="button"
                    onClick={() => setPlatforms((prev) =>
                      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      on ? "border-transparent text-white" : "hover:bg-muted",
                    )}
                    style={on ? { background: PLATFORM_COLORS[p] } : undefined}>
                    {PLATFORM_LABELS[p]}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Removing a channel deletes it from this brand; scheduled posts already
              targeting it keep their record.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    </SidePanel>
  );
}
