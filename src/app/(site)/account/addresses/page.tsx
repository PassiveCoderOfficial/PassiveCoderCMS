import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deliveryAreas } from "@/lib/ecommerce/delivery-areas";
import { AccountNav } from "../account-nav";
import { listAddressesAction } from "../actions";
import { AddressBook } from "./address-book";
import { isEcomMarketplace } from "@/modules/registry/marketplace/is-marketplace";

export const metadata = { title: "My addresses" };

export default async function AddressesPage() {
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) redirect("/");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login?next=/account/addresses");

  const [addresses, areas, bd] = await Promise.all([listAddressesAction(), deliveryAreas(tenantId), isEcomMarketplace(tenantId)]);
  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
      <AccountNav />
      <AddressBook initial={addresses} areas={areas} bd={bd} />
    </div>
  );
}
