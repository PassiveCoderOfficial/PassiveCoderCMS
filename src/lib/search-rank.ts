/**
 * Order search results by how well they match: names starting with the query,
 * then addresses starting with it, then a later word in the name starting with
 * it, then everything else that matched. The sort is stable, so the existing
 * order is kept within each rank.
 */
export function rankBySearch<T>(
  items: T[],
  query: string,
  names: (item: T) => (string | null | undefined)[],
  addresses: (item: T) => (string | null | undefined)[] = () => [],
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const lower = (values: (string | null | undefined)[]) => values.filter(Boolean).map((v) => v!.toLowerCase());
  const rank = (item: T) => {
    const n = lower(names(item));
    if (n.some((v) => v.startsWith(q))) return 0;
    if (lower(addresses(item)).some((v) => v.startsWith(q))) return 1;
    if (n.some((v) => v.split(/[^\p{L}\p{N}]+/u).some((word) => word.startsWith(q)))) return 2;
    return 3;
  };
  return items.map((item) => ({ item, r: rank(item) })).sort((a, b) => a.r - b.r).map((x) => x.item);
}
