"use client";

import { Languages } from "lucide-react";

const COOKIE_NAME = "googtrans";

function currentLang(): "en" | "bn" {
  const match = document.cookie.match(/googtrans=\/en\/(\w+)/);
  return match?.[1] === "bn" ? "bn" : "en";
}

function setLang(lang: "en" | "bn") {
  const value = lang === "en" ? "" : `/en/${lang}`;
  // Google's widget reads this cookie on both the apex domain and the
  // current host — set both so it survives the redirect it sometimes does.
  const domain = window.location.hostname;
  if (value) {
    document.cookie = `${COOKIE_NAME}=${value};path=/`;
    document.cookie = `${COOKIE_NAME}=${value};path=/;domain=.${domain}`;
  } else {
    document.cookie = `${COOKIE_NAME}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${COOKIE_NAME}=;path=/;domain=.${domain};expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
  window.location.reload();
}

/**
 * EN / বাংলা pill for site navs. Toggles the Google Translate cookie
 * directly instead of driving Google's dropdown widget — the cookie
 * approach is what actually reflects across the whole page reliably.
 * Renders only when the tenant has auto-translate enabled (mount this
 * conditionally; see DonorSiteHeader for the pattern).
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const lang = typeof document !== "undefined" ? currentLang() : "en";
  const next = lang === "en" ? "bn" : "en";
  const label = lang === "en" ? "বাংলা" : "English";

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      title="Switch language"
      className={className ?? "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 transition-colors"}
    >
      <Languages className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
