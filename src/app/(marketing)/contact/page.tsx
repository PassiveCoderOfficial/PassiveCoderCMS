import { Suspense } from "react";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PageRenderer } from "@/components/site/page-renderer";
import ContactForm from "./contact-form";
import MarketingNav from "@/components/marketing/nav";
import FooterSection from "@/components/marketing/footer";
import type { Block, Page } from "@/types/cms";
import type { Metadata } from "next";

// global_header/footer may be a single Block object or a Block[] array
function toBlocks(v: unknown): Block[] {
  if (!v) return [];
  if (Array.isArray(v)) return v as Block[];
  if (typeof v === "object" && (v as Record<string, unknown>).type) return [v as Block];
  return [];
}

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

  // On a tenant subdomain this explicit route wins over the (site) catch-all, so we
  // render the tenant's DB contact page here and inject the global header/footer
  // (same approach as the root "/" marketing page).
  if (tenantId) {
    const supabase = await createClient();
    const [{ data: page }, { data: identity }] = await Promise.all([
      supabase.from("pages").select("*").eq("slug", "contact").eq("status", "published").eq("tenant_id", tenantId).maybeSingle(),
      supabase.from("site_identity").select("global_header, global_footer").eq("tenant_id", tenantId).maybeSingle(),
    ]);
    const blocks = toBlocks(page?.blocks);
    const header = toBlocks(identity?.global_header);
    const footer = toBlocks(identity?.global_footer);
    return (
      <div className="min-h-screen">
        {header.length > 0 && <PageRenderer blocks={header} />}
        <PageRenderer blocks={blocks} />
        {footer.length > 0 && <PageRenderer blocks={footer} />}
      </div>
    );
  }

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
