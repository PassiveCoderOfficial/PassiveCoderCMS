import { notFound } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { layoutLockedFor } from "@/lib/tenant/layout-lock";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { CollectionEntriesManager } from "@/components/admin/collections/entries-manager";
import { languageName } from "@/lib/i18n-site/translate";
import type { CollectionCategory, CollectionType } from "@/lib/collections/types";

export const metadata = { title: "Collection — Dashboard" };

export default async function CollectionEntriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tid = await getCurrentTenantId();
  const admin = await createAdminClient();
  const { data: { user } } = await (await createClient()).auth.getUser();
  const locked = user ? await layoutLockedFor(admin, user.id, tid) : true;
  const { data: type } = await admin.from("collection_types").select("*").eq("tenant_id", tid).eq("slug", slug).maybeSingle();
  if (!type) notFound();
  const [{ data: cats }, { data: settings }] = await Promise.all([
    admin.from("collection_categories").select("*").eq("type_id", type.id).order("sort_order"),
    admin.from("site_settings").select("language, site_languages").eq("tenant_id", tid).maybeSingle(),
  ]);
  const main = ((settings?.language as string) || "en").split("-")[0];
  const languages = ((settings?.site_languages as string[]) ?? []).filter((l) => l !== main).map((code) => ({ code, name: languageName(code) }));
  return (
    <div className="p-6">
      <CollectionEntriesManager type={type as CollectionType} categories={(cats ?? []) as CollectionCategory[]} languages={languages} canEditType={!locked} />
    </div>
  );
}
