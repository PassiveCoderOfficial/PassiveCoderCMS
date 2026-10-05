import { createAdminClient } from "@/lib/supabase/server";

// Floating WhatsApp / Call / Email buttons, driven by the tenant's primary
// contact_details row (Dashboard → Contact → Floating Contact Buttons).
// The toggles existed since migration 005 but nothing rendered them, so
// sites that switched WhatsApp on never got a button. One server component
// shared by the (site) and (marketing) layouts, so the tenant homepage and
// every other page get the same buttons.

const WA_GREEN = "#25D366";
// floating_color defaults to WhatsApp green. Applied to call/email that would
// look like a second WhatsApp button, so the default means "use the theme".
const isDefaultColor = (c: string | null | undefined) => !c || c.toLowerCase() === WA_GREEN.toLowerCase();

const POSITIONS: Record<string, string> = {
  "bottom-right": "bottom:20px;right:20px",
  "bottom-left": "bottom:20px;left:20px",
  "top-right": "top:96px;right:20px",
  "top-left": "top:96px;left:20px",
};

const digits = (v: string) => v.replace(/[^\d]/g, "");

interface Row {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  floating_whatsapp: boolean;
  floating_call: boolean;
  floating_email: boolean;
  floating_position: string | null;
  floating_color: string | null;
}

export async function FloatingContactButtons({ tenantId }: { tenantId: string | null }) {
  if (!tenantId) return null;
  const admin = await createAdminClient();
  const { data } = await admin
    .from("contact_details")
    .select("phone, whatsapp, email, floating_whatsapp, floating_call, floating_email, floating_position, floating_color")
    .eq("tenant_id", tenantId)
    .or("floating_whatsapp.eq.true,floating_call.eq.true,floating_email.eq.true")
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle<Row>();
  if (!data) return null;

  const accent = isDefaultColor(data.floating_color) ? "hsl(var(--primary))" : data.floating_color!;
  const wa = data.whatsapp || data.phone;
  const buttons: { key: string; href: string; label: string; bg: string; icon: React.ReactNode; external?: boolean }[] = [];

  if (data.floating_call && data.phone) {
    buttons.push({
      key: "call", href: `tel:+${digits(data.phone)}`, label: "Call us", bg: accent,
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
        </svg>
      ),
    });
  }
  if (data.floating_email && data.email) {
    buttons.push({
      key: "email", href: `mailto:${data.email}`, label: "Email us", bg: accent,
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" />
        </svg>
      ),
    });
  }
  if (data.floating_whatsapp && wa) {
    buttons.push({
      key: "whatsapp", href: `https://wa.me/${digits(wa)}`, label: "Chat on WhatsApp", bg: WA_GREEN, external: true,
      icon: (
        <svg viewBox="0 0 32 32" width="28" height="28" fill="#fff" aria-hidden="true">
          <path d="M16 0C7.2 0 0 7.2 0 16c0 2.8.7 5.5 2 7.8L0 32l8.5-2A16 16 0 1 0 16 0zm0 29.3c-2.4 0-4.7-.6-6.7-1.8l-.5-.3-5 1.2 1.2-4.9-.3-.5A13.3 13.3 0 1 1 16 29.3zm7.3-10c-.4-.2-2.4-1.2-2.7-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.3 1.6-.2.3-.5.3-.9.1-.4-.2-1.7-.6-3.2-2-1.2-1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.3.1-.5 0-.7l-1.2-3c-.3-.8-.7-.7-.9-.7h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.3s1.4 3.9 1.6 4.1c.2.3 2.8 4.3 6.8 6 1 .4 1.7.7 2.3.8 1 .3 1.8.3 2.5.2.8-.1 2.4-1 2.7-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5z" />
        </svg>
      ),
    });
  }
  if (buttons.length === 0) return null;

  const pos = POSITIONS[data.floating_position ?? ""] ?? POSITIONS["bottom-right"];
  const top = (data.floating_position ?? "").startsWith("top");
  // WhatsApp sits nearest the corner; the others stack away from it.
  const ordered = top ? [...buttons].reverse() : buttons;

  return (
    <>
      <style precedence="pc-floating" href="pc-floating-contact" dangerouslySetInnerHTML={{ __html: `
.pc-fcb{position:fixed;${pos};z-index:9990;display:flex;flex-direction:column;gap:12px}
.pc-fcb a{width:56px;height:56px;border-radius:9999px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.25);transition:transform .15s ease}
.pc-fcb a:hover{transform:scale(1.07)}
@media(max-width:640px){.pc-fcb{gap:10px}.pc-fcb a{width:52px;height:52px}}
@media print{.pc-fcb{display:none}}` }} />
      <div className="pc-fcb">
        {ordered.map((b) => (
          <a key={b.key} href={b.href} aria-label={b.label} title={b.label} style={{ background: b.bg }}
            {...(b.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {b.icon}
          </a>
        ))}
      </div>
    </>
  );
}
