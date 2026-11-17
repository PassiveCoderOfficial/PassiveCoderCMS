"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Loader2, Search, X } from "lucide-react";
import { useSiteCurrency } from "@/lib/hooks/use-site-currency";
import { SEARCH_TYPE_LABEL, type SearchHit } from "@/lib/search/site-search";

const BADGE: Record<SearchHit["type"], string> = {
  product: "bg-emerald-100 text-emerald-800",
  category: "bg-sky-100 text-sky-800",
  post: "bg-violet-100 text-violet-800",
  page: "bg-neutral-100 text-neutral-700",
};

/**
 * Live suggestions for any search form on the site. Drop it inside a
 * `<form>` that has an `<input name="q">` (the form must be `relative`): it
 * watches that input, shows up to `limit` matches as you type, each with a
 * type badge, and supports arrow keys, Enter and Escape. Submitting the form
 * still goes to the full results page.
 *
 * Recent searches are kept per browser (localStorage) and shown when the
 * box is focused while empty; each can be removed, or all cleared.
 */
const HISTORY_KEY = "site-search-history";
const HISTORY_MAX = 8;

function readHistory(): string[] {
  try { const v = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; }
}
function writeHistory(list: string[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX))); } catch { /* private mode */ }
}
function rememberSearch(term: string) {
  const t = term.trim();
  if (t.length < 2) return;
  writeHistory([t, ...readHistory().filter((x) => x.toLowerCase() !== t.toLowerCase())]);
}

export function SearchSuggestions({ types, limit = 5, searchPath = "/search" }: { types?: string[]; limit?: number; searchPath?: string }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(-1);
  const [history, setHistory] = useState<string[]>([]);
  const { format } = useSiteCurrency();
  const typesKey = (types ?? []).join(",");

  // Follow the form's search input.
  useEffect(() => {
    const form = anchor.current?.closest("form");
    const input = form?.querySelector<HTMLInputElement>('input[name="q"]');
    if (!form || !input) return;
    input.setAttribute("autocomplete", "off");
    const onInput = () => { setTerm(input.value); setOpen(true); setActive(-1); };
    const onFocus = () => { setHistory(readHistory()); setTerm(input.value); setOpen(true); };
    const onSubmit = () => rememberSearch(input.value);
    const onKey = (e: KeyboardEvent) => {
      const items = form.querySelectorAll<HTMLAnchorElement>("[data-suggestion]");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!items.length) return;
        e.preventDefault();
        setOpen(true);
        setActive((i) => (e.key === "ArrowDown" ? (i + 1) % items.length : (i <= 0 ? items.length - 1 : i - 1)));
      } else if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "Enter") {
        const i = Number(form.dataset.activeSuggestion ?? -1);
        if (i >= 0 && items[i]) { e.preventDefault(); window.location.href = items[i].href; }
      }
    };
    const onDocDown = (e: MouseEvent) => { if (!form.contains(e.target as Node)) setOpen(false); };
    input.addEventListener("input", onInput);
    input.addEventListener("focus", onFocus);
    input.addEventListener("keydown", onKey);
    form.addEventListener("submit", onSubmit);
    document.addEventListener("mousedown", onDocDown);
    return () => {
      input.removeEventListener("input", onInput);
      input.removeEventListener("focus", onFocus);
      input.removeEventListener("keydown", onKey);
      form.removeEventListener("submit", onSubmit);
      document.removeEventListener("mousedown", onDocDown);
    };
  }, []);

  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (form) form.dataset.activeSuggestion = String(active);
  }, [active]);

  // Fetch as the visitor types (debounced, stale replies dropped).
  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) { setHits([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setBusy(true);
      const params = new URLSearchParams({ q, limit: String(limit) });
      if (typesKey) params.set("types", typesKey);
      fetch(`/api/search/suggest?${params}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: { results?: SearchHit[] }) => setHits(d.results ?? []))
        .catch(() => {})
        .finally(() => setBusy(false));
    }, 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [term, typesKey, limit]);

  const q = term.trim();
  const show = open && q.length >= 2;
  const showHistory = open && q.length < 2 && history.length > 0;
  const urlFor = (t: string) => `${searchPath}?q=${encodeURIComponent(t)}${typesKey && searchPath === "/search" ? `&in=${encodeURIComponent(typesKey)}` : ""}`;
  const all = urlFor(q);
  const forget = (t: string | null) => {
    const next = t === null ? [] : history.filter((x) => x !== t);
    writeHistory(next);
    setHistory(next);
  };

  return (
    <span ref={anchor} className="contents">
      {showHistory && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 min-w-[18rem] rounded-xl border border-black/10 bg-white text-neutral-900 shadow-xl overflow-hidden text-left">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Recent searches</span>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => forget(null)} className="text-xs text-neutral-500 hover:text-neutral-900">Clear all</button>
          </div>
          <ul className="pb-1">
            {history.map((t, i) => (
              <li key={t} className={`flex items-center ${i === active ? "bg-neutral-100" : "hover:bg-neutral-50"}`}>
                <a data-suggestion href={urlFor(t)} onClick={() => rememberSearch(t)} onMouseEnter={() => setActive(i)} className="flex-1 min-w-0 flex items-center gap-3 px-4 py-2 text-sm">
                  <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span className="truncate">{t}</span>
                </a>
                <button type="button" aria-label={`Remove ${t}`} onMouseDown={(e) => e.preventDefault()} onClick={() => forget(t)} className="px-3 py-2 text-neutral-400 hover:text-neutral-900">
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {show && (
        <div role="listbox" className="absolute left-0 right-0 top-full mt-2 z-50 min-w-[18rem] rounded-xl border border-black/10 bg-white text-neutral-900 shadow-xl overflow-hidden text-left">
          {busy && !hits.length ? (
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-500"><Loader2 className="w-4 h-4 animate-spin" /> Searching</p>
          ) : !hits.length ? (
            <p className="px-4 py-3 text-sm text-neutral-500">No matches for &ldquo;{q}&rdquo;</p>
          ) : (
            <ul>
              {hits.map((h, i) => (
                <li key={`${h.type}-${h.id}`}>
                  <a data-suggestion href={h.url} onClick={() => rememberSearch(q)} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm ${i === active ? "bg-neutral-100" : "hover:bg-neutral-50"}`}>
                    {h.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.image} alt="" className="w-9 h-9 rounded-md object-cover shrink-0 bg-neutral-100" />
                    ) : (
                      <span className="w-9 h-9 rounded-md bg-neutral-100 flex items-center justify-center shrink-0"><Search className="w-4 h-4 text-neutral-400" /></span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{h.title}</span>
                      {h.meta && <span className="block truncate text-xs text-neutral-500">{h.type === "product" ? format(Number(h.meta)) : h.meta}</span>}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${BADGE[h.type]}`}>{SEARCH_TYPE_LABEL[h.type]}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <a href={all} className="block border-t px-4 py-2.5 text-sm font-medium text-center hover:bg-neutral-50" style={{ color: "hsl(var(--primary))" }}>See all results</a>
        </div>
      )}
    </span>
  );
}
