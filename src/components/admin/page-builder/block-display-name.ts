"use client";

import { useLanguage } from "@/lib/i18n/language-provider";
import { blockDisplayName } from "@/modules/page-builder/block-display-name";

/** The block's catalog name in the dashboard language (see modules/page-builder/block-display-name). */
export function useBlockDisplayName(type: string): string {
  const { language } = useLanguage();
  return blockDisplayName(type, language);
}

/** Same, as a function, for lists that name many blocks. */
export function useBlockNamer(): (type: string) => string {
  const { language } = useLanguage();
  return (type: string) => blockDisplayName(type, language);
}
