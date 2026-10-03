import type { SiteFacts } from "./site-facts";

/**
 * schema.org graph for a site: the business (LocalBusiness when it has a
 * phone or address to be local about, Organization otherwise), the website,
 * and each service it offers. Search engines and AI answer engines read this
 * to state who the business is, what it does and where, without guessing.
 */
export function siteJsonLd(f: SiteFacts) {
  const orgId = `${f.url}/#business`;
  const local = !!(f.address || f.phone || f.areas.length);
  const business: Record<string, unknown> = {
    "@type": local ? "LocalBusiness" : "Organization",
    "@id": orgId,
    name: f.name,
    url: f.url,
    ...(f.logo ? { logo: f.logo, image: f.logo } : {}),
    ...(f.about || f.description ? { description: (f.about ?? f.description)!.slice(0, 500) } : {}),
    ...(f.phone ? { telephone: f.phone } : {}),
    ...(f.email ? { email: f.email } : {}),
    ...(f.address ? { address: { "@type": "PostalAddress", streetAddress: f.address, ...(f.country ? { addressCountry: f.country } : {}) } } : {}),
    ...(f.areas.length ? { areaServed: f.areas.map((a) => ({ "@type": "Place", name: a })) } : {}),
    ...(f.founded ? { foundingDate: String(f.founded) } : {}),
    ...(f.sameAs.length ? { sameAs: f.sameAs } : {}),
    ...(f.whatsapp ? { contactPoint: { "@type": "ContactPoint", contactType: "customer service", url: `https://wa.me/${f.whatsapp.replace(/\D/g, "")}` } } : {}),
    ...(f.services.length ? {
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: f.primaryService ?? "Services",
        itemListElement: f.services.map((s) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: s.name, ...(s.description ? { description: s.description.slice(0, 300) } : {}), provider: { "@id": orgId } },
        })),
      },
    } : {}),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      business,
      { "@type": "WebSite", "@id": `${f.url}/#website`, url: f.url, name: f.name, publisher: { "@id": orgId }, ...(f.language ? { inLanguage: f.language } : {}) },
    ],
  };
}

type FaqItem = { question?: unknown; answer?: unknown };

/** FAQPage for a page's Questions & Answers blocks; null when there are none. */
export function faqJsonLd(blocks: unknown): Record<string, unknown> | null {
  const items: { q: string; a: string }[] = [];
  const walk = (b: unknown) => {
    if (!b || typeof b !== "object") return;
    if (Array.isArray(b)) { b.forEach(walk); return; }
    const blk = b as { type?: string; data?: { items?: FaqItem[] }; children?: unknown; columns?: unknown };
    if (blk.type === "faq" && Array.isArray(blk.data?.items)) {
      for (const i of blk.data.items) {
        const q = typeof i.question === "string" ? i.question.trim() : "";
        const a = typeof i.answer === "string" ? i.answer.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
        if (q && a) items.push({ q, a });
      }
    }
    for (const v of Object.values(blk)) if (v && typeof v === "object") walk(v);
  };
  walk(blocks);
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.slice(0, 30).map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

/** Safe <script> body: JSON with "<" escaped so content can't close the tag. */
export function ldScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
