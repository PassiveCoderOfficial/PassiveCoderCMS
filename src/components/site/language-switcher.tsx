import { Languages } from "lucide-react";

const NATIVE: Record<string, string> = {
  en: "English", ar: "العربية", bn: "বাংলা", hi: "हिन्दी", ur: "اردو", fr: "Français", es: "Español", de: "Deutsch",
  it: "Italiano", pt: "Português", ru: "Русский", tr: "Türkçe", fa: "فارسی", zh: "中文", ja: "日本語", ko: "한국어",
  ms: "Bahasa Melayu", id: "Bahasa Indonesia", th: "ไทย", vi: "Tiếng Việt", nl: "Nederlands", tl: "Filipino",
  ta: "தமிழ்", ml: "മലയാളം", ne: "नेपाली", si: "සිංහල", sw: "Kiswahili", he: "עברית", pl: "Polski", uk: "Українська",
};

/**
 * Floating language picker for pages that have translated versions
 * (seo.alternates). Plain links, so it works without JavaScript and each
 * language is a real, crawlable address.
 *
 * `chrome` is the header in use. When its menu already links the other
 * language (a NavItem with `lang`), the pill would only repeat it, and on
 * phones it sat over the hero next to the WhatsApp button.
 */
export function LanguageSwitcher({ alternates, current, chrome }: { alternates?: Record<string, string> | null; current: string; chrome?: unknown }) {
  const entries = Object.entries(alternates ?? {}).filter(([, href]) => typeof href === "string");
  if (entries.length < 2) return null;
  if (chrome && /"lang":"[a-z]|"languageSwitchMode":"native"/i.test(JSON.stringify(chrome))) return null;
  return (
    <nav aria-label="Language" className="fixed bottom-4 left-4 z-40 flex items-center gap-1 rounded-full border bg-background/95 shadow-lg backdrop-blur px-1.5 py-1 text-sm print:hidden" dir="ltr">
      <Languages className="w-4 h-4 mx-1 text-muted-foreground" aria-hidden />
      {entries.map(([lang, href]) => (
        <a key={lang} href={href} hrefLang={lang} lang={lang}
          className={`rounded-full px-2.5 py-1 ${lang === current ? "bg-foreground text-background font-medium" : "hover:bg-muted"}`}
          aria-current={lang === current ? "page" : undefined}>
          {NATIVE[lang] ?? lang.toUpperCase()}
        </a>
      ))}
    </nav>
  );
}
