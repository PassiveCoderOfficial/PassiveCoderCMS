import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { PageRenderer } from "@/components/site/page-renderer";
import { getFallbackHeader } from "@/lib/site/fallback-header";
import { ManageBooking } from "@/components/booking/manage-booking";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your booking", robots: { index: false } };

/** The customer's private booking page: cancel, reschedule, report the deposit. */
export default async function ManageBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId || !/^[a-f0-9]{32}$/.test(token)) notFound();
  const header = await getFallbackHeader(await createAdminClient(), tenantId);
  return (
    <div className="min-h-[70vh]">
      {header.length > 0 && <PageRenderer blocks={header} />}
      <ManageBooking token={token} />
    </div>
  );
}
