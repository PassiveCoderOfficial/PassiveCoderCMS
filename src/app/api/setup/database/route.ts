import { readFileSync } from "node:fs";
import { z } from "zod";
import { connectDatabase, installerAccess, migrationsDir, schemaFilePath } from "@/lib/installer/server";
import { clearStandaloneTenantCache } from "@/lib/tenant/standalone";
import { classifyDbError, DatabaseNotEmptyError, inspect, loadSchema, runMigrations } from "../../../../../selfhost/lib/db.mjs";

/*
 * Web installer: set up the database from the browser, so a cloud install
 * never needs a terminal.
 *
 *   { action: "load" }    load selfhost/schema.sql into an EMPTY database
 *   { action: "update" }  apply the migrations this version brought
 *
 * Both need DATABASE_URL on the server. The load runs in one transaction
 * (all or nothing, safe to try again) and refuses a database that is not
 * empty: one that holds other tables is never touched. The answer is a
 * stream of JSON lines, so the page can show progress:
 *   {"type":"progress","done":120,"total":3586}
 *   {"type":"done","tables":261}   or   {"type":"error","code":"...","message":"..."}
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const Body = z.object({ action: z.enum(["load", "update"]) });

const fail = (status: number, code: string, message: string) => Response.json({ error: message, code }, { status });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  // The gate before anything else; a handful of tries is plenty.
  const pre = await installerAccess(req, "check", { scope: "database", max: 12, known: null });
  if (!pre.ok) return pre.response;
  if (!parsed.success) return fail(400, "bad_request", "Unknown action.");
  const { action } = parsed.data;

  const url = process.env.DATABASE_URL?.trim();
  if (!url) return fail(400, "database_url_missing", "DATABASE_URL is not set.");

  let db: Awaited<ReturnType<typeof connectDatabase>>;
  try {
    db = await connectDatabase(url, 15_000);
  } catch (e) {
    return fail(503, `database_${classifyDbError(e)}`, "Could not connect to the database.");
  }

  // What is there, straight from the database: the lock on the installer
  // (a site exists) is checked against this, not against a guess.
  let state: Awaited<ReturnType<typeof inspect>>;
  try {
    state = await inspect(db);
  } catch {
    await db.end().catch(() => {});
    return fail(503, "database_other", "Could not read the database.");
  }
  const access = await installerAccess(req, "write", { scope: "database-2", max: 24, known: state.state === "ours" ? state.sites > 0 : false });
  if (!access.ok) {
    await db.end().catch(() => {});
    return access.response;
  }
  if (action === "load" && state.state !== "empty") {
    await db.end().catch(() => {});
    return state.state === "ours"
      ? fail(409, "schema_already_loaded", "The database is already set up.")
      : fail(409, "schema_foreign", "This database already holds other tables. Use a new, empty Supabase project.");
  }
  if (action === "update" && state.state !== "ours") {
    await db.end().catch(() => {});
    return fail(409, "schema_empty", "The database is not set up yet.");
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        try { controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n")); } catch { /* the page went away; keep working */ }
      };
      try {
        if (action === "load") {
          const sql = readFileSync(schemaFilePath(), "utf8");
          let last = 0;
          const res = await loadSchema(db, sql, {
            onProgress: (done: number, total: number) => {
              const now = Date.now();
              if (done === total || now - last > 400) { last = now; send({ type: "progress", done, total }); }
            },
          });
          send({ type: "done", tables: res.tables });
        } else {
          const res = await runMigrations(db, migrationsDir(), {
            onStep: ({ index, total }: { index: number; total: number }) => send({ type: "progress", done: index, total }),
          });
          send({ type: "done", applied: res.applied.length });
        }
        clearStandaloneTenantCache();
      } catch (e) {
        const notEmpty = e instanceof DatabaseNotEmptyError;
        console.error("[setup] database", e);
        send({
          type: "error",
          code: notEmpty ? (e.state === "ours" ? "schema_already_loaded" : "schema_foreign") : "database_failed",
          // The database's own words help when asking for support; they hold no secrets.
          message: e instanceof Error ? e.message.slice(0, 400) : "The database could not be set up.",
        });
      } finally {
        await db.end().catch(() => {});
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" },
  });
}
