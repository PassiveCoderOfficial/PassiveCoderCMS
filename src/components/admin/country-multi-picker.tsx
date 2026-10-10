"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { COUNTRIES, countryName, flagUrl } from "@/lib/countries";

/** Searchable multi-select of countries: type "qa" or "qat" and pick Qatar.
 *  Value is a list of lowercase ISO codes. Shared, reuse anywhere. */
export function CountryMultiPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return COUNTRIES.filter((c) => !value.includes(c.code) && (c.code === s || c.name.toLowerCase().includes(s)))
      .sort((a, b) => Number(b.code === s) - Number(a.code === s) || Number(b.name.toLowerCase().startsWith(s)) - Number(a.name.toLowerCase().startsWith(s)))
      .slice(0, 8);
  }, [q, value]);

  const add = (code: string) => { onChange([...value, code]); setQ(""); };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded-md border bg-muted/50 pl-1 pr-0.5 py-0.5 text-[11px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={flagUrl(c)} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
              {countryName(c)}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== c))} className="rounded p-0.5 hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${countryName(c)}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) { e.preventDefault(); add(matches[0].code); } }}
          placeholder="Type a country, e.g. Qa"
          className="w-full h-8 rounded-md border bg-background px-2 text-xs"
        />
        {open && matches.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md py-1 max-h-56 overflow-auto">
            {matches.map((c) => (
              <button key={c.code} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(c.code)}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-xs hover:bg-muted text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={flagUrl(c.code)} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
                <span className="flex-1">{c.name}</span>
                <span className="text-muted-foreground uppercase">{c.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
