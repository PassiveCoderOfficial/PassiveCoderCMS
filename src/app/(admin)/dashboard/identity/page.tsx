import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import IdentityClient from "./identity-client";

export const metadata = { title: "Identity & Nav — Dashboard" };

export default async function IdentityPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();
  const [{ data: identity }, { data: menus }] = await Promise.all([
    supabase.from("site_identity").select("*").eq("tenant_id", tid).single(),
    supabase.from("nav_menus").select("*").eq("tenant_id", tid),
  ]);

  // global_header/footer may be single block object or null
  const globalHeader = identity?.global_header
    ? (typeof identity.global_header === "object" && !Array.isArray(identity.global_header)
        ? identity.global_header as Record<string, unknown>
        : Array.isArray(identity.global_header) && identity.global_header.length > 0
          ? identity.global_header[0] as Record<string, unknown>
          : null)
    : null;

  const globalFooter = identity?.global_footer
    ? (typeof identity.global_footer === "object" && !Array.isArray(identity.global_footer)
        ? identity.global_footer as Record<string, unknown>
        : Array.isArray(identity.global_footer) && identity.global_footer.length > 0
          ? identity.global_footer[0] as Record<string, unknown>
          : null)
    : null;

  return (
    <IdentityClient
      initialIdentity={identity ?? null}
      initialMenus={menus ?? []}
      initialGlobalHeader={globalHeader}
      initialGlobalFooter={globalFooter}
    />
  );
}
