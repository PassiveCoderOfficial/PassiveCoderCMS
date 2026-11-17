import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { rootTenantId } from "@/lib/site/root-builder";
import { loadSiteChrome, SiteChromeShell as Shell } from "@/lib/site/site-chrome";
import { PLATFORM_WHATSAPP } from "@/lib/platform-contact";

/**
 * The 404 for every host. Three cases:
 *  - passivecoder.com: the root site's own header/footer and the Pro look
 *    (app/pro.css) the rest of the root site uses.
 *  - a client's site (x-tenant-id from the proxy): that site's header,
 *    footer and theme colours, neutral wording.
 *  - an unknown host (no such site): a clean "site not found" card.
 * Always answers HTTP 404 (Next sets it for notFound()).
 */
export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

const ROOT = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com").split(":")[0].toLowerCase();
const WHATSAPP = `https://wa.me/${PLATFORM_WHATSAPP}`;
const chromeFor = (tenantId: string) => loadSiteChrome(tenantId);

export default async function NotFound() {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim().split(":")[0].toLowerCase();
  const tenantId = h.get("x-tenant-id");
  const isRoot = !tenantId && (host === ROOT || host === ROOT || host === "localhost");

  if (isRoot) {
    const id = await rootTenantId().catch(() => null);
    const chrome = id ? await loadSiteChrome(id, { fixture: true }) : null;
    const links = [
      { href: "/", label: "Home", note: "Start from the beginning" },
      { href: "/pricing", label: "Pricing", note: "Packages and what is included" },
      { href: "/open-source-cms", label: "Open source", note: "The self-hosted edition" },
      { href: "/contact", label: "Contact", note: "Talk to our team" },
    ];
    return (
      <div className="pcx" style={{ background: "#f6f7f9" }}>
        <Shell chrome={chrome}>
          <section className="pcx-wrap px-6 py-16 sm:py-24">
            <p className="pcx-eyebrow">Error 404</p>
            <h1 className="pcx-h1 mt-4 max-w-3xl">This page took a wrong turn.</h1>
            <p className="pcx-lead mt-5 max-w-xl">
              The link may be old or mistyped, or the page has moved. Everything else is still here. Pick a place to go next, or message us and we will point you to it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/" className="pcx-btn pcx-btn-lg pcx-btn-primary">Back to home</Link>
              {PLATFORM_WHATSAPP && (
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="pcx-btn pcx-btn-lg pcx-btn-outline">Chat on WhatsApp</a>
              )}
            </div>
            <ul className="m-0 mt-14 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="pcx-card pcx-card-hover group block h-full p-5 no-underline hover:border-[color:var(--pcx-line-strong)]">
                    <span className="pcx-h3 flex items-center justify-between !text-base">
                      {l.label}
                      <span aria-hidden="true" className="pcx-accent-text">&rarr;</span>
                    </span>
                    <span className="pcx-small mt-1 block">{l.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Shell>
      </div>
    );
  }

  if (tenantId) {
    const chrome = await chromeFor(tenantId);
    return (
      <div className="bg-background text-foreground">
        <Shell chrome={chrome}>
          <section className="mx-auto w-full max-w-2xl px-4 py-20 text-center sm:py-28">
            <p className="text-7xl font-extrabold tracking-tight text-primary sm:text-8xl">404</p>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Page not found</h1>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              The page you are looking for may have moved or no longer exists.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/" className="inline-flex h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground transition hover:opacity-90">
                Go to {chrome?.name ? `${chrome.name} home` : "the home page"}
              </Link>
              <Link href="/contact" className="inline-flex h-11 items-center rounded-full border border-border px-6 font-semibold transition hover:bg-muted">
                Contact us
              </Link>
            </div>
          </section>
        </Shell>
      </div>
    );
  }

  // Unknown host: no site is set up at this address.
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16" style={{ background: "#f7f4ef" }}>
      <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "#ff7600" }}>Site not found</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#1a1a1a]">There is no website here yet</h1>
        <p className="mt-3 text-[#4a4a4a]">
          This address is not connected to a live site. If it is yours, it may still be launching or its domain may still be connecting.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a href={`https://${ROOT}`} className="inline-flex h-11 items-center rounded-full px-6 font-semibold text-white" style={{ background: "#ff7600" }}>
            Visit Passive Coder
          </a>
          <a href={`https://${ROOT}/contact`} className="inline-flex h-11 items-center rounded-full border border-black/15 px-6 font-semibold text-[#1a1a1a]">
            Get help
          </a>
        </div>
      </div>
    </main>
  );
}
