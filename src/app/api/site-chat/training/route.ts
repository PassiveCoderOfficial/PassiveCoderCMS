import { NextRequest, NextResponse } from "next/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { createAdminClient } from "@/lib/supabase/server";
import { refreshSiteChatKnowledge } from "@/lib/site-chat/knowledge";
import {
  TRAINING_BUCKET, MAX_FILE_PAGES, addTrainingEntry, addTrainingFile, canTrain, deleteTraining, listTraining,
  trainingLimits, updateTrainingEntry,
} from "@/lib/site-chat/training";

export const maxDuration = 60;

/**
 * Train AI tab (dashboard chat > Train AI).
 *
 *   GET -> { items, limits, canEdit, maxPages }  (file text trimmed to a preview)
 *   POST { action: "add", kind: "rule"|"qa", title?, content }
 *   POST { action: "update", id, title?, content? }
 *   POST { action: "delete", id }
 *   POST { action: "slot", name } -> signed upload { path, token } (file goes straight to storage)
 *   POST { action: "file", path, name, type } -> extract text, save, delete the upload
 *
 * Anyone on the site can read; owners, admins, staff and super admins can change.
 */
export async function GET(req: NextRequest) {
  const caller = await getApiCaller(req);
  if (!caller?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await createAdminClient();
  const [items, { data: t }, canEdit] = await Promise.all([
    listTraining(admin, caller.tenantId),
    admin.from("tenants").select("plan").eq("id", caller.tenantId).maybeSingle(),
    canTrain(admin, caller.userId, caller.tenantId),
  ]);
  return NextResponse.json({
    items: items.map((r) => (r.kind === "file" ? { ...r, chars: r.content.length, content: r.content.slice(0, 400) } : r)),
    limits: trainingLimits(t?.plan as string | null), canEdit, maxPages: MAX_FILE_PAGES,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const caller = await getApiCaller(req);
  if (!caller?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await createAdminClient();
  if (!(await canTrain(admin, caller.userId, caller.tenantId))) {
    return NextResponse.json({ error: "Only the site owner or an admin can train the AI." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const tenantId = caller.tenantId;
  try {
    switch (body.action) {
      case "add": {
        if (body.kind !== "rule" && body.kind !== "qa") break;
        const item = await addTrainingEntry(admin, { tenantId, userId: caller.userId, kind: body.kind, title: body.title, content: body.content, source: "dashboard" });
        refreshSiteChatKnowledge(tenantId);
        return NextResponse.json({ item });
      }
      case "update": {
        await updateTrainingEntry(admin, tenantId, String(body.id), { title: body.title, content: body.content });
        refreshSiteChatKnowledge(tenantId);
        return NextResponse.json({ ok: true });
      }
      case "delete": {
        await deleteTraining(admin, tenantId, String(body.id));
        refreshSiteChatKnowledge(tenantId);
        return NextResponse.json({ ok: true });
      }
      case "slot": {
        const ext = String(body.name ?? "").toLowerCase().match(/\.(pdf|docx|txt|md|csv)$/)?.[1];
        if (!ext) return NextResponse.json({ error: "Upload a PDF, Word (.docx) or text file." }, { status: 400 });
        const path = `${tenantId}/${crypto.randomUUID()}.${ext}`;
        const { data, error } = await admin.storage.from(TRAINING_BUCKET).createSignedUploadUrl(path);
        if (error || !data) throw new Error(error?.message ?? "Upload not available");
        return NextResponse.json({ path, token: data.token });
      }
      case "file": {
        const item = await addTrainingFile(admin, { tenantId, userId: caller.userId, path: String(body.path ?? ""), name: String(body.name ?? "file"), type: String(body.type ?? "") });
        return NextResponse.json({ item: { ...item, chars: item.content.length, content: item.content.slice(0, 400) } });
      }
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
