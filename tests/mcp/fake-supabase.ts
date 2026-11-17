/**
 * Minimal in-memory stand-in for the Supabase client, enough for the MCP
 * tools: from(table) with select / insert / update / upsert / delete, filters (eq,
 * neq, is, in, ilike, or of ilikes), order, limit, single / maybeSingle,
 * plus rpc() stubs. Filters apply to updates exactly as they would in
 * PostgREST, so a missing tenant filter shows up as a changed row.
 */
type Row = Record<string, unknown>;
type Filter = (r: Row) => boolean;

export class FakeDb {
  tables: Record<string, Row[]> = {};
  rpcs: Record<string, (args: Record<string, unknown>) => unknown> = {};
  /** Optional unique-index stand-in: return an error to reject an insert. */
  onInsert?: (table: string, row: Row, all: Row[]) => { code: string; message: string } | null;
  /** Every write, for assertions: table, kind, rows affected. */
  writes: { table: string; kind: string; rows: Row[] }[] = [];

  constructor(seed: Record<string, Row[]> = {}) {
    this.tables = JSON.parse(JSON.stringify(seed));
  }
  rows(table: string) { return (this.tables[table] ??= []); }
  from(table: string) { return new Query(this, table); }
  async rpc(name: string, args: Record<string, unknown>) {
    const fn = this.rpcs[name];
    return fn ? { data: fn(args), error: null } : { data: null, error: { message: `rpc ${name} not stubbed` } };
  }
}

/** Column, nested "table.col" (embedded rows) or json "col->>key". */
const val = (r: Row, c: string): unknown => {
  if (c.includes("->>")) { const [a, b] = c.split("->>"); return (r[a] as Row | null | undefined)?.[b]; }
  if (c in r || !c.includes(".")) return r[c];
  return c.split(".").reduce<unknown>((o, k) => (o as Row | null | undefined)?.[k], r);
};

const like = (v: unknown, pat: string) => new RegExp("^" + pat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*") + "$", "i").test(String(v ?? ""));

class Query implements PromiseLike<{ data: unknown; error: unknown }> {
  private filters: Filter[] = [];
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: Row | Row[] | null = null;
  private conflict?: string;
  private one: "single" | "maybe" | null = null;
  private max?: number;
  constructor(private db: FakeDb, private table: string) {}

  select() { return this; }
  insert(p: Row | Row[]) { this.op = "insert"; this.payload = p; return this; }
  update(p: Row) { this.op = "update"; this.payload = p; return this; }
  delete() { this.op = "delete"; return this; }
  upsert(p: Row | Row[], o?: { onConflict?: string; ignoreDuplicates?: boolean }) { this.op = "upsert"; this.payload = p; this.conflict = o?.onConflict; return this; }
  eq(c: string, v: unknown) { this.filters.push((r) => val(r, c) === v); return this; }
  neq(c: string, v: unknown) { this.filters.push((r) => r[c] !== v); return this; }
  is(c: string, v: unknown) { this.filters.push((r) => (val(r, c) ?? null) === v); return this; }
  in(c: string, vs: unknown[]) { this.filters.push((r) => vs.includes(r[c])); return this; }
  gt(c: string, v: never) { this.filters.push((r) => (r[c] as never) > v); return this; }
  gte(c: string, v: never) { this.filters.push((r) => (r[c] as never) >= v); return this; }
  lt(c: string, v: never) { this.filters.push((r) => (r[c] as never) < v); return this; }
  lte(c: string, v: never) { this.filters.push((r) => (r[c] as never) <= v); return this; }
  not(c: string, op: string, v: unknown) { this.filters.push((r) => (op === "is" ? (r[c] ?? null) !== v : r[c] !== v)); return this; }
  ilike(c: string, p: string) { this.filters.push((r) => like(r[c], p)); return this; }
  or(expr: string) {
    const parts = expr.split(",").map((s) => { const [c, op, ...v] = s.split("."); return { c, op, v: v.join(".") }; });
    this.filters.push((r) => parts.some((p) => (p.op === "ilike" ? like(r[p.c], p.v) : p.op === "eq" ? String(r[p.c]) === p.v : false)));
    return this;
  }
  order() { return this; }
  limit(n: number) { this.max = n; return this; }
  single() { this.one = "single"; return this; }
  maybeSingle() { this.one = "maybe"; return this; }

  private run(): { data: unknown; error: unknown } {
    const all = this.db.rows(this.table);
    const match = (r: Row) => this.filters.every((f) => f(r));
    let out: Row[] = [];
    if (this.op === "select") out = all.filter(match);
    if (this.op === "update") {
      out = all.filter(match);
      for (const r of out) Object.assign(r, this.payload);
      this.db.writes.push({ table: this.table, kind: "update", rows: out.map((r) => ({ ...r })) });
    }
    if (this.op === "delete") {
      out = all.filter(match);
      this.db.tables[this.table] = all.filter((r) => !match(r));
      this.db.writes.push({ table: this.table, kind: "delete", rows: out });
    }
    if (this.op === "insert") {
      const list = (Array.isArray(this.payload) ? this.payload : [this.payload!]).map((p) => ({ id: crypto.randomUUID(), ...p }));
      for (const row of list) {
        const rejected = this.db.onInsert?.(this.table, row, all);
        if (rejected) return { data: null, error: rejected };
      }
      all.push(...list);
      out = list;
      this.db.writes.push({ table: this.table, kind: "insert", rows: list });
    }
    if (this.op === "upsert") {
      const keys = (this.conflict ?? "id").split(",");
      for (const p of Array.isArray(this.payload) ? this.payload : [this.payload as Row]) {
        const hit = all.find((r) => keys.every((k) => r[k] === p[k]));
        if (hit) Object.assign(hit, p); else all.push({ ...p });
        out.push(hit ?? p);
      }
      this.db.writes.push({ table: this.table, kind: "upsert", rows: out });
    }
    if (this.max != null) out = out.slice(0, this.max);
    if (this.one) {
      if (this.one === "single" && out.length !== 1) return { data: null, error: { message: "not exactly one row" } };
      return { data: out[0] ? { ...out[0] } : null, error: null };
    }
    return { data: out.map((r) => ({ ...r })), error: null };
  }

  then<A = { data: unknown; error: unknown }, B = never>(ok?: ((v: { data: unknown; error: unknown }) => A | PromiseLike<A>) | null, bad?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return Promise.resolve().then(() => this.run()).then(ok, bad);
  }
}
