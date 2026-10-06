import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { PageRenderer } from "@/components/site/page-renderer";
import { createBlock } from "@/modules/page-builder/block-registry";
import type { Block } from "@/types/cms";

export const dynamic = "force-dynamic";

/**
 * Built-in booking page on every site: /book. Booking settings and opening
 * hours are created for every site (migration 126), so this works from day
 * one with the site's own header and footer (from the site layout). If the
 * owner has made their own page at /book, that page is shown instead.
 */
export async function generateMetadata(): Promise<Metadata> {
  return { title: "Book an appointment", description: "Pick a day and time that works for you." };
}

export default async function BookPage() {
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) notFound();
  const admin = await createAdminClient();
  const [{ data: custom }, { data: settings }] = await Promise.all([
    admin.from("pages").select("blocks").eq("tenant_id", tenantId).eq("slug", "book").eq("status", "published").is("deleted_at", null).maybeSingle(),
    admin.from("booking_settings").select("enabled, service_name").eq("tenant_id", tenantId).maybeSingle(),
  ]);

  if (custom?.blocks && (custom.blocks as Block[]).length) {
    const blocks = (custom.blocks as Block[]).filter((b) => b.type !== "navigation" && b.type !== "footer");
    return <div className="min-h-screen"><PageRenderer blocks={blocks} /></div>;
  }
  if (!settings?.enabled) notFound();

  const booking = createBlock("booking")!;
  booking.data = {
    ...(booking.data as object),
    title: settings.service_name && settings.service_name !== "Appointment" ? `Book: ${settings.service_name}` : "Book an appointment",
    subtitle: "Pick a day and time that works for you. We'll confirm your booking shortly.",
    accentColor: "",
  } as typeof booking.data;
  booking.padding = { top: 96, bottom: 96, left: 16, right: 16 } as typeof booking.padding;

  return <div className="min-h-[70vh]"><PageRenderer blocks={[booking]} /></div>;
}
