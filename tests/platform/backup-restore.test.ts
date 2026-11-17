/**
 * Backup restore core. Run: npm run test:platform
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBackupData, restoreBackupData, type RestoreDb, type RestoreRow } from "../../src/lib/backup/restore";

const T = "11111111-1111-4111-8111-111111111111";

function fakeDb(initial: Record<string, RestoreRow[]>, failOn?: string) {
  const db: Record<string, RestoreRow[]> = JSON.parse(JSON.stringify(initial));
  const log: string[] = [];
  const api: RestoreDb = {
    async listIds(table, tenantId) { return (db[table] ?? []).filter((r) => r.tenant_id === tenantId).map((r) => String(r.id)); },
    async upsert(table, rows, { onConflict, ignoreDuplicates }) {
      if (table === failOn) throw new Error("boom");
      log.push(`upsert:${table}`);
      db[table] ??= [];
      for (const row of rows) {
        const i = db[table].findIndex((r) => r[onConflict] === row[onConflict]);
        if (i === -1) db[table].push(row);
        else if (!ignoreDuplicates) db[table][i] = row;
      }
    },
    async deleteIds(table, tenantId, ids) {
      log.push(`delete:${table}`);
      db[table] = (db[table] ?? []).filter((r) => !(r.tenant_id === tenantId && ids.includes(String(r.id))));
    },
  };
  return { db, log, api };
}

test("content is put back exactly: edits reverted, new rows removed, deleted rows re-added", async () => {
  const { db, api } = fakeDb({
    pages: [
      { id: "p1", tenant_id: T, title: "Edited" },
      { id: "p3", tenant_id: T, title: "Made after backup" },
      { id: "x", tenant_id: "other", title: "Other site" },
    ],
  });
  const res = await restoreBackupData(api, T, { pages: [{ id: "p1", tenant_id: T, title: "Home" }, { id: "p2", tenant_id: T, title: "About" }] });
  assert.equal(res.ok, true);
  const mine = db.pages.filter((r) => r.tenant_id === T).map((r) => `${r.id}:${r.title}`).sort();
  assert.deepEqual(mine, ["p1:Home", "p2:About"]);
  assert.ok(db.pages.some((r) => r.id === "x"), "other site untouched");
  assert.deepEqual(res.tables[0], { table: "pages", restored: 2, removed: 1 });
});

test("records are only re-added: newer orders kept, existing orders not overwritten", async () => {
  const { db, api } = fakeDb({ orders: [{ id: "o1", tenant_id: T, status: "shipped" }, { id: "o9", tenant_id: T, status: "new" }] });
  await restoreBackupData(api, T, { orders: [{ id: "o1", tenant_id: T, status: "pending" }, { id: "o2", tenant_id: T, status: "paid" }] });
  const byId = Object.fromEntries(db.orders.map((r) => [r.id, r.status]));
  assert.deepEqual(byId, { o1: "shipped", o9: "new", o2: "paid" });
});

test("rows are forced to the target site", async () => {
  const { db, api } = fakeDb({});
  await restoreBackupData(api, T, { posts: [{ id: "a", tenant_id: "someone-else" }] });
  assert.equal(db.posts[0].tenant_id, T);
});

test("tables missing from the backup are left alone; deletes run children first", async () => {
  const { db, log, api } = fakeDb({ products: [{ id: "new", tenant_id: T }], product_categories: [{ id: "c-new", tenant_id: T }], posts: [{ id: "keep", tenant_id: T }] });
  await restoreBackupData(api, T, { products: [], product_categories: [] });
  assert.equal(db.posts.length, 1);
  assert.ok(log.indexOf("delete:products") < log.indexOf("delete:product_categories"));
});

test("a failing table is reported and does not stop the others", async () => {
  const { api } = fakeDb({});
  const res = await restoreBackupData(api, T, { pages: [{ id: "p" }], posts: [{ id: "q" }] }, );
  assert.equal(res.ok, true);
  const bad = await restoreBackupData(fakeDb({}, "pages").api, T, { pages: [{ id: "p" }], posts: [{ id: "q" }] });
  assert.equal(bad.ok, false);
  assert.equal(bad.tables.find((t) => t.table === "posts")?.restored, 1);
});

test("parseBackupData rejects junk", () => {
  assert.throws(() => parseBackupData("not json"));
  assert.throws(() => parseBackupData("[1,2]"));
  assert.deepEqual(parseBackupData(JSON.stringify({ pages: [{ id: 1 }, 5], x: 3 })), { pages: [{ id: 1 }] });
});
