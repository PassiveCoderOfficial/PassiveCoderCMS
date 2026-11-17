"use client";

import { useRef, useState } from "react";
import { compressImageForUpload } from "@/lib/media/client-compress";

type Item = { id: number; name: string; state: "uploading" | "done" | "error"; note?: string };

export function DropZone({ token }: { token: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [over, setOver] = useState(false);
  const seq = useRef(0);

  async function send(files: FileList | File[]) {
    for (const original of Array.from(files)) {
      const id = ++seq.current;
      setItems((prev) => [...prev, { id, name: original.name, state: "uploading" }]);
      const set = (patch: Partial<Item>) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
      try {
        const file = await compressImageForUpload(original).catch(() => original);
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`/api/drop/${token}`, { method: "POST", body: fd });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) set({ state: "error", note: j.error ?? "Upload failed" });
        else set({ state: "done" });
      } catch {
        set({ state: "error", note: "Network error" });
      }
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) send(e.dataTransfer.files); }}
        className={`w-full rounded-xl border-2 border-dashed px-4 py-10 text-sm transition-colors ${over ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
      >
        <span className="font-medium">Drop images here</span>
        <span className="block text-muted-foreground mt-1">or tap to choose (JPG, PNG, WebP, GIF, AVIF)</span>
      </button>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files?.length) send(e.target.files); e.target.value = ""; }} />
      {items.length > 0 && (
        <ul className="space-y-1 text-sm">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <span className="truncate">{it.name}</span>
              <span className={`shrink-0 text-xs font-medium ${it.state === "done" ? "text-green-600" : it.state === "error" ? "text-red-600" : "text-muted-foreground"}`}>
                {it.state === "done" ? "Uploaded" : it.state === "error" ? it.note : "Uploading..."}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
