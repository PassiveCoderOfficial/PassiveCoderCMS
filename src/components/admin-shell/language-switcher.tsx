"use client";

// Compact EN/বাংলা toggle for the admin topbar — always visible by
// design ("keep language switcher on top"). Two-button toggle rather
// than a dropdown since there are only two languages; a dropdown would be
// an extra click for no benefit at this scale (revisit if a 3rd language
// is ever added).

import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ tone = "panel" }: { /** "bar" sits on the Console's dark top bar. */ tone?: "panel" | "bar" }) {
  const { language, setLanguage, t } = useLanguage();
  const bar = tone === "bar";

  const button = (lang: "en" | "bn", label: string) => (
    <button
      type="button"
      onClick={() => setLanguage(lang)}
      aria-pressed={language === lang}
      className={cn(
        "rounded-full px-2 py-0.5 leading-5 transition-colors",
        bar
          ? language === lang ? "bg-white/20 text-console-bar-foreground" : "text-console-bar-muted hover:text-console-bar-foreground"
          : language === lang ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );

  return (
    <div
      className={cn("flex items-center rounded-full p-0.5 text-xs font-medium", bar ? "bg-white/10" : "border bg-muted/60")}
      role="group"
      aria-label={t("language.label")}
    >
      {button("en", t("language.english"))}
      {button("bn", t("language.bangla"))}
    </div>
  );
}
