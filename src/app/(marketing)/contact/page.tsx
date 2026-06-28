import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContactForm from "./contact-form";
import MarketingNav from "@/components/marketing/nav";
import FooterSection from "@/components/marketing/footer";
import type { Page } from "@/types/cms";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");
  if (!tenantId) return { title: "Contact — Passive Coder" };

  const supabase = await createClient();
  const { data: page } = await supabase
    .from("pages")
    .select("title, seo")
    .eq("slug", "contact")
    .eq("status", "published")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!page) return { title: "Contact" };
  const seo = page.seo as Page["seo"];
  return {
    title: seo?.title ?? page.title,
    description: seo?.description,
  };
}

export default async function ContactPage() {
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  // On tenant subdomains, this marketing route must NOT handle /contact — it bypasses
  // the (site) layout that injects the global header/footer. notFound() lets Next fall
  // through to the (site)/[...slug] catch-all, which renders the DB contact page wrapped
  // in (site)/layout.tsx (global nav + footer included).
  if (tenantId) notFound();

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">Get in touch</h1>
          <p className="mt-3 text-gray-600">Questions about pricing? Need a custom plan? We're here to help.</p>
        </div>
        <Suspense fallback={<div className="h-96" />}>
          <ContactForm />
        </Suspense>
      </main>
      <FooterSection />
    </div>
  );
}
