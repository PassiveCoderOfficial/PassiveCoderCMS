import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import BranchesClient from "./branches-client";

export const metadata = { title: "Branches — Dashboard" };

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
const PROTO = ROOT.includes("localhost") ? "http" : "https";

/**
 * Branch + table management (docs/business/06-restaurant-vertical.md gap
 * #5) — until this existed, adding a branch or printing a table's QR code
 * meant a direct DB insert. The only thing this page is really for is
 * producing the qr_token URL each table's printed code needs to point at;
 * everything else here is plain CRUD.
 */
export default async function BranchesPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();

  const [{ data: tenant }, { data: branches }] = await Promise.all([
    supabase.from("tenants").select("slug, custom_domain").eq("id", tid).maybeSingle(),
    supabase.from("restaurant_branches")
      .select("id, name, address, phone, is_active, restaurant_tables(id, table_number, qr_token, is_active)")
      .eq("tenant_id", tid)
      .order("created_at"),
  ]);

  const siteUrl = tenant?.custom_domain ? `${PROTO}://${tenant.custom_domain}` : `${PROTO}://${tenant?.slug}.${ROOT}`;

  return <BranchesClient branches={branches ?? []} siteUrl={siteUrl} />;
}
