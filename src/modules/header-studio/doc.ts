/**
 * The stored Header Studio document (site_identity.header_studio, migration
 * 240): a draft, the published header, the last published versions, and the
 * opt-in switch.
 *
 * Opt-in rule (pixel safety): a site shows the studio header only when the
 * document has a published config AND is enabled. No document, a draft that
 * was never published, or "use the classic header" => the legacy header path
 * (site_identity.global_header), byte for byte as before. The legacy
 * global_header is never written by the studio, so switching back is instant.
 *
 * Pure functions only.
 */
import { normalizeHeaderConfig, type HeaderConfig } from "./model";

/** Published versions kept for restore. */
export const HISTORY_LIMIT = 10;

export interface HeaderVersion {
  config: HeaderConfig;
  publishedAt: string;
  /** Who published it (user id), when known. */
  by?: string | null;
}

export interface HeaderStudioDoc {
  /** false = the site uses its classic header again (data kept). */
  enabled: boolean;
  draft: HeaderConfig | null;
  draftSavedAt?: string | null;
  published: HeaderConfig | null;
  publishedAt?: string | null;
  publishedBy?: string | null;
  /** Earlier published versions, newest first (the live one is not in here). */
  history: HeaderVersion[];
}

export function emptyDoc(): HeaderStudioDoc {
  return { enabled: false, draft: null, draftSavedAt: null, published: null, publishedAt: null, publishedBy: null, history: [] };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const iso = (v: unknown): string | null => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : null);

/** Stored JSON -> a valid document (never throws; garbage => empty doc). */
export function normalizeDoc(raw: unknown): HeaderStudioDoc {
  if (!isObj(raw)) return emptyDoc();
  const history = (Array.isArray(raw.history) ? raw.history : [])
    .filter(isObj)
    .filter((h) => isObj(h.config))
    .map((h) => ({ config: normalizeHeaderConfig(h.config), publishedAt: iso(h.publishedAt) ?? new Date(0).toISOString(), by: typeof h.by === "string" ? h.by : null }))
    .slice(0, HISTORY_LIMIT);
  const published = isObj(raw.published) ? normalizeHeaderConfig(raw.published) : null;
  return {
    enabled: raw.enabled === true && !!published,
    draft: isObj(raw.draft) ? normalizeHeaderConfig(raw.draft) : null,
    draftSavedAt: iso(raw.draftSavedAt),
    published,
    publishedAt: iso(raw.publishedAt),
    publishedBy: typeof raw.publishedBy === "string" ? raw.publishedBy : null,
    history,
  };
}

/**
 * The header the live site shows, or null for the legacy header.
 * Null whenever there is no document, nothing was ever published, or the
 * owner switched back to the classic header.
 */
export function resolveLiveHeader(raw: unknown): HeaderConfig | null {
  if (!isObj(raw) || raw.enabled !== true || !isObj(raw.published)) return null;
  return normalizeHeaderConfig(raw.published);
}

/** What the builder opens and previews: the draft, else the live header. */
export function resolveEditorHeader(doc: HeaderStudioDoc): HeaderConfig | null {
  return doc.draft ?? doc.published;
}

/** Unpublished changes exist. */
export function hasUnpublishedChanges(doc: HeaderStudioDoc): boolean {
  if (!doc.draft) return false;
  if (!doc.published) return true;
  return JSON.stringify(doc.draft) !== JSON.stringify(doc.published);
}

export function saveDraft(doc: HeaderStudioDoc, config: unknown, now = new Date().toISOString()): HeaderStudioDoc {
  return { ...doc, draft: normalizeHeaderConfig(config), draftSavedAt: now };
}

/**
 * Publishes the given config (or the draft) and turns the studio header on.
 * The previous live header goes to the top of the history (max HISTORY_LIMIT).
 */
export function publish(doc: HeaderStudioDoc, config?: unknown, now = new Date().toISOString(), by: string | null = null): HeaderStudioDoc {
  const source = config !== undefined ? config : doc.draft ?? doc.published;
  if (!source) return doc;
  const next = normalizeHeaderConfig(source);
  const history = doc.published
    ? [{ config: doc.published, publishedAt: doc.publishedAt ?? now, by: doc.publishedBy ?? null }, ...doc.history].slice(0, HISTORY_LIMIT)
    : doc.history;
  return { ...doc, enabled: true, draft: next, draftSavedAt: now, published: next, publishedAt: now, publishedBy: by, history };
}

/**
 * Restores an earlier published version into the draft. It goes live when
 * the owner publishes (or pass publishNow), so a restore can be previewed.
 */
export function restoreVersion(doc: HeaderStudioDoc, index: number, opts: { publishNow?: boolean; now?: string } = {}): HeaderStudioDoc {
  const v = doc.history[index];
  if (!v) return doc;
  const now = opts.now ?? new Date().toISOString();
  const withDraft = { ...doc, draft: normalizeHeaderConfig(v.config), draftSavedAt: now };
  return opts.publishNow ? publish(withDraft, undefined, now) : withDraft;
}

/** Back to the classic (legacy) header. Draft, live config and history are kept. */
export function switchToClassic(doc: HeaderStudioDoc): HeaderStudioDoc {
  return { ...doc, enabled: false };
}

/** Turns a published studio header back on. */
export function switchToStudio(doc: HeaderStudioDoc): HeaderStudioDoc {
  return doc.published ? { ...doc, enabled: true } : doc;
}

/** Drops the draft (back to the live version). */
export function discardDraft(doc: HeaderStudioDoc): HeaderStudioDoc {
  return { ...doc, draft: null, draftSavedAt: null };
}

/**
 * Which header the site layout renders. Special sites keep their own chrome;
 * a live studio header wins over the legacy blocks; otherwise the legacy
 * global header exactly as before (or nothing when there is none).
 */
export type SiteHeaderKind = "blood" | "marketplace" | "studio" | "legacy" | "none";
export function pickSiteHeader(opts: { blood: boolean; marketplace: boolean; studio: HeaderConfig | null; legacyBlocks: number }): SiteHeaderKind {
  if (opts.blood) return "blood";
  if (opts.marketplace) return "marketplace";
  if (opts.studio) return "studio";
  return opts.legacyBlocks > 0 ? "legacy" : "none";
}
