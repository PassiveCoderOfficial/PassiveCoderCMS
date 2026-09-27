import { createAdminClient } from "@/lib/supabase/server";
import { DEMO_SALES_WHATSAPP, waLink, hoursLeft } from "@/modules/demo/links";

/**
 * Bottom bar on staff-built demo sites: says it's a preview and sends the
 * prospect to Passive Coder's WhatsApp to pay (bank / bKash) and go live.
 * Renders nothing for normal tenants.
 */
export async function DemoBanner({ tenantId }: { tenantId: string | null }) {
  if (!tenantId) return null;
  const admin = await createAdminClient();
  const { data: t } = await admin
    .from("tenants").select("name,slug,demo_expires_at").eq("id", tenantId).maybeSingle();
  if (!t?.demo_expires_at) return null;

  const left = hoursLeft(t.demo_expires_at);
  const href = waLink(
    DEMO_SALES_WHATSAPP,
    `Hi Passive Coder, I saw my demo website (${t.slug}). I want to make it live. How do I pay?`,
  );

  return (
    <>
      <div aria-hidden style={{ height: 64 }} />
      <div
        style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60, background: "#111827", color: "#fff", boxShadow: "0 -4px 20px rgba(0,0,0,.25)" }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "space-between", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ fontSize: 13, lineHeight: 1.35, minWidth: 0, flex: "1 1 240px" }}>
            <strong>Demo website for {t.name}</strong>
            <span style={{ opacity: 0.75 }}> by Passive Coder. Go live on your own domain. Preview ends in {left} {left === 1 ? "hour" : "hours"}.</span>
          </div>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 14, padding: "10px 16px", borderRadius: 999, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Pay and Confirm
          </a>
        </div>
      </div>
    </>
  );
}
