/**
 * The stored Footer Studio document (site_identity.footer_studio, migration
 * 241): a draft, the published footer, the last published versions, and the
 * opt-in switch. Same shape and rules as the Header Studio document
 * (modules/header-studio/doc.ts).
 *
 * Opt-in rule (pixel safety): a site shows the studio footer only when the
 * document has a published config AND is enabled. No document, a draft that
 * was never published, or "use the classic footer" => the legacy footer path
 * (site_identity.global_footer), byte for byte as before. The legacy
 * global_footer is never written by the studio, so switching back is instant.
 *
 * Pure functions only.
 */
import { normalizeFooterConfig, type FooterConfig } from "./model";

/** Published versions kept for restore. */
export const HISTORY_LIMIT = 10;

export interface FooterVersion {
  config: FooterConfig;
  publishedAt: string;
  by?: string | null;
}

export interface FooterStudioDoc {
  /** false = the site uses its classic footer again (data kept). */
  enabled: boolean;
  draft: FooterConfig | null;
  draftSavedAt?: string | null;
  published: FooterConfig | null;
  publishedAt?: string | null;
  publishedBy?: string | null;
  /** Earlier published versions, newest first (the live one is not in here). */
  history: FooterVersion[];
}

export function emptyDoc(): FooterStudioDoc {
  return { enabled: false, draft: null, draftSavedAt: null, published: null, publishedAt: null, publishedBy: null, history: [] };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const iso = (v: unknown): string | null => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : null);

/** Stored JSON -> a valid document (never throws; garbage => empty doc). */
export function normalizeDoc(raw: unknown): FooterStudioDoc {
  if (!isObj(raw)) return emptyDoc();
  const history = (Array.isArray(raw.history) ? raw.history : [])
    .filter(isObj)
    .filter((h) => isObj(h.config))
    .map((h) => ({ config: normalizeFooterConfig(h.config), publishedAt: iso(h.publishedAt) ?? new Date(0).toISOString(), by: typeof h.by === "string" ? h.by : null }))
    .slice(0, HISTORY_LIMIT);
  const published = isObj(raw.published) ? normalizeFooterConfig(raw.published) : null;
  return {
    enabled: raw.enabled === true && !!published,
    draft: isObj(raw.draft) ? normalizeFooterConfig(raw.draft) : null,
    draftSavedAt: iso(raw.draftSavedAt),
    published,
    publishedAt: iso(raw.publishedAt),
    publishedBy: typeof raw.publishedBy === "string" ? raw.publishedBy : null,
    history,
  };
}

/**
 * The footer the live site shows, or null for the legacy footer. Null
 * whenever there is no document, nothing was ever published, or the owner
 * switched back to the classic footer.
 */
export function resolveLiveFooter(raw: unknown): FooterConfig | null {
  if (!isObj(raw) || raw.enabled !== true || !isObj(raw.published)) return null;
  return normalizeFooterConfig(raw.published);
}

/** What the builder opens and previews: the draft, else the live footer. */
export function resolveEditorFooter(doc: FooterStudioDoc): FooterConfig | null {
  return doc.draft ?? doc.published;
}

export function hasUnpublishedChanges(doc: FooterStudioDoc): boolean {
  if (!doc.draft) return false;
  if (!doc.published) return true;
  return JSON.stringify(doc.draft) !== JSON.stringify(doc.published);
}

export function saveDraft(doc: FooterStudioDoc, config: unknown, now = new Date().toISOString()): FooterStudioDoc {
  return { ...doc, draft: normalizeFooterConfig(config), draftSavedAt: now };
}

/**
 * Publishes the given config (or the draft) and turns the studio footer on.
 * The previous live footer goes to the top of the history (max HISTORY_LIMIT).
 */
export function publish(doc: FooterStudioDoc, config?: unknown, now = new Date().toISOString(), by: string | null = null): FooterStudioDoc {
  const source = config !== undefined ? config : doc.draft ?? doc.published;
  if (!source) return doc;
  const next = normalizeFooterConfig(source);
  const history = doc.published
    ? [{ config: doc.published, publishedAt: doc.publishedAt ?? now, by: doc.publishedBy ?? null }, ...doc.history].slice(0, HISTORY_LIMIT)
    : doc.history;
  return { ...doc, enabled: true, draft: next, draftSavedAt: now, published: next, publishedAt: now, publishedBy: by, history };
}

/** Restores an earlier published version into the draft (or straight live with publishNow). */
export function restoreVersion(doc: FooterStudioDoc, index: number, opts: { publishNow?: boolean; now?: string } = {}): FooterStudioDoc {
  const v = doc.history[index];
  if (!v) return doc;
  const now = opts.now ?? new Date().toISOString();
  const withDraft = { ...doc, draft: normalizeFooterConfig(v.config), draftSavedAt: now };
  return opts.publishNow ? publish(withDraft, undefined, now) : withDraft;
}

/** Back to the classic (legacy) footer. Draft, live config and history are kept. */
export function switchToClassic(doc: FooterStudioDoc): FooterStudioDoc {
  return { ...doc, enabled: false };
}

/** Turns a published studio footer back on. */
export function switchToStudio(doc: FooterStudioDoc): FooterStudioDoc {
  return doc.published ? { ...doc, enabled: true } : doc;
}

/** Drops the draft (back to the live version). */
export function discardDraft(doc: FooterStudioDoc): FooterStudioDoc {
  return { ...doc, draft: null, draftSavedAt: null };
}

/**
 * Which footer the site layout renders. A marketplace keeps its own footer;
 * a live studio footer wins over the legacy blocks; otherwise the legacy
 * global footer exactly as before (or nothing when there is none).
 */
export type SiteFooterKind = "marketplace" | "studio" | "legacy" | "none";
export function pickSiteFooter(opts: { marketplace: boolean; studio: FooterConfig | null; legacyBlocks: number }): SiteFooterKind {
  if (opts.marketplace) return "marketplace";
  if (opts.studio) return "studio";
  return opts.legacyBlocks > 0 ? "legacy" : "none";
}
