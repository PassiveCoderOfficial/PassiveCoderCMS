/**
 * Returns the blocks to insert for an import, with fresh ids.
 *
 * Ids are regenerated server-side because imported blocks are copies — reusing
 * the source's ids would collide in the builder store and break React keys the
 * moment the same source is imported twice.
 */
import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { checkTenantEditAccess } from "@/modules/tenant/can-edit";
import type { Block, ContainerBlockProps } from "@/types/cms";

function freshIds(block: Block): Block {
  const clone = structuredClone(block);
  clone.id = `blk-${Math.random().toString(36).slice(2, 11)}`;
  if (clone.type === "container") {
    for (const col of (clone as ContainerBlockProps).data.columns) {
      col.blocks = col.blocks.map(freshIds);
    }
  }
  return clone;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    kind: "page" | "template-page" | "template-all";
    /** pages.id for "page", template page id (or registry slug) otherwise. */
    sourceId: string;
    /** Required for template-all: which template to pull every page from. */
    templateId?: string;
    /** Bring the source template's palette across too. */
    withColors?: boolean;
  };

  const admin = await createAdminClient();

  if (body.kind === "page" || body.kind === "template-page") {
    const { data: page } = await admin
      .from("pages")
      .select("blocks, tenant_id, template_id")
      .eq("id", body.sourceId)
      .maybeSingle();
    if (!page) return NextResponse.json({ error: "Source page not found" }, { status: 404 });

    // Reading a tenant's page requires membership; template pages are
    // readable by anyone who can reach the import UI (they're published
    // design assets, not customer data).
    if (page.tenant_id) {
      const access = await checkTenantEditAccess(admin, page.tenant_id as string, user.id);
      if (!access.allowed) {
        return NextResponse.json(
          { error: "You don't have permission to read that site's pages." },
          { status: 403 },
        );
      }
    }

    let palette = null;
    if (body.withColors && page.template_id) {
      const { data: tpl } = await admin.from("templates").select("palette").eq("id", page.template_id).maybeSingle();
      palette = tpl?.palette ?? null;
    }

    return NextResponse.json({
      blocks: ((page.blocks as Block[] | null) ?? []).map(freshIds),
      palette,
    });
  }

  if (body.kind === "template-all") {
    const templateId = body.templateId ?? body.sourceId;

    const [{ data: tpl }, { data: pages }] = await Promise.all([
      admin.from("templates").select("palette").eq("id", templateId).maybeSingle(),
      admin
        .from("pages")
        .select("title, slug, blocks, order_index")
        .eq("template_id", templateId)
        .is("deleted_at", null)
        .order("order_index", { ascending: true }),
    ]);

    return NextResponse.json({
      pages: (pages ?? []).map((p) => ({
        title: p.title,
        slug: p.slug,
        blocks: ((p.blocks as Block[] | null) ?? []).map(freshIds),
      })),
      palette: body.withColors ? tpl?.palette ?? null : null,
    });
  }

  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}
