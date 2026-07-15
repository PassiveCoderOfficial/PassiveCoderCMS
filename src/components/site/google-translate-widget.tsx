"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    google?: { translate?: { TranslateElement: new (opts: object, id: string) => void } };
    googleTranslateElementInit?: () => void;
  }
}

/**
 * Auto-detect Google Translate widget. Renders a small floating pill
 * (bottom-left) instead of Google's default banner — CSS below hides the
 * stock banner/branding and restyles the language <select>.
 */
export function GoogleTranslateWidget() {
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate) return;
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element",
      );
    };
    return () => { delete window.googleTranslateElementInit; };
  }, []);

  return (
    <>
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
      <div id="google_translate_element" className="gt-widget" />
      <style jsx global>{`
        /* Engine only — the visible switcher is a header button (see
           useGoogleTranslate/LanguageSwitch) that drives this via cookie. */
        .gt-widget, .goog-te-banner-frame, .skiptranslate { display: none !important; }
        body { top: 0 !important; }
      `}</style>
    </>
  );
}
