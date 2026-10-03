import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { getSiteFacts } from "@/lib/seo/site-facts";

type Check = { key: string; ok: boolean; label: string; fix: string; href?: string };

/**
 * The site's readiness for search and AI answer engines, as a checklist the
 * owner can work through. Every check is something the site itself controls.
 */
export async function GET() {
  const a = await importAccess("read");
  if ("error" in a) return a.error;
  const facts = await getSiteFacts(a.tenantId);
  if (!facts) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const [{ data: settings }, { data: pages }] = await Promise.all([
    a.admin.from("site_settings").select("google_site_verification, bing_site_verification, allow_ai_training").eq("tenant_id", a.tenantId).maybeSingle(),
    a.admin.from("pages").select("slug, seo, blocks").eq("tenant_id", a.tenantId).eq("status", "published").is("deleted_at", null).limit(200),
  ]);
  const published = pages ?? [];
  const withDesc = published.filter((p) => (p.seo as { description?: string } | null)?.description?.trim()).length;
  const hasFaq = published.some((p) => JSON.stringify(p.blocks ?? "").includes('"type":"faq"'));

  const checks: Check[] = [
    { key: "profile", ok: !!(facts.primaryService && (facts.about || facts.description)), label: "Business profile filled in",
      fix: "Add your main service and a short description. AI tools use this to describe your business.", href: "/dashboard/business-profile" },
    { key: "contact", ok: !!(facts.phone || facts.email || facts.whatsapp), label: "Contact details published",
      fix: "Add a phone, WhatsApp or email to your business profile.", href: "/dashboard/business-profile" },
    { key: "areas", ok: facts.areas.length > 0 || !!facts.address, label: "Location or service areas listed",
      fix: "Add the areas you serve so you appear in \"near me\" answers.", href: "/dashboard/business-profile" },
    { key: "services", ok: facts.services.length > 0, label: "Services listed",
      fix: "List your services in the business profile or the Services manager.", href: "/dashboard/business-profile" },
    { key: "faq", ok: hasFaq, label: "A questions & answers section on the site",
      fix: "Add a Questions & Answers block with real customer questions. AI answers often quote these directly.", href: "/dashboard/pages" },
    { key: "descriptions", ok: published.length > 0 && withDesc / published.length >= 0.8, label: `Search descriptions on pages (${withDesc}/${published.length})`,
      fix: "Give each page a search description in its page settings.", href: "/dashboard/pages" },
    { key: "google", ok: !!settings?.google_site_verification, label: "Connected to Google Search Console",
      fix: "Verify your site in Google Search Console (Settings > General). Powers Google and Gemini answers.", href: "/dashboard/settings/general" },
    { key: "bing", ok: !!settings?.bing_site_verification, label: "Connected to Bing Webmaster Tools",
      fix: "Verify your site in Bing Webmaster Tools (Settings > General). ChatGPT search and Copilot use Bing.", href: "/dashboard/settings/general" },
  ];

  return NextResponse.json({
    score: Math.round((checks.filter((c) => c.ok).length / checks.length) * 100),
    checks,
    automatic: [
      { label: "Business details in structured data (schema.org)", url: facts.url },
      { label: "AI summary file", url: `${facts.url}/llms.txt` },
      { label: "Sitemap", url: `${facts.url}/sitemap.xml` },
      { label: "New pages sent to Bing daily (IndexNow)", url: null },
    ],
    allowAiTraining: settings?.allow_ai_training !== false,
  });
}
