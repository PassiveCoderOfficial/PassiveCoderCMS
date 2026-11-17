import { NextResponse } from "next/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { canWriteSite } from "@/lib/auth/site-write";
import { upsertSiteIdentity } from "@/lib/site/global-layout";
import {
  normalizeDoc, saveDraft, publish, restoreVersion, switchToClassic, switchToStudio, discardDraft,
  type FooterStudioDoc,
} from "@/modules/footer-studio/doc";
import { footerConfigProblems } from "@/modules/footer-studio/model";

/**
 * Footer Studio storage (site_identity.footer_studio, migration 241).
 *
 * GET  -> the document.
 * POST { action, config?, index? }:
 *   save_draft (config) | publish (config optional: else the draft) |
 *   restore (index, publish?) | discard_draft | use_classic | use_studio
 *
 * Writes go through the caller's own Supabase client, so RLS decides
 * (is_tenant_member: owners, members, assigned staff; plus the layout lock).
 * The classic global_footer is never touched: "use_classic" switches back
 * instantly and the old footer renders exactly as before.
 */
const MISSING_COLUMN = "Footer Studio is not switched on for this database yet (migration 241_footer_studio.sql).";

function columnMissing(msg?: string | null): boolean {
  return !!msg && /footer_studio/.test(msg) && /(does not exist|column|schema cache)/i.test(msg);
}

export async function GET(req: Request) {
  const caller = await getApiCaller(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await caller.supabase.from("site_identity").select("footer_studio").eq("tenant_id", caller.tenantId).maybeSingle();
  if (error) {
    if (columnMissing(error.message)) return NextResponse.json({ doc: normalizeDoc(null), unavailable: MISSING_COLUMN });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ doc: normalizeDoc((data as { footer_studio?: unknown } | null)?.footer_studio) });
}

export async function POST(req: Request) {
  const caller = await getApiCaller(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(caller.tenantId))) return NextResponse.json({ error: "You can view this site but not change it." }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { action?: string; config?: unknown; index?: number; publish?: boolean } | null;
  if (!body?.action) return NextResponse.json({ error: "Missing action" }, { status: 400 });

  if (body.config !== undefined) {
    const problems = footerConfigProblems(body.config);
    if (problems.length) return NextResponse.json({ error: problems[0], problems }, { status: 400 });
  }

  const { data: row, error: readError } = await caller.supabase.from("site_identity").select("footer_studio").eq("tenant_id", caller.tenantId).maybeSingle();
  if (readError) {
    if (columnMissing(readError.message)) return NextResponse.json({ error: MISSING_COLUMN }, { status: 409 });
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }
  const doc = normalizeDoc((row as { footer_studio?: unknown } | null)?.footer_studio);

  let next: FooterStudioDoc;
  switch (body.action) {
    case "save_draft":
      if (body.config === undefined) return NextResponse.json({ error: "Missing config" }, { status: 400 });
      next = saveDraft(doc, body.config);
      break;
    case "publish":
      if (body.config === undefined && !doc.draft && !doc.published) return NextResponse.json({ error: "Nothing to publish yet. Pick a preset first." }, { status: 400 });
      next = publish(doc, body.config, undefined, caller.userId);
      break;
    case "restore":
      if (typeof body.index !== "number" || !doc.history[body.index]) return NextResponse.json({ error: "That version is not there any more." }, { status: 400 });
      next = restoreVersion(doc, body.index, { publishNow: body.publish === true });
      break;
    case "discard_draft":
      next = discardDraft(doc);
      break;
    case "use_classic":
      next = switchToClassic(doc);
      break;
    case "use_studio":
      if (!doc.published) return NextResponse.json({ error: "Publish a studio footer first." }, { status: 400 });
      next = switchToStudio(doc);
      break;
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const error = await upsertSiteIdentity(caller.supabase, caller.tenantId, { footer_studio: next });
  if (error) {
    if (columnMissing(error)) return NextResponse.json({ error: MISSING_COLUMN }, { status: 409 });
    return NextResponse.json({ error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, doc: next });
}
