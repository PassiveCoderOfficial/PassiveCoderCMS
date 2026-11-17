/**
 * Restore a site from a backup's data.json (db.zip). Pure: takes a minimal DB
 * interface so it can be unit tested (tests/platform/backup-restore.test.ts).
 *
 * What a backup holds: every row of the CONTENT_TABLES in json-export.ts for
 * one tenant. The restore treats them in two groups:
 *
 *  - CONTENT (pages, posts, products, menus, settings, ...): the site is put
 *    back exactly as it was: backed-up rows are upserted by id and rows made
 *    after the backup are deleted.
 *  - RECORDS (orders, customers, form submissions, invoices): business
 *    records that keep happening after a backup. Missing rows are re-added,
 *    but nothing newer is deleted and no existing row is overwritten, so a
 *    restore never loses an order or a lead.
 *
 * Media files themselves live in storage and are never deleted, so restoring
 * the media table only brings back the library entries.
 *
 * Every row is forced to the target tenant id, whatever the file says.
 */

export const RESTORE_CONTENT_TABLES = [
  "site_settings",
  "themes",
  "plugins",
  "tax_rates",
  "media",
  "product_categories",
  "products",
  "forms",
  "navigation_menus",
  "pages",
  "posts",
] as const;

export const RESTORE_RECORD_TABLES = ["customers", "orders", "invoices", "form_submissions"] as const;

export type RestoreRow = Record<string, unknown>;

export interface RestoreDb {
  /** ids of the tenant's current rows in a table. */
  listIds(table: string, tenantId: string): Promise<string[]>;
  /** Insert or update rows; ignoreDuplicates leaves existing rows alone. */
  upsert(table: string, rows: RestoreRow[], opts: { onConflict: string; ignoreDuplicates: boolean }): Promise<void>;
  deleteIds(table: string, tenantId: string, ids: string[]): Promise<void>;
}

export interface TableResult {
  table: string;
  restored: number;
  removed: number;
  error?: string;
}

export interface RestoreResult {
  ok: boolean;
  tables: TableResult[];
}

/** Parse and sanity-check data.json. Throws a readable error when it is not a backup. */
export function parseBackupData(json: string): Record<string, RestoreRow[]> {
  let data: unknown;
  try { data = JSON.parse(json); } catch { throw new Error("The backup file is damaged and cannot be read."); }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("The backup file is not a site backup.");
  const out: Record<string, RestoreRow[]> = {};
  for (const [table, rows] of Object.entries(data as Record<string, unknown>)) {
    if (!Array.isArray(rows)) continue;
    out[table] = rows.filter((r): r is RestoreRow => !!r && typeof r === "object" && !Array.isArray(r));
  }
  return out;
}

const CHUNK = 200;
function chunks<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += CHUNK) out.push(arr.slice(i, i + CHUNK));
  return out;
}

export async function restoreBackupData(
  db: RestoreDb,
  tenantId: string,
  data: Record<string, RestoreRow[]>,
): Promise<RestoreResult> {
  const results = new Map<string, TableResult>();
  const toPrune: Array<{ table: string; keep: Set<string> }> = [];
  const groups: Array<[readonly string[], boolean]> = [[RESTORE_CONTENT_TABLES, true], [RESTORE_RECORD_TABLES, false]];

  // Pass 1: put rows back, parents before children.
  for (const [names, isContent] of groups) {
    for (const table of names) {
      // A table missing from the file was not in the backup: leave it alone.
      if (!(table in data)) continue;
      const res: TableResult = { table, restored: 0, removed: 0 };
      results.set(table, res);
      try {
        const rows: RestoreRow[] = data[table].map((r) => ({ ...r, tenant_id: tenantId }));
        const hasId = (r: RestoreRow) => typeof r.id === "string" || typeof r.id === "number";
        const withId = rows.filter(hasId);
        const noId = rows.filter((r) => !hasId(r));

        for (const part of chunks(withId)) {
          await db.upsert(table, part, { onConflict: "id", ignoreDuplicates: !isContent });
          res.restored += part.length;
        }
        // One-row-per-site tables without an id column (keyed by tenant).
        if (noId.length && isContent) {
          await db.upsert(table, noId.slice(0, 1), { onConflict: "tenant_id", ignoreDuplicates: false });
          res.restored += 1;
        }
        if (isContent && noId.length === 0) toPrune.push({ table, keep: new Set(withId.map((r) => String(r.id))) });
      } catch (e) {
        res.error = e instanceof Error ? e.message : String(e);
      }
    }
  }

  // Pass 2: remove content made after the backup, children before parents.
  for (const { table, keep } of toPrune.reverse()) {
    const res = results.get(table)!;
    if (res.error) continue;
    try {
      const extra = (await db.listIds(table, tenantId)).filter((id) => !keep.has(String(id)));
      for (const part of chunks(extra)) {
        await db.deleteIds(table, tenantId, part);
        res.removed += part.length;
      }
    } catch (e) {
      res.error = e instanceof Error ? e.message : String(e);
    }
  }

  const tables = [...results.values()];
  return { ok: tables.every((t) => !t.error), tables };
}
