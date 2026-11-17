import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { toBlocks } from "@/lib/site/global-blocks";
import { findFooterBlock } from "@/lib/site/footer-merge";
import IdentityClient from "./identity-client";

export const metadata = { title: "Header & Footer — Dashboard" };

export default async function HeaderFooterPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();
  const [{ data: identity }, { data: menus }] = await Promise.all([
    supabase.from("site_identity")
      .select("site_name, tagline, logo_url, logo_dark_url, logo_width, logo_alt, favicon_url, global_header, global_footer, global_prefooter")
      .eq("tenant_id", tid).single(),
    supabase.from("nav_menus").select("*").eq("tenant_id", tid),
  ]);

  // global_header/footer may be single block object or null
  const globalHeader = identity?.global_header
    ? (typeof identity.global_header === "object" && !Array.isArray(identity.global_header)
        ? identity.global_header as Record<string, unknown>
        : Array.isArray(identity.global_header) && identity.global_header.length > 0
          ? identity.global_header[0] as Record<string, unknown>
          : null)
    : null;

  // The Global Footer form edits the site's footer block wherever it sits:
  // some sites keep a WhatsApp button or a newsletter strip before it, which
  // the form used to load (and save over) as if it were the footer.
  const footerBlocks = toBlocks(identity?.global_footer);
  const globalFooter = findFooterBlock(footerBlocks) as unknown as Record<string, unknown> | null;

  // global_prefooter is a Block[] (cta + contact, sometimes more). Pull each out for the editor.
  const prefooter = toBlocks(identity?.global_prefooter);
  const prefooterCta = (prefooter.find((b) => b.type === "cta") ?? null) as unknown as Record<string, unknown> | null;
  const prefooterContact = (prefooter.find((b) => b.type === "contact") ?? null) as unknown as Record<string, unknown> | null;

  // Only the fields the Site Identity form edits; its save sends back the ones the user changed.
  const identityFields = identity
    ? {
        site_name: identity.site_name, tagline: identity.tagline, logo_url: identity.logo_url,
        logo_dark_url: identity.logo_dark_url, logo_width: identity.logo_width, logo_alt: identity.logo_alt,
        favicon_url: identity.favicon_url,
      }
    : null;

  return (
    <IdentityClient
      initialIdentity={identityFields}
      initialMenus={menus ?? []}
      initialGlobalHeader={globalHeader}
      initialGlobalFooter={globalFooter}
      footerHasOtherBlocks={footerBlocks.some((b) => b.type !== "footer")}
      initialPrefooterCta={prefooterCta}
      initialPrefooterContact={prefooterContact}
    />
  );
}
