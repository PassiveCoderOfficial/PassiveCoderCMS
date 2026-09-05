import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { requireModule } from "@/lib/modules/resolve-modules";
import { sectionByKey } from "@/lib/aicoder/sections/registry";
import { createSlug } from "@/lib/utils";

/**
 * Writes a previously-generated section proposal into the tenant's real data.
 *
 * Split from the generate route so nothing reaches a customer's live content
 * until they have seen it and said yes — generating straight into the services
 * list would make AiCoder the one surface that can silently rewrite real
 * content.
 *
 * Everything here APPENDS. A tenant who already has services keeps them and
 * gets the generated ones added below; nothing is replaced or deleted, so a
 * bad generation costs a few rows to delete rather than lost work.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!await requireModule(tenantId, "ai_coder")) {
    return NextResponse.json({ error: "AiCoder isn't included in this site's plan" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { section: sectionKey, content } = body as { section?: string; content?: unknown };

  const def = sectionKey ? sectionByKey(sectionKey) : null;
  if (!def) return NextResponse.json({ error: "Unknown section" }, { status: 400 });

  // Re-validate against the same schema the generator used. The content round-
  // trips through the client, so trusting it here would mean writing arbitrary
  // caller-supplied JSON into tenant tables.
  const parsed = def.schema.safeParse(content);
  if (!parsed.success) {
    return NextResponse.json({ error: "That proposal is no longer valid — generate it again." }, { status: 400 });
  }

  const admin = await createAdminClient();

  try {
    switch (def.key) {
      case "services":
      case "features": {
        const table = def.key === "services" ? "service_items" : "feature_items";
        const groupTable = def.key === "services" ? "service_groups" : "feature_groups";
        const groupId = await ensureGroup(admin, groupTable, tenantId, def.label);

        const { items } = parsed.data as { items: { title: string; description: string; icon?: string | null }[] };
        const startOrder = await nextSortOrder(admin, table, tenantId);

        const { error } = await admin.from(table).insert(
          items.map((item, i) => ({
            tenant_id: tenantId,
            group_id: groupId,
            title: item.title,
            description: item.description,
            // Schema constrains icon to real lucide names, so this is safe to
            // write straight through; the renderer resolves it by exact name.
            icon: item.icon ?? "Star",
            icon_type: "lucide",
            sort_order: startOrder + i,
          })),
        );
        if (error) throw new Error(error.message);
        return NextResponse.json({ ok: true, message: `Added ${items.length} ${def.label.toLowerCase()}` });
      }

      case "testimonials": {
        const groupId = await ensureGroup(admin, "testimonial_groups", tenantId, "Testimonials");
        const { items } = parsed.data as {
          items: { name: string; role?: string | null; company?: string | null; content: string }[];
        };
        const startOrder = await nextSortOrder(admin, "testimonials", tenantId);

        const { error } = await admin.from("testimonials").insert(
          items.map((item, i) => ({
            tenant_id: tenantId,
            group_id: groupId,
            source: "custom",
            name: item.name,
            role: item.role ?? null,
            company: item.company ?? null,
            content: item.content,
            rating: 5,
            // Deliberately unpublished: these are AI placeholders, not real
            // reviews, and must not reach a live site until a human has
            // replaced them with genuine ones.
            published: false,
            sort_order: startOrder + i,
          })),
        );
        if (error) throw new Error(error.message);
        return NextResponse.json({
          ok: true,
          message: `Added ${items.length} placeholder testimonials (unpublished)`,
        });
      }

      case "seo": {
        const { metaTitle, metaDescription } = parsed.data as { metaTitle: string; metaDescription: string };
        const { error } = await admin
          .from("site_settings")
          .upsert(
            { tenant_id: tenantId, meta_title: metaTitle, meta_description: metaDescription, updated_at: new Date().toISOString() },
            { onConflict: "tenant_id" },
          );
        if (error) throw new Error(error.message);
        return NextResponse.json({ ok: true, message: "SEO title and description saved" });
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Couldn't save that" },
      { status: 500 },
    );
  }

  return NextResponse.json({ error: "Unhandled section" }, { status: 400 });
}

/** Reuses the tenant's first group for this section, creating one only when
 *  they have none — generated items should land where their existing content
 *  already lives rather than in a new group nobody asked for. */
async function ensureGroup(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  table: string,
  tenantId: string,
  label: string,
): Promise<string> {
  const { data: existing } = await admin
    .from(table)
    .select("id")
    .eq("tenant_id", tenantId)
    .order("sort_order")
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data: created, error } = await admin
    .from(table)
    .insert({ tenant_id: tenantId, name: label, slug: createSlug(label), sort_order: 0 })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return created.id as string;
}

/** Appends after whatever the tenant already has, so generated rows don't
 *  jump above hand-written ones. */
async function nextSortOrder(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  table: string,
  tenantId: string,
): Promise<number> {
  const { data } = await admin
    .from(table)
    .select("sort_order")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.sort_order as number | undefined) ?? -1) + 1;
}
