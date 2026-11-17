"use client";

import { usePathname } from "next/navigation";
import { langOfPath, storeText } from "@/lib/i18n-site/storefront-text";

/** Language of the page being viewed (/ar/... = "ar"), null for the main language. */
export function useStoreLang(): string | null {
  return langOfPath(usePathname());
}

/** Built-in storefront wording in the page's language (see storefront-text.ts). */
export function useStoreText() {
  return storeText(useStoreLang());
}
