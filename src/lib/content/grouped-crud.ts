import "server-only";
import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";

/**
 * One API for every "groups of items" content manager (services, features,
 * portfolio, sliders, testimonials). Previously each had its own copy and
 * they drifted: some swallowed database errors and reported success, all
 * accepted any column in an update (tenant_id included), new items weren't
 * checked to belong to one of the site's own groups, viewers could write,
 * and assigned staff without a membership row were silently refused by RLS.
 *
 * Reads need site access; writes need write access (owner/admin/editor,
 * assigned staff, super admin). Queries use the service client but are
 * always scoped to the caller's site.
 */
type Config = {
  groupTable: string;
  itemTable: string;
  /** Accepted `_type` values for items (sliders call theirs "slide"). */
  itemTypes: string[];
};

const PROTECTED = new Set(["id", "tenant_id", "created_at", "updated_at", "_type"]);

function clean(fields: Record<string, unknown>, keepGroup: boolean) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (PROTECTED.has(k) || (!keepGroup && k === "group_id")) continue;
    if (Array.isArray(v) && !["tags"].includes(k)) continue; // nested relations from the GET payload
    if (v && typeof v === "object" && !Array.isArray(v)) continue;
    out[k] = v;
  }
  return out;
}

export function groupedCrud(cfg: Config) {
  const isItem = (t: unknown) => cfg.itemTypes.includes(String(t));

  async function GET() {
    const a = await importAccess("read");
    if ("error" in a) return a.error;
    const { data, error } = await a.admin.from(cfg.groupTable)
      .select(`*, ${cfg.itemTable}(*)`).eq("tenant_id", a.tenantId).order("sort_order");
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    // Embedded rows come back unordered; the editor and the site both expect sort order.
    for (const g of data ?? []) {
      const items = (g as unknown as Record<string, { sort_order?: number; created_at?: string }[] | undefined>)[cfg.itemTable];
      if (Array.isArray(items)) items.sort((x, y) => ((x.sort_order ?? 0) - (y.sort_order ?? 0)) || String(x.created_at).localeCompare(String(y.created_at)));
    }
    return NextResponse.json(data ?? []);
  }

  async function ownGroup(a: Exclude<Awaited<ReturnType<typeof importAccess>>, { error: unknown }>, groupId: unknown) {
    if (typeof groupId !== "string") return false;
    const { data } = await a.admin.from(cfg.groupTable).select("id").eq("id", groupId).eq("tenant_id", a.tenantId).maybeSingle();
    return !!data;
  }

  async function POST(req: Request) {
    const a = await importAccess("write");
    if ("error" in a) return a.error;
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    if (body._type === "group") {
      const { data, error } = await a.admin.from(cfg.groupTable)
        .insert({ ...clean(body, false), tenant_id: a.tenantId }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json(data);
    }
    if (isItem(body._type)) {
      if (!(await ownGroup(a, body.group_id))) return NextResponse.json({ error: "Group not found" }, { status: 404 });
      const { data, error } = await a.admin.from(cfg.itemTable)
        .insert({ ...clean(body, true), tenant_id: a.tenantId }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: "Invalid _type" }, { status: 400 });
  }

  async function PATCH(req: Request) {
    const a = await importAccess("write");
    if ("error" in a) return a.error;
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const group = body._type === "group";
    if (!group && !isItem(body._type)) return NextResponse.json({ error: "Invalid _type" }, { status: 400 });
    if (typeof body.id !== "string") return NextResponse.json({ error: "Missing id" }, { status: 400 });
    // Moving an item between groups is allowed, but only into this site's own groups.
    if (!group && "group_id" in body && !(await ownGroup(a, body.group_id))) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    const fields = clean(body, !group);
    if (!Object.keys(fields).length) return NextResponse.json({ ok: true });
    const { data, error } = await a.admin.from(group ? cfg.groupTable : cfg.itemTable)
      .update(fields).eq("id", body.id).eq("tenant_id", a.tenantId).select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data?.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  async function DELETE(req: Request) {
    const a = await importAccess("write");
    if ("error" in a) return a.error;
    const sp = new URL(req.url).searchParams;
    const id = sp.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const group = sp.get("type") === "group";
    if (group) {
      // Items first, so deleting a group never leaves orphans behind.
      await a.admin.from(cfg.itemTable).delete().eq("group_id", id).eq("tenant_id", a.tenantId);
    }
    const { error } = await a.admin.from(group ? cfg.groupTable : cfg.itemTable).delete().eq("id", id).eq("tenant_id", a.tenantId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return { GET, POST, PATCH, DELETE };
}
