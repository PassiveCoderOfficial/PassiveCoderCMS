"use client";

import { Plus, X } from "lucide-react";
import { MediaPickerInput } from "@/components/admin/media-picker-input";

export type PickedImage = { url: string; alt?: string };

/** List of images picked from the media library (logos, badges, partners).
 *  Shared, reuse anywhere a block needs a small image set. */
export function MultiImagePicker({ value, onChange, max = 12 }: { value: PickedImage[]; onChange: (v: PickedImage[]) => void; max?: number }) {
  const set = (i: number, patch: Partial<PickedImage>) => onChange(value.map((img, j) => (j === i ? { ...img, ...patch } : img)));
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((img, i) => (
            <div key={i} className="relative group rounded-md border bg-white p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt ?? ""} className="h-12 w-full object-contain" />
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-background border shadow flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-destructive" aria-label="Remove image">
                <X className="h-3 w-3" />
              </button>
              <input value={img.alt ?? ""} onChange={(e) => set(i, { alt: e.target.value })} placeholder="Name"
                className="mt-1 w-full rounded border px-1 py-0.5 text-[10px] text-foreground bg-background" />
            </div>
          ))}
        </div>
      )}
      {value.length < max && (
        <div className="rounded-md border border-dashed p-2">
          <p className="mb-1.5 flex items-center gap-1 text-[11px] text-muted-foreground"><Plus className="h-3 w-3" /> Add image</p>
          <MediaPickerInput compact value="" onChange={(url) => url && onChange([...value, { url }])} />
        </div>
      )}
    </div>
  );
}
