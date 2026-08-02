import { getCurrentTenantId } from "@/lib/tenant/current";
import { createClient } from "@/lib/supabase/server";
import { getContentFeed, getBucketCounts, getBrands, getChannels } from "@/lib/scheduler/queries";
import { BUCKETS, type Bucket } from "@/lib/scheduler/types";
import SchedulerClient from "./scheduler-client";

export const metadata = { title: "Content Scheduler — Dashboard" };

export default async function SchedulerPage(props: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // Next 16: searchParams is a Promise.
  const { tab } = await props.searchParams;
  const bucket: Bucket = BUCKETS.includes(tab as Bucket) ? (tab as Bucket) : "upcoming";

  const tid = await getCurrentTenantId();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [items, counts, brands, channels] = await Promise.all([
    getContentFeed({ tenantId: tid, bucket }),
    getBucketCounts(tid),
    getBrands(tid),
    getChannels(tid),
  ]);

  return (
    <SchedulerClient
      bucket={bucket}
      initialItems={items}
      counts={counts}
      brands={brands}
      channels={channels}
      currentUserId={user?.id ?? null}
    />
  );
}
