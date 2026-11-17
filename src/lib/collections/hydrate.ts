/**
 * Fill a block's own data from a collection, so the block's normal renderer
 * draws entries exactly like hand-written items. Isomorphic: the live site
 * calls it on the server (render.ts), the builder canvas in the browser.
 */
import type { Block } from "@/types/cms";
import { entriesToCardItems, entriesToTable, filterEntries, type CollectionBinding, type ResolvedCollection } from "./binding";
import { localizeCategory, localizeEntry, displayValue } from "./types";

/** Block types that can show a collection. */
export const COLLECTION_BLOCK_TYPES = ["cards", "team", "gallery", "table"] as const;

export function bindingOf(block: Block): CollectionBinding | null {
  if (!(COLLECTION_BLOCK_TYPES as readonly string[]).includes(block.type)) return null;
  const b = (block.data as { collection?: CollectionBinding } | undefined)?.collection;
  // "@entry" = the entry of the page being shown (entry templates, detail.ts).
  return b?.typeId && !b.typeId.startsWith("@") ? b : null;
}

export function hydrateBlock(block: Block, r: ResolvedCollection, lang?: string | null, opts?: { prefiltered?: boolean; includeDrafts?: boolean }): Block {
  const b = bindingOf(block);
  if (!b) return block;
  const res: ResolvedCollection = opts?.prefiltered ? r : { ...r, entries: filterEntries(r.entries, b, opts?.includeDrafts) };
  const data = block.data as Record<string, unknown>;

  switch (block.type) {
    case "cards":
      return { ...block, data: { ...data, source: "inline", items: entriesToCardItems(res, b, lang) } } as Block;
    case "team": {
      const field = (k?: string) => res.type.fields.find((f) => f.key === k);
      const byType = (t: string) => res.type.fields.find((f) => f.type === t)?.key;
      const emailKey = byType("email"), phoneKey = byType("phone");
      const members = res.entries.map((raw) => {
        const e = localizeEntry(raw, lang);
        return {
          id: e.id, name: e.title, bio: e.excerpt || undefined, avatar: e.image_url ?? undefined,
          role: b.roleField ? displayValue(field(b.roleField), e.data?.[b.roleField]) || undefined : undefined,
          email: emailKey ? String(e.data?.[emailKey] ?? "") || undefined : undefined,
          phone: phoneKey ? String(e.data?.[phoneKey] ?? "") || undefined : undefined,
        };
      });
      return { ...block, data: { ...data, members } } as Block;
    }
    case "gallery": {
      const cats = res.categories.map((c) => localizeCategory(c, lang));
      const images = res.entries.flatMap((raw) => {
        const e = localizeEntry(raw, lang);
        const category = cats.find((c) => e.category_ids.includes(c.id))?.name;
        const urls = b.galleryMode === "all" ? [...(e.image_url ? [e.image_url] : []), ...e.gallery.map((g) => g.url)] : e.image_url ? [e.image_url] : [];
        return urls.map((url, i) => ({ id: `${e.id}-${i}`, url, alt: e.title, caption: b.galleryMode === "all" ? undefined : e.title, category }));
      });
      return { ...block, data: { ...data, images } } as Block;
    }
    case "table": {
      const cols = b.columns?.length ? b.columns : ["title", ...res.type.fields.filter((f) => f.show_in_list).map((f) => f.key)];
      const { header, rows } = entriesToTable(res, cols, lang);
      return { ...block, data: { ...data, columns: header, rows } } as Block;
    }
  }
  return block;
}
