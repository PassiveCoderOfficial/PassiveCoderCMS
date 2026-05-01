"use client";

import { useState, useRef, useEffect } from "react";

export const COUNTRY_CODES = [
  { code: "+880", flag: "🇧🇩", name: "Bangladesh", iso: "BD" },
  { code: "+971", flag: "🇦🇪", name: "UAE", iso: "AE" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia", iso: "SA" },
  { code: "+65",  flag: "🇸🇬", name: "Singapore", iso: "SG" },
  { code: "+60",  flag: "🇲🇾", name: "Malaysia", iso: "MY" },
  { code: "+974",  flag: "🇶🇦", name: "Qatar", iso: "QA" },
  { code: "+91",  flag: "🇮🇳", name: "India", iso: "IN" },
  { code: "+44",  flag: "🇬🇧", name: "UK", iso: "GB" },
  { code: "+1",   flag: "🇺🇸", name: "USA / Canada", iso: "US" },
  { code: "+61",  flag: "🇦🇺", name: "Australia", iso: "AU" },
  { code: "+49",  flag: "🇩🇪", name: "Germany", iso: "DE" },
  { code: "+33",  flag: "🇫🇷", name: "France", iso: "FR" },
  { code: "+55",  flag: "🇧🇷", name: "Brazil", iso: "BR" },
  { code: "+86",  flag: "🇨🇳", name: "China", iso: "CN" },
  { code: "+81",  flag: "🇯🇵", name: "Japan", iso: "JP" },
];

const DEFAULT_COUNTRY = COUNTRY_CODES[0]; // Bangladesh

function splitPhone(value: string): { prefix: string; local: string } {
  if (!value) return { prefix: DEFAULT_COUNTRY.code, local: "" };
  const match = COUNTRY_CODES.find(c => value.startsWith(c.code));
  if (match) return { prefix: match.code, local: value.slice(match.code.length).trimStart() };
  if (value.startsWith("+")) return { prefix: DEFAULT_COUNTRY.code, local: value };
  return { prefix: DEFAULT_COUNTRY.code, local: value };
}

interface PhoneInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export function PhoneInput({ value, onChange, placeholder = "1700 000000", className, inputClassName, disabled }: PhoneInputProps) {
  const { prefix: initPrefix, local: initLocal } = splitPhone(value);
  const [prefix, setPrefix] = useState(initPrefix);
  const [local, setLocal] = useState(initLocal);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { prefix: p, local: l } = splitPhone(value);
    setPrefix(p);
    setLocal(l);
  }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function commit(p: string, l: string) {
    const trimmed = l.trimStart();
    onChange(trimmed ? `${p} ${trimmed}` : "");
  }

  const selected = COUNTRY_CODES.find(c => c.code === prefix) ?? DEFAULT_COUNTRY;

  return (
    <div ref={ref} className={`relative flex items-stretch ${className ?? ""}`}>
      {/* Country prefix button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 shrink-0 border border-r-0 rounded-l-md px-2 bg-muted hover:bg-muted/80 transition-colors text-sm font-medium select-none"
        style={{ minWidth: 72 }}
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="text-xs text-muted-foreground">{selected.code}</span>
        <svg className="w-3 h-3 text-muted-foreground ml-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Local number input */}
      <input
        type="tel"
        value={local}
        disabled={disabled}
        onChange={e => {
          const v = e.target.value;
          setLocal(v);
          commit(prefix, v);
        }}
        placeholder={placeholder}
        className={`flex-1 border rounded-r-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring ${inputClassName ?? ""}`}
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-popover border rounded-lg shadow-lg overflow-auto max-h-60 min-w-56">
          {COUNTRY_CODES.map(c => (
            <button
              key={c.iso}
              type="button"
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors text-left ${c.code === prefix ? "bg-muted font-semibold" : ""}`}
              onClick={() => {
                setPrefix(c.code);
                setOpen(false);
                commit(c.code, local);
              }}
            >
              <span className="text-base">{c.flag}</span>
              <span className="flex-1 truncate">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
