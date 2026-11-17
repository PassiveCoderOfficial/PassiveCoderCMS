/**
 * Records an auto list can hand-pick from (Menu Studio): the site's services,
 * service categories, product categories, products, blog posts and pages.
 * Used by the menu editor's "Selected items" picker; the live menu resolves
 * them again at render time (expandDynamicChildren), so renames show up.
 */
import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { getApiCaller } from "@/lib/auth/api-caller";
import { checkTenantEditAccess } from "@/modules/tenant/can-edit";

export type AutoPickItem = { id: string; label: string };

const LIMIT = 200;

export async function GET(req: Request) {
  const caller = await getApiCaller();
  let tenantId: string | null;
  let userId: string;
  if (caller?.via === "bearer") {
    tenantId = caller.tenantId;
    userId = caller.userId;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    tenantId = await getCurrentTenantId();
    userId = user.id;
  }
  if (!tenantId) return NextResponse.json({ error: "No site context" }, { status: 400 });

  const admin = await createAdminClient();
  const access = await checkTenantEditAccess(admin, tenantId, userId);
  if (!access.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const source = new URL(req.url).searchParams.get("source");
  let items: AutoPickItem[] = [];
  switch (source) {
    case "products": {
      const { data } = await admin.from("products").select("id, name").eq("tenant_id", tenantId)
        .eq("status", "active").order("created_at", { ascending: false }).limit(LIMIT);
      items = (data ?? []).map((r) => ({ id: r.id as string, label: r.name as string }));
      break;
    }
    case "posts":
    case "blog_categories": {
      const { data } = await admin.from("pages").select("id, title").eq("tenant_id", tenantId)
        .eq("type", "post").eq("status", "published").is("deleted_at", null)
        .order("published_at", { ascending: false, nullsFirst: false }).limit(LIMIT);
      items = (data ?? []).map((r) => ({ id: r.id as string, label: r.title as string }));
      break;
    }
    case "services": {
      const { data } = await admin.from("service_items").select("id, title").eq("tenant_id", tenantId)
        .order("sort_order", { ascending: true }).limit(LIMIT);
      items = (data ?? []).map((r) => ({ id: r.id as string, label: r.title as string }));
      break;
    }
    case "service_groups": {
      const { data } = await admin.from("service_groups").select("id, name").eq("tenant_id", tenantId)
        .order("sort_order", { ascending: true }).limit(LIMIT);
      items = (data ?? []).map((r) => ({ id: r.id as string, label: r.name as string }));
      break;
    }
    case "product_categories": {
      const { data } = await admin.from("categories").select("id, name").eq("tenant_id", tenantId).limit(LIMIT);
      items = (data ?? []).map((r) => ({ id: r.id as string, label: r.name as string }));
      break;
    }
    case "pages": {
      const { data } = await admin.from("pages").select("id, title, slug").eq("tenant_id", tenantId)
        .eq("status", "published").is("deleted_at", null).neq("type", "post")
        .order("order_index", { ascending: true }).limit(LIMIT);
      items = (data ?? []).filter((r) => (r.slug as string).toLowerCase() !== "home")
        .map((r) => ({ id: r.id as string, label: r.title as string }));
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown source" }, { status: 400 });
  }
  return NextResponse.json({ items });
}
