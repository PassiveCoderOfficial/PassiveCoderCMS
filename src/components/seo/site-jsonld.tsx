import { getSiteFacts } from "@/lib/seo/site-facts";
import { siteJsonLd, ldScript } from "@/lib/seo/jsonld";

/** Business + website structured data for a tenant site; rendered once per page. */
export async function SiteJsonLd({ tenantId }: { tenantId: string | null }) {
  if (!tenantId) return null;
  const facts = await getSiteFacts(tenantId).catch(() => null);
  if (!facts) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(siteJsonLd(facts)) }} />;
}
