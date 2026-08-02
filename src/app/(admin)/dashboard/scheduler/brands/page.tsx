import { getCurrentTenantId } from "@/lib/tenant/current";
import { getBrands, getChannels } from "@/lib/scheduler/queries";
import BrandsClient from "./brands-client";

export const metadata = { title: "Brands — Content Scheduler" };

export default async function BrandsPage() {
  const tid = await getCurrentTenantId();
  const [brands, channels] = await Promise.all([getBrands(tid), getChannels(tid)]);
  return <BrandsClient brands={brands} channels={channels} />;
}
