import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import ApiKeysClient from "./api-keys-client";

export const metadata = { title: "API Keys — Dashboard" };

export default async function ApiKeysPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();

  const { data: keys } = await supabase.from("tenant_api_keys")
    .select("id, name, key_prefix, scopes, last_used_at, revoked_at, created_at")
    .eq("tenant_id", tid)
    .order("created_at", { ascending: false });

  return <ApiKeysClient initialKeys={keys ?? []} />;
}
