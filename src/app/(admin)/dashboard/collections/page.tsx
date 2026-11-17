import { createAdminClient, createClient } from "@/lib/supabase/server";
import { layoutLockedFor } from "@/lib/tenant/layout-lock";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { CollectionTypesManager } from "@/components/admin/collections/types-manager";
import type { CollectionType } from "@/lib/collections/types";

export const metadata = { title: "Collections — Dashboard" };

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const tid = await getCurrentTenantId();
  const admin = await createAdminClient();
  const { data: { user } } = await (await createClient()).auth.getUser();
  const locked = user ? await layoutLockedFor(admin, user.id, tid) : true;
  const { data: types } = await admin.from("collection_types").select("*").eq("tenant_id", tid).order("sort_order").order("created_at");
  const rows = await Promise.all(((types ?? []) as CollectionType[]).map(async (t) => {
    const { count } = await admin.from("collection_entries").select("id", { count: "exact", head: true }).eq("type_id", t.id);
    return { ...t, entry_count: count ?? 0 };
  }));
  return (
    <div className="p-6">
      <CollectionTypesManager key={edit ?? "list"} initial={rows} editId={locked ? undefined : edit} canEdit={!locked} />
    </div>
  );
}
