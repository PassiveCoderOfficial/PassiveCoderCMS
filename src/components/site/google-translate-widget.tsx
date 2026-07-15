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
        .gt-widget {
          position: fixed;
          left: 12px;
          bottom: 12px;
          z-index: 40;
        }
        .goog-te-banner-frame, .skiptranslate { display: none !important; }
        body { top: 0 !important; }
        .gt-widget .goog-te-gadget { font-family: inherit !important; font-size: 0 !important; }
        .gt-widget .goog-te-gadget-simple {
          background: #111827 !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          border-radius: 9999px !important;
          padding: 6px 12px !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.25);
        }
        .gt-widget .goog-te-gadget-simple span,
        .gt-widget .goog-te-gadget-simple a {
          color: #fff !important;
          font-size: 12px !important;
          text-decoration: none !important;
        }
        .gt-widget img { display: none !important; }
      `}</style>
    </>
  );
}
