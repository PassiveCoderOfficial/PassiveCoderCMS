import { headers } from "next/headers";
import { getSiteFacts, type SiteFacts } from "@/lib/seo/site-facts";


/**
 * /llms.txt (llmstxt.org): a short, plain-text brief for AI assistants —
 * who the business is, what it offers, where, how to reach it, and which
 * pages to read. Built from the same facts as the structured data, so it
 * stays in step with the site without anyone maintaining it.
 */
function tenantBrief(f: SiteFacts) {
  const lines: string[] = [`# ${f.name}`, ""];
  const summary = f.about ?? f.description;
  if (summary) lines.push(`> ${summary.replace(/\s+/g, " ").slice(0, 400)}`, "");
  const facts: string[] = [];
  if (f.primaryService) facts.push(`- Main service: ${f.primaryService}`);
  if (f.areas.length) facts.push(`- Areas served: ${f.areas.join(", ")}`);
  if (f.address) facts.push(`- Address: ${f.address}`);
  if (f.phone) facts.push(`- Phone: ${f.phone}`);
  if (f.whatsapp) facts.push(`- WhatsApp: https://wa.me/${f.whatsapp.replace(/\D/g, "")}`);
  if (f.email) facts.push(`- Email: ${f.email}`);
  if (f.founded) facts.push(`- In business since: ${f.founded}`);
  facts.push(`- Website: ${f.url}`);
  lines.push("## Key facts", ...facts, "");
  if (f.services.length) {
    lines.push("## Services");
    for (const s of f.services) lines.push(`- ${s.name}${s.description ? `: ${s.description.replace(/\s+/g, " ").slice(0, 200)}` : ""}`);
    lines.push("");
  }
  if (f.pages.length) {
    lines.push("## Pages");
    for (const p of f.pages) lines.push(`- [${p.title}](${f.url}${p.path === "/" ? "" : p.path})${p.description ? `: ${p.description.slice(0, 160)}` : ""}`);
    lines.push("");
  }
  return lines.join("\n");
}

const PLATFORM = `# Passive Coder

> Passive Coder builds and hosts websites for small businesses: service companies, shops, restaurants, real estate and more. Each site comes with a dashboard for pages, bookings, orders, invoices, a CRM and marketing, plus AI that writes and designs pages.

## Key facts
- Website builder and hosting for small businesses, with done-for-you setup
- Plans billed monthly or yearly; payments in USD and BDT
- Custom domains, online booking, ecommerce, POS, invoices, CRM, email marketing
- Works in English and Bangla
- Website: https://www.passivecoder.com

## Pages
- [Home](https://www.passivecoder.com): What Passive Coder does
- [Pricing](https://www.passivecoder.com/pricing): Plans and what each includes
- [Contact](https://www.passivecoder.com/contact): Talk to the team
- [Websites for Bangladeshi businesses](https://www.passivecoder.com/website-for-bangladeshi-businesses)
`;

export async function GET() {
  const tenantId = (await headers()).get("x-tenant-id");
  const facts = tenantId ? await getSiteFacts(tenantId).catch(() => null) : null;
  return new Response(facts ? tenantBrief(facts) : PLATFORM, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
