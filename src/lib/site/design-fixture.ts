import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Block } from "@/types/cms";
import type { SiteThemeInput } from "@/modules/themes/site-theme";

/**
 * Local design previews (never on the hosted platform): a seed script writes
 * the pages, header, footer and theme of a redesign to JSON files, and the
 * /design-preview route renders them with the real block renderer. Nothing is
 * read unless PC_FIXTURE_DIR is set, and never in a production build.
 */
export type FixturePage = { slug: string; title: string; blocks: Block[]; seo?: Record<string, unknown> | null };
export type FixtureChrome = { header: Block[]; footer: Block[]; identity?: SiteThemeInput | null };

export function designFixtureDir(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  return process.env.PC_FIXTURE_DIR?.trim() || null;
}

async function readJson<T>(file: string): Promise<T | null> {
  try { return JSON.parse(await readFile(file, "utf8")) as T; } catch { return null; }
}

const fileOf = (slug: string) => `${slug.replace(/\//g, "__")}.json`;

export async function loadFixturePage(slug: string): Promise<FixturePage | null> {
  const dir = designFixtureDir();
  if (!dir || !/^[a-z0-9][a-z0-9\-/]*$/i.test(slug)) return null;
  return readJson<FixturePage>(path.join(dir, "pages", fileOf(slug)));
}

export async function loadFixtureChrome(): Promise<FixtureChrome | null> {
  const dir = designFixtureDir();
  return dir ? readJson<FixtureChrome>(path.join(dir, "chrome.json")) : null;
}
