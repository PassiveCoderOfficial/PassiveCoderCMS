import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";

export const maxDuration = 60;

const ROW_LIMIT = 20000;

/** What each export type pulls; every query is scoped to the current site. */
const TYPES: Record<string, { table: string; filter?: (q: any) => any; order: string }> = { // eslint-disable-line @typescript-eslint/no-explicit-any
  pages: { table: "pages", filter: (q) => q.in("type", ["page", "landing"]).is("deleted_at", null), order: "created_at" },
  posts: { table: "pages", filter: (q) => q.eq("type", "post").is("deleted_at", null), order: "created_at" },
  products: { table: "products", order: "created_at" },
  orders: { table: "orders", order: "created_at" },
  contacts: { table: "contacts", order: "created_at" },
  bookings: { table: "booking_appointments", order: "created_at" },
};

function csv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "﻿";
  const headers = Object.keys(rows[0]).filter((h) => h !== "tenant_id");
  const cell = (v: unknown) => {
    let s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // no spreadsheet formula injection
    return `"${s.replace(/"/g, '""')}"`;
  };
  return "﻿" + [headers.map(cell).join(","), ...rows.map((r) => headers.map((h) => cell(r[h])).join(","))].join("\r\n");
}

/**
 * Download site data: ?type=pages|posts|products|orders|contacts|bookings
 * &format=csv|json, or ?type=site for everything as one JSON file that can be
 * imported into another Passive Coder site.
 */
export async function GET(req: Request) {
  const ctx = await importAccess("read");
  if ("error" in ctx) return ctx.error;
  const sp = new URL(req.url).searchParams;
  const type = sp.get("type") ?? "";
  const format = sp.get("format") === "json" ? "json" : "csv";
  const date = new Date().toISOString().slice(0, 10);

  const fetchType = async (t: string) => {
    const def = TYPES[t];
    let q = ctx.admin.from(def.table).select("*").eq("tenant_id", ctx.tenantId);
    if (def.filter) q = def.filter(q);
    const { data, error } = await q.order(def.order, { ascending: true }).limit(ROW_LIMIT);
    if (error) throw new Error(error.message);
    return (data ?? []) as Record<string, unknown>[];
  };

  try {
    if (type === "site") {
      const out: Record<string, unknown> = { format: "passivecoder-site", version: 1, exported_at: new Date().toISOString() };
      for (const t of Object.keys(TYPES)) out[t] = await fetchType(t);
      for (const t of ["site_identity", "site_settings", "nav_menus"]) {
        const { data } = await ctx.admin.from(t).select("*").eq("tenant_id", ctx.tenantId);
        out[t] = data ?? [];
      }
      return new NextResponse(JSON.stringify(out, null, 2), {
        headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="site-export-${date}.json"` },
      });
    }
    if (!TYPES[type]) return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
    const rows = await fetchType(type);
    if (format === "json") {
      return new NextResponse(JSON.stringify(rows, null, 2), {
        headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${type}-${date}.json"` },
      });
    }
    return new NextResponse(csv(rows), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${type}-${date}.csv"` },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Export failed" }, { status: 400 });
  }
}
