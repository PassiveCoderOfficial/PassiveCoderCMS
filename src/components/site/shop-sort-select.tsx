"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Sort menu for the classic shop layout: changing it reloads the listing. */
export function ShopSortSelect({ value, options }: { value: string; options: { key: string; label: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <select
      aria-label="Sort products"
      value={value}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        next.delete("page");
        if (e.target.value) next.set("sort", e.target.value); else next.delete("sort");
        const qs = next.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
      }}
      className="h-9 rounded border border-border bg-muted/60 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
    >
      {options.map((o) => (
        <option key={o.key} value={o.key}>{o.key === "" ? "Default sorting" : `Sort by ${o.label.toLowerCase()}`}</option>
      ))}
    </select>
  );
}
