"use client";

import React from "react";
import { Languages } from "lucide-react";
import { hrefFor, readAlternates, useAlternates } from "@/components/site/use-alternates";

const COOKIE_NAME = "googtrans";
const SHORT: Record<string, string> = { en: "EN", bn: "বাংলা", ar: "عربي", hi: "हिन्दी", ur: "اردو", fr: "FR", ms: "MS", zh: "中文" };

const LABELS: Record<string, string> = { en: "English", bn: "বাংলা", ar: "العربية", hi: "हिन्दी", ur: "اردو", fr: "Français", ms: "Melayu", zh: "中文" };

/** The language the page is written in, from the (site) layout's root
 *  wrapper. Google's cookie is "/<source>/<target>", so an Arabic-first site
 *  needs "/ar/en", not "/en/en". */
function sourceLang(): string {
  return document.querySelector("[data-site-lang]")?.getAttribute("data-site-lang") || "en";
}

function currentLang(): string {
  // The host cookie is listed first; it is the one setLang always writes.
  const match = document.cookie.match(/googtrans=\/[\w-]+\/([\w-]+)/);
  return match?.[1] ?? sourceLang();
}

/**
 * Google Translate keeps its choice in a "googtrans" cookie and may write it
 * on the host AND on every parent domain (e.g. .passivecoder.com). A copy left
 * on any level wins on the next load, so a switch must overwrite every level.
 * English is written as "/en/en" (explicit "no translation") instead of only
 * deleting, because a stale parent-domain copy would otherwise come back.
 */
function cookieDomains(): (string | null)[] {
  const parts = window.location.hostname.split(".");
  const out: (string | null)[] = [null];
  for (let i = 0; i <= parts.length - 2; i++) out.push("." + parts.slice(i).join("."));
  return out;
}

