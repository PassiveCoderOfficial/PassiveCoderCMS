import { NextResponse } from "next/server";
import { getApiCaller, apiSupabase } from "@/lib/auth/api-caller";
import { canWriteSite } from "@/lib/auth/site-write";
import {
  deleteMediaForTenant,
  mediaUsageForTenant,
  updateMediaAltForTenant,
} from "@/lib/media/library";

// Media library. GET lists (web + mobile); PATCH/DELETE are the mobile app's
// equivalents of the dashboard's server actions and share their code
// (lib/media/library.ts). Uploads: POST /api/media/upload. Writes need edit
// rights on the site.

export async function GET(req: Request) {
  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ?usage=<id>: where a file is still used, shown before delete.
  const usageId = new URL(req.url).searchParams.get("usage");
  if (usageId) return NextResponse.json({ usage: await mediaUsageForTenant(usageId, tenantId) });

  const supabase = await apiSupabase();
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

async function writer(): Promise<{ tenantId: string } | NextResponse> {
  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(tenantId))) return NextResponse.json({ error: "You have view-only access to this site." }, { status: 403 });
  return { tenantId };
}

/** { id, alt } */
export async function PATCH(req: Request) {
  const w = await writer();
  if (w instanceof NextResponse) return w;
  const body = (await req.json().catch(() => ({}))) as { id?: string; alt?: string };
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const result = await updateMediaAltForTenant(body.id, String(body.alt ?? ""), w.tenantId);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

/** ?id=<media id> */
export async function DELETE(req: Request) {
  const w = await writer();
  if (w instanceof NextResponse) return w;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const result = await deleteMediaForTenant(id, w.tenantId);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.error === "Not found" ? 404 : 400 });
  return NextResponse.json({ ok: true });
}
