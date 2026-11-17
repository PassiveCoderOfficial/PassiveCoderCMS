import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import type { Block } from "@/types/cms";
import { loadEntries } from "./server";
import { bindingOf, hydrateBlock } from "./hydrate";

/**
 * Language of the page being rendered, set once per request by the page
 * route (translated pages carry seo.lang) and read by every block that shows
 * collection entries. React cache() = one value per request.
 */
const langStore = cache(() => ({ lang: null as string | null, entryId: null as string | null }));
export function setRenderLang(lang: string | null) { langStore().lang = lang; }
export function renderLang() { return langStore().lang; }
/** On an entry page: that entry is left out of "more like this" blocks. */
export function setRenderEntry(id: string | null) { langStore().entryId = id; }

/** Live site: a block bound to a collection gets its entries filled in. */
export async function resolveCollectionBlock(block: Block): Promise<Block> {
  const b = bindingOf(block);
  if (!b) return block;
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) return block;
  const r = await loadEntries(tenantId, { typeId: b.typeId, categoryId: b.categoryId, featuredOnly: b.featuredOnly, limit: b.limit || undefined, ids: b.ids, sort: b.sort });
  if (!r) return block;
  const current = langStore().entryId;
  if (current && !b.ids?.length) r.entries = r.entries.filter((e) => e.id !== current);
  return hydrateBlock(block, r, renderLang(), { prefiltered: true });
}
