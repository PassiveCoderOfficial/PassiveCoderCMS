import { NextResponse } from "next/server";
import { saveGlobalLayout, saveGlobalLayoutUpsert } from "@/lib/site/global-layout";
import { toBlocks } from "@/lib/site/global-blocks";
import { mergeFooterForm, mergePrefooterForm, parseFooterFormSave, parsePrefooterFormSave, pickIdentityFields } from "@/lib/site/footer-merge";
import { createClient } from "@/lib/supabase/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { generateId } from "@/lib/utils";

/** nav_menus columns a "menu" save may write (never tenant_id / template_id). */
const MENU_FIELDS = ["name", "slug", "items", "location"] as const;
function pickMenuFields(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of MENU_FIELDS) if (body[k] !== undefined) out[k] = body[k];
  return out;
}


export async function GET() {
  const caller = await getApiCaller();
  const supabase = caller?.supabase ?? (await createClient());
  const tenantId = caller?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: identity }, { data: menus }] = await Promise.all([
    supabase.from("site_identity").select("*").eq("tenant_id", tenantId).single(),
    supabase.from("nav_menus").select("*").eq("tenant_id", tenantId),
  ]);

  return NextResponse.json({ identity: identity ?? null, menus: menus ?? [] });
}

export async function POST(req: Request) {
  const caller = await getApiCaller();
  const supabase = caller?.supabase ?? (await createClient());
  const tenantId = caller?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body._type === "identity") {
    // Identity columns only. The Site Identity screen used to post the whole
    // row as loaded, which wrote stale copies of global_header/global_footer,
    // the template and colour overrides back over later changes.
    const fields = pickIdentityFields(body);
    const { data: existing } = await supabase.from("site_identity").select("id").eq("tenant_id", tenantId).maybeSingle();
    // Surface write failures — these used to be swallowed, so a failed
    // logo/favicon save looked successful in the UI while nothing persisted.
    const { error } = existing
      ? await supabase.from("site_identity").update({ ...fields, updated_at: new Date().toISOString() }).eq("tenant_id", tenantId)
      : await supabase.from("site_identity").insert({ ...fields, tenant_id: tenantId });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body._type === "global_layout") {
    const { global_header, global_footer, global_prefooter } = body;
    // Shared with the MCP set_site_header tool.
    await saveGlobalLayout(supabase, tenantId, { global_header, global_footer, global_prefooter });
    return NextResponse.json({ ok: true });
  }

  // Global Footer / Pre-Footer forms on the Site Identity screen. The form
  // sends what it shows plus the fields the user changed; they are merged into
  // the blocks stored now, so blocks and fields the form does not show (a
  // WhatsApp button, a bottom bar, the logo image, the Retail layout, a
  // banner's own colours) survive the save. See lib/site/footer-merge.ts.
  if (body._type === "footer_form" || body._type === "prefooter_form") {
    const footerSave = body._type === "footer_form" ? parseFooterFormSave(body.save) : null;
    const prefooterSave = body._type === "prefooter_form" ? parsePrefooterFormSave(body.save) : null;
    if (!footerSave && !prefooterSave) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    const { data: row, error: readError } = await supabase
      .from("site_identity").select("global_footer, global_prefooter").eq("tenant_id", tenantId).maybeSingle();
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
    const stored = toBlocks(footerSave ? row?.global_footer : row?.global_prefooter);
    const next = footerSave
      ? mergeFooterForm(stored, footerSave, `footer-${generateId(8)}`)
      : mergePrefooterForm(stored, prefooterSave!, (type) => `${type}-${generateId(8)}`);
    if (JSON.stringify(next) === JSON.stringify(stored)) return NextResponse.json({ ok: true, changed: false });
    // Upsert: creates the site_identity row for the sites that have none.
    const error = await saveGlobalLayoutUpsert(supabase, tenantId, footerSave ? { global_footer: next } : { global_prefooter: next });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ ok: true, changed: true });
  }

  if (body._type === "menu") {
    const fields = pickMenuFields(body);
    const { data, error } = await supabase.from("nav_menus")
      .insert({ ...fields, tenant_id: tenantId }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid _type" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const caller = await getApiCaller();
  const supabase = caller?.supabase ?? (await createClient());
  const tenantId = caller?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { _type, id, ...rest } = await req.json();

  if (_type === "menu") {
    await supabase.from("nav_menus").update({ ...pickMenuFields(rest), updated_at: new Date().toISOString() })
      .eq("id", id).eq("tenant_id", tenantId);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const caller = await getApiCaller();
  const supabase = caller?.supabase ?? (await createClient());
  const tenantId = caller?.tenantId ?? null;
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await supabase.from("nav_menus").delete().eq("id", id).eq("tenant_id", tenantId);
  return NextResponse.json({ ok: true });
}
