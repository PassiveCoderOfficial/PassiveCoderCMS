/**
 * Menu history (menus P1, Nov 2026).
 *
 * GET  ?menuId=<id>                        versions of one menu, newest first, with who saved each
 * POST { menuId, versionId }               put that version back (a new save, so it can be undone too)
 * POST { menuId, undo: true }              one step back: the newest version that differs from now
 *
 * History lives in nav_menu_versions (migration 252); before it is applied
 * GET answers { enabled: false } and the screen says so.
 */
import { NextResponse } from "next/server";
import { requireTenantAccess } from "../access";
import { listMenuVersions, restoreMenuVersion } from "@/modules/navigation/menu-versions";
import { countItems } from "@/modules/navigation/menu-history";
import { normalizeMenu } from "@/modules/navigation/menu-model";

export type MenuVersionView = {
  id: string;
  name: string;
  source: string;
  created_at: string;
  saved_by: string | null;
  saved_by_name: string | null;
  item_count: number;
};

export async function GET(req: Request) {
  const ctx = await requireTenantAccess();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const menuId = new URL(req.url).searchParams.get("menuId");
  if (!menuId) return NextResponse.json({ error: "Menu id is required" }, { status: 400 });

  const versions = await listMenuVersions(ctx.admin, ctx.tenantId, menuId);
  if (versions === null) return NextResponse.json({ enabled: false, versions: [] });

  const userIds = [...new Set(versions.map((v) => v.saved_by).filter((x): x is string => !!x))];
  const names = new Map<string, string>();
  if (userIds.length) {
    const { data } = await ctx.admin.from("profiles").select("id, full_name, email").in("id", userIds);
    for (const p of (data ?? []) as { id: string; full_name: string | null; email: string | null }[]) {
      names.set(p.id, p.full_name?.trim() || p.email || "");
    }
  }
  const out: MenuVersionView[] = versions.map((v) => ({
    id: v.id,
    name: v.name,
    source: v.source,
    created_at: v.created_at,
    saved_by: v.saved_by,
    saved_by_name: v.saved_by ? names.get(v.saved_by) || null : null,
    item_count: countItems(v.items),
  }));
  return NextResponse.json({ enabled: true, versions: out });
}

export async function POST(req: Request) {
  const ctx = await requireTenantAccess();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({})) as { menuId?: string; versionId?: string; undo?: boolean };
  if (!body.menuId) return NextResponse.json({ error: "Menu id is required" }, { status: 400 });
  if (!body.undo && !body.versionId) return NextResponse.json({ error: "Choose a version" }, { status: 400 });

  const res = await restoreMenuVersion(ctx.admin, {
    tenantId: ctx.tenantId, menuId: body.menuId, versionId: body.undo ? "undo" : body.versionId!, userId: ctx.userId,
  });
  if (!res.menu) return NextResponse.json({ error: res.error ?? "Could not restore this version" }, { status: 400 });
  return NextResponse.json({ menu: { ...res.menu, items: normalizeMenu(res.menu.items) }, restored: res.restored?.id ?? null });
}
