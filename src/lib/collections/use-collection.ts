"use client";

import { useEffect, useState } from "react";
import type { Block } from "@/types/cms";
import type { ResolvedCollection } from "./binding";
import { bindingOf, hydrateBlock } from "./hydrate";
import type { CollectionCategory, CollectionEntry, CollectionType } from "./types";

// Builder canvas: a collection's type, categories and entries, fetched once
// per type per page load and shared by every block showing it.
const cache = new Map<string, Promise<ResolvedCollection | null>>();

export function fetchCollection(typeId: string, fresh = false): Promise<ResolvedCollection | null> {
  if (fresh) cache.delete(typeId);
  if (!cache.has(typeId)) {
    cache.set(typeId, (async () => {
      const [types, entries, categories] = await Promise.all([
        fetch("/api/collections").then((r) => (r.ok ? r.json() : [])) as Promise<CollectionType[]>,
        fetch(`/api/collections/${typeId}/entries`).then((r) => (r.ok ? r.json() : [])) as Promise<CollectionEntry[]>,
        fetch(`/api/collections/${typeId}/categories`).then((r) => (r.ok ? r.json() : [])) as Promise<CollectionCategory[]>,
      ]);
      const type = types.find((t) => t.id === typeId);
      return type ? { type, entries, categories } : null;
    })().catch(() => null));
  }
  return cache.get(typeId)!;
}

/** All collection types of the site (settings dropdowns). */
let typesPromise: Promise<CollectionType[]> | null = null;
export function fetchCollectionTypes(): Promise<CollectionType[]> {
  typesPromise ??= fetch("/api/collections").then((r) => (r.ok ? r.json() : [])).catch(() => []);
  return typesPromise;
}

export function useCollection(typeId: string | undefined) {
  const [state, setState] = useState<{ id?: string; data: ResolvedCollection | null }>({ data: null });
  useEffect(() => {
    if (!typeId) return;
    let live = true;
    fetchCollection(typeId).then((data) => live && setState({ id: typeId, data }));
    return () => { live = false; };
  }, [typeId]);
  return state.id === typeId ? state.data : null;
}

/** The block with its collection entries filled in (unchanged when not bound). */
export function useHydratedBlock(block: Block): Block {
  const b = bindingOf(block);
  const r = useCollection(b?.typeId);
  return b && r ? hydrateBlock(block, r) : block;
}
