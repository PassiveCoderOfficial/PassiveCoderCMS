import { layoutLockedFor, LAYOUT_LOCK_MESSAGE } from "@/lib/tenant/layout-lock";
import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { ownType } from "@/lib/collections/server";
import { defaultEntryTemplate } from "@/lib/collections/detail";

/**
 * Create the collection's entry-page template: a normal builder page
 * (settings.collection_template = type id) prefilled with the default entry
 * layout and {{tokens}}. Returns the existing one when it's already there.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ typeId: string }> }) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  if (await layoutLockedFor(a.admin, a.userId, a.tenantId)) return NextResponse.json({ error: LAYOUT_LOCK_MESSAGE }, { status: 403 });
  const { typeId } = await params;
  const type = await ownType(a.admin, a.tenantId, typeId);
  if (!type) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (type.template_page_id) {
    const { data: existing } = await a.admin.from("pages").select("id").eq("id", type.template_page_id).is("deleted_at", null).maybeSingle();
    if (existing) return NextResponse.json({ page_id: existing.id });
  }
  const blocks = defaultEntryTemplate(type).map((b, i) => ({ ...b, order: i }));
  const { data: page, error } = await a.admin.from("pages").insert({
    tenant_id: a.tenantId, title: `${type.singular || type.name} page (template)`, slug: `collection-templates/${type.slug}`,
    type: "page", status: "published", blocks, draft_blocks: blocks, created_by: a.userId,
    seo: { no_index: true }, settings: { collection_template: type.id },
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await a.admin.from("collection_types").update({ template_page_id: page.id }).eq("id", type.id);
  return NextResponse.json({ page_id: page.id });
}
