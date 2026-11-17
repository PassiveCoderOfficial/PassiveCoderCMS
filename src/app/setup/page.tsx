import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isStandalone } from "@/lib/flags";
import { getStandaloneTenant } from "@/lib/tenant/standalone";
import { Installer } from "./installer";

export const metadata: Metadata = { title: "Set up your site", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * The web installer of a standalone (self-hosted) install: system check,
 * database set-up, admin account, site details and optional extras
 * (./installer.tsx). It opens even when the database does not answer yet,
 * because telling the owner why is its first job. Once a site exists it is
 * locked: this page sends visitors to sign in and every /api/setup route
 * refuses (lib/installer/server.ts).
 */
export default async function SetupPage() {
  if (!isStandalone) notFound();
  const tenant = await getStandaloneTenant().catch(() => null);
  if (tenant) redirect("/login");
  return <Installer />;
}
