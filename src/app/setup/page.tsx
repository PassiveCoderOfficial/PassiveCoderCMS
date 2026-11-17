import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isStandalone } from "@/lib/flags";
import { getStandaloneTenant } from "@/lib/tenant/standalone";
import { SetupForm } from "./setup-form";

export const metadata: Metadata = { title: "Set up your site", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** First-run setup of a standalone (self-hosted) install. */
export default async function SetupPage() {
  if (!isStandalone) notFound();
  const tenant = await getStandaloneTenant().catch(() => null);
  if (tenant) redirect("/login");

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Set up your site</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create the admin account and name your site. You can change everything later in the dashboard.
          </p>
        </div>
        <SetupForm needsToken={!!process.env.SETUP_TOKEN?.trim()} />
      </div>
    </main>
  );
}
