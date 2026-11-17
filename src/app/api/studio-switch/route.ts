import { NextResponse } from "next/server";
import { requireTenantAccess } from "@/app/api/navigation/access";
import { layoutLockedFor, LAYOUT_LOCK_MESSAGE } from "@/lib/tenant/layout-lock";
import { buildSwitchPayload } from "@/lib/site/studio-switch-payload";
import { prepareSwitch, switchBack, type SwitchArea } from "@/modules/studio-switch/run";

/**
 * "Switch to Studio" for the site's own team (menus P5).
 *
 * GET  -> the before/after payload (read only): classic blocks, the Studio
 *         draft it becomes (or the one already prepared), differences.
 * POST { action: "prepare", areas: ["header"|"footer"], replace? }
 *         -> converts and saves Studio DRAFTS. Nothing goes live: the owner
 *            publishes in the Studio.
 * POST { action: "switch_back", area }
 *         -> a live Studio goes back to the classic one (Studio kept), a
 *            prepared draft is dropped. The classic data is never touched.
 *
 * Who: members with edit access to the current site (owner, admins,
 * assigned staff); the layout lock applies as on the Header Builder.
 */
const AREAS = new Set(["header", "footer"]);

export async function GET() {
  const ctx = await requireTenantAccess();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await buildSwitchPayload(ctx.admin, ctx.tenantId));
}

export async function POST(req: Request) {
  const ctx = await requireTenantAccess();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (await layoutLockedFor(ctx.admin, ctx.userId, ctx.tenantId)) return NextResponse.json({ error: LAYOUT_LOCK_MESSAGE }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { action?: string; areas?: unknown; area?: unknown; replace?: unknown } | null;

  if (body?.action === "prepare") {
    const areas = (Array.isArray(body.areas) ? body.areas : []).filter((a): a is SwitchArea => typeof a === "string" && AREAS.has(a));
    if (!areas.length) return NextResponse.json({ error: "Choose the header, the footer or both." }, { status: 400 });
    const res = await prepareSwitch(ctx.admin, ctx.tenantId, { areas, via: "owner", userId: ctx.userId, replace: body.replace === true });
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 });
    return NextResponse.json(res);
  }

  if (body?.action === "switch_back") {
    const area = typeof body.area === "string" && AREAS.has(body.area) ? (body.area as SwitchArea) : null;
    if (!area) return NextResponse.json({ error: "Missing area" }, { status: 400 });
    const res = await switchBack(ctx.admin, ctx.tenantId, area);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 });
    return NextResponse.json(res);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