function setLang(lang: string) {
  const src = sourceLang();
  const value = `/${src}/${lang}`;
  for (const d of cookieDomains()) {
    const scope = `path=/${d ? `;domain=${d}` : ""}`;
    // Clear first (some browsers keep a duplicate otherwise), then write.
    document.cookie = `${COOKIE_NAME}=;${scope};expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    if (lang !== src) document.cookie = `${COOKIE_NAME}=${value};${scope}`;
  }
  if (lang === src) document.cookie = `${COOKIE_NAME}=/${src}/${src};path=/`;
  window.location.reload();
}

const DEFAULT_CLASS = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 transition-colors";

/**
 * Language button for site navs.
 *
 * mode "google" (default): toggles the Google Translate cookie directly
 * instead of driving Google's dropdown widget — the cookie approach is what
 * actually reflects across the whole page reliably. Needs the tenant's
 * auto-translate on.
 *
 * mode "native": a plain link to this page's own translated version (the
 * page's hreflang alternates, Settings > Languages; /about <-> /ar/about,
 * /products/x <-> /ar/products/x, /shop?q <-> /ar/shop?q), falling back to
 * `url` (default "/<code>", that language's home) only when this page has
 * no version in that language. Always labelled with the other
 * language, since the header itself is per language on a native site.
 */
export function LanguageSwitch({ className, other = "bn", style, mode = "google", url, onNavigate, short }: {
  className?: string; other?: string; style?: React.CSSProperties;
  mode?: "google" | "native"; url?: string; onNavigate?: () => void;
  /** Compact label for tight spots (phone header): "عربي" / "EN" instead of the full name. */
  short?: boolean;
}) {
  const alts = useAlternates();
  // The site's main language lives at "/", every other language at "/<code>".
  // Read after mount (data-site-lang, (site)/layout.tsx): on an Arabic-first
  // site "English" falls back to /en and "العربية" to /, not the other way.
  const [mainLang, setMainLang] = React.useState("en");
  React.useEffect(() => { setMainLang(sourceLang()); }, []);
  if (mode === "native") {
    const fallback = url || (other === mainLang ? "/" : `/${other}`);
    // Resolved again on click: the hreflang tags may have arrived after the
    // last render, and the query string (?category=) may have changed since.
    const follow = (e: React.MouseEvent<HTMLAnchorElement>) => {
      onNavigate?.();
      const fresh = hrefFor({ url: fallback, lang: other }, readAlternates());
      if (fresh !== e.currentTarget.getAttribute("href")) { e.preventDefault(); window.location.assign(fresh); }
    };
    return (
      <a href={hrefFor({ url: fallback, lang: other }, alts)} hrefLang={other} lang={other} title={LABELS[other] ?? other.toUpperCase()}
        style={style} className={className ?? DEFAULT_CLASS} onClick={follow}>
        <Languages className="w-3.5 h-3.5" aria-hidden />
        {short ? (SHORT[other] ?? other.toUpperCase()) : (LABELS[other] ?? other.toUpperCase())}
      </a>
    );
  }
  return <GoogleSwitch className={className} other={other} style={style} short={short} />;
}

function GoogleSwitch({ className, other, style, short }: { className?: string; other: string; style?: React.CSSProperties; short?: boolean }) {
  const src = typeof document !== "undefined" ? sourceLang() : "en";
  const lang = typeof document !== "undefined" ? currentLang() : src;
  const next = lang === src ? other : src;
  const label = (short ? SHORT[next] : LABELS[next]) ?? next.toUpperCase();

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      title="Switch language"
      style={style}
      className={className ?? DEFAULT_CLASS}
    >
      <Languages className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

/** Native names for the Google Translate menu. */
export const TRANSLATE_LANGS: Record<string, { label: string; short: string }> = {
  en: { label: "English", short: "EN" }, "zh-CN": { label: "中文 (简体)", short: "中文" }, "zh-TW": { label: "中文 (繁體)", short: "繁體" },
  ms: { label: "Bahasa Melayu", short: "MS" }, hi: { label: "हिन्दी", short: "हिन्दी" }, ta: { label: "தமிழ்", short: "தமிழ்" },
  te: { label: "తెలుగు", short: "తెలుగు" }, kn: { label: "ಕನ್ನಡ", short: "ಕನ್ನಡ" }, bn: { label: "বাংলা", short: "বাংলা" },
  ar: { label: "العربية", short: "عربي" }, ur: { label: "اردو", short: "اردو" }, id: { label: "Bahasa Indonesia", short: "ID" },
  th: { label: "ไทย", short: "ไทย" }, vi: { label: "Tiếng Việt", short: "VI" }, tl: { label: "Filipino", short: "FIL" },
  ja: { label: "日本語", short: "日本語" }, ko: { label: "한국어", short: "한국어" }, fr: { label: "Français", short: "FR" },
  de: { label: "Deutsch", short: "DE" }, es: { label: "Español", short: "ES" },
};

/** Dropdown of Google Translate languages, in the given order. */
export function LanguageMenu({ languages, className, googleIcon }: { languages: string[]; className?: string; googleIcon?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [lang, setCur] = React.useState("en");
  React.useEffect(() => { setCur(currentLang()); }, []);
  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);
  const list = languages.length ? languages : ["en"];
  const cur = TRANSLATE_LANGS[lang] ?? { label: lang, short: lang.toUpperCase() };
  return (
    <div className={className ?? "notranslate relative shrink-0"} translate="no">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} title="Translate / Choose language"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold bg-white/15 hover:bg-white/25 transition-colors whitespace-nowrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {googleIcon ? <img src="/icons/google-translate.png" alt="" width={18} height={18} className="w-[18px] h-auto" /> : <Languages className="w-3.5 h-3.5" aria-hidden />}{cur.short}
        <svg viewBox="0 0 24 24" className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <ul role="listbox" className="absolute left-0 top-full mt-1.5 z-[1000] min-w-[11rem] rounded-xl border bg-white p-1 text-[13px] text-slate-700 shadow-xl">
          {list.map((code) => (
            <li key={code}>
              <button type="button" role="option" aria-selected={code === lang} onClick={() => { if (code !== lang) setLang(code); }}
                className={"w-full text-left rounded-lg px-3 py-2 hover:bg-slate-100 " + (code === lang ? "font-bold text-slate-900" : "")}>
                {TRANSLATE_LANGS[code]?.label ?? code}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
