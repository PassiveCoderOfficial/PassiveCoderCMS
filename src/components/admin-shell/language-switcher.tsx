"use client";

// Compact EN/বাংলা toggle for the admin topbar — always visible per Wali's
// instruction ("keep language switcher on top"). Two-button toggle rather
// than a dropdown since there are only two languages; a dropdown would be
// an extra click for no benefit at this scale (revisit if a 3rd language
// is ever added).

import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className="flex items-center rounded-full border bg-muted/50 p-0.5 text-xs font-medium"
      role="group"
      aria-label={t("language.label")}
    >
      <button
        onClick={() => setLanguage("en")}
        className={cn(
          "px-2.5 py-1 rounded-full transition-colors",
          language === "en" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {t("language.english")}
      </button>
      <button
        onClick={() => setLanguage("bn")}
        className={cn(
          "px-2.5 py-1 rounded-full transition-colors",
          language === "bn" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {t("language.bangla")}
      </button>
    </div>
  );
}
