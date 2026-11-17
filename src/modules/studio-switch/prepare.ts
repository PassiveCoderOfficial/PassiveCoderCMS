/**
 * Turning conversions into Studio drafts (menus P5). Pure.
 *
 * A prepared switch only ever writes the DRAFT of the Studio document and
 * records where it came from (`switched`). `enabled` and `published` are
 * left exactly as they were, so the site keeps showing what it shows now
 * until someone presses Publish (resolveLiveHeader / resolveLiveFooter
 * return the same thing before and after; scripts/check-studio-switch.ts
 * checks this on every site).
 */
import { saveDraft as saveHeaderDraft, publish as publishHeader, type HeaderStudioDoc } from "@/modules/header-studio/doc";
import { saveDraft as saveFooterDraft, publish as publishFooter, type FooterStudioDoc } from "@/modules/footer-studio/doc";
import { withMenuId, type HeaderConversion } from "./header-convert";
import { withFooterMenuIds, type FooterConversion } from "./footer-convert";
import type { SwitchOrigin } from "./types";

export interface PrepareInput {
  header?: HeaderConversion | null;
  footer?: FooterConversion | null;
  headerDoc?: HeaderStudioDoc;
  footerDoc?: FooterStudioDoc;
  /** The real id of a menu the switch creates, by placeholder ref. */
  menuIds: (ref: string) => string;
  origin: Omit<SwitchOrigin, "level" | "notes" | "createdMenus">;
}

export interface PrepareOutput {
  /** null = nothing to write for this area (cannot convert, or not asked). */
  headerDoc: HeaderStudioDoc | null;
  footerDoc: FooterStudioDoc | null;
}

export function prepareDocs(input: PrepareInput): PrepareOutput {
  let headerDoc: HeaderStudioDoc | null = null;
  let footerDoc: FooterStudioDoc | null = null;
  const h = input.header;
  if (h?.config && h.level !== "unsupported" && input.headerDoc) {
    let config = h.config;
    const created: string[] = [];
    if (h.menu?.kind === "new") {
      const id = input.menuIds(h.menu.ref);
      config = withMenuId(config, h.menu.ref, id);
      created.push(id);
    }
    const now = input.origin.at;
    headerDoc = {
      ...saveHeaderDraft(input.headerDoc, config, now),
      switched: { ...input.origin, level: h.level, notes: h.notes, ...(created.length ? { createdMenus: created } : {}) },
    };
  }
  const f = input.footer;
  if (f?.config && f.level !== "unsupported" && input.footerDoc) {
    const ids: Record<string, string> = {};
    for (const m of f.newMenus) ids[m.ref] = input.menuIds(m.ref);
    const config = f.newMenus.length ? withFooterMenuIds(f.config, ids) : f.config;
    footerDoc = {
      ...saveFooterDraft(input.footerDoc, config, input.origin.at),
      switched: { ...input.origin, level: f.level, notes: f.notes, ...(f.newMenus.length ? { createdMenus: Object.values(ids) } : {}) },
    };
  }
  return { headerDoc, footerDoc };
}

/** Publishing a prepared switch: the draft goes live (Studio's own publish, history kept). */
export function publishSwitchedHeader(doc: HeaderStudioDoc, by: string | null, now = new Date().toISOString()): HeaderStudioDoc | null {
  if (!doc.draft || !doc.switched) return null;
  return publishHeader(doc, undefined, now, by);
}

export function publishSwitchedFooter(doc: FooterStudioDoc, by: string | null, now = new Date().toISOString()): FooterStudioDoc | null {
  if (!doc.draft || !doc.switched) return null;
  return publishFooter(doc, undefined, now, by);
}
