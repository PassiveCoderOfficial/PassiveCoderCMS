/**
 * Set global_prefooter (CTA + Contact) once, strip the duplicated trailing
 * CTA + contact blocks from all tenant pages. Keeps the dedicated /contact page's
 * own contact block (auto-skip handles display there).
 */
const { createClient } = require("@supabase/supabase-js");
const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const TENANT_ID = "636793b3-9104-4e15-9415-eef346a9957a";
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
const uid = (p) => `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const PRIMARY = "#1e3a8a", DARK = "#0b1f4d", WA = "https://wa.me/8801711145428";
const PHONE = "+8801711145428", EMAIL = "info@lifesettlevisa.com";
const ADDRESS = "House #560, Road #8, Adabor, Mohammadpur, Dhaka-1207";
const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };
const BASE = { visible: true, width: "full", padding: { top: 80, right: 0, bottom: 80, left: 0 }, margin: ZERO, background: { type: "none" } };

function prefooterBlocks() {
  return [
    {
      ...BASE, id: uid("cta"), type: "cta", order: 0, padding: ZERO,
      background: { type: "gradient", gradient: `linear-gradient(135deg, ${PRIMARY}, ${DARK})` },
      templateVariant: "gradient-banner",
      data: {
        title: "Ready to Start Your Journey?",
        description: "Free consultation · Expert guidance · 50+ countries. Contact us today.",
        primaryButton: { label: "Free Consultation", url: "/contact" },
        secondaryButton: { label: "WhatsApp Now", url: WA },
        layout: "centered",
      },
    },
    {
      ...BASE, id: uid("contact"), type: "contact", order: 1,
      data: {
        title: "Get In Touch", subtitle: "Free consultation — we respond within 24 hours",
        layout: "split", showMap: false, showContactInfo: true,
        phone: PHONE, email: EMAIL, address: ADDRESS, recipientEmail: EMAIL,
        fields: [
          { id: "f-name", label: "Full Name", type: "text", required: true },
          { id: "f-email", label: "Email Address", type: "email", required: false },
          { id: "f-phone", label: "Phone / WhatsApp", type: "tel", required: true },
          { id: "f-dest", label: "Destination Country", type: "text", required: false },
          { id: "f-msg", label: "Message", type: "textarea", required: true },
        ],
        submitLabel: "Send Message",
        successMessage: "Thank you! Our team will contact you within 24 hours.",
      },
    },
  ];
}

async function run() {
  const now = new Date().toISOString();

  // 1. Save global prefooter
  const { error: e1 } = await sb.from("site_identity")
    .update({ global_prefooter: prefooterBlocks(), updated_at: now })
    .eq("tenant_id", TENANT_ID);
  if (e1) { console.error("prefooter save:", e1.message); return; }
  console.log("✓ global_prefooter saved (CTA + Contact)");

  // 2. Strip trailing cta + contact blocks from every page EXCEPT /contact
  const { data: pages } = await sb.from("pages").select("id, slug, blocks").eq("tenant_id", TENANT_ID);
  let stripped = 0;
  for (const p of pages) {
    if (p.slug === "contact") continue; // keep its own form
    const orig = (p.blocks || []).slice();
    // Strip only the TRAILING run of cta/contact blocks (the duplicated pre-footer pair),
    // preserving mid-page CTAs (e.g. "view all countries").
    let end = orig.length;
    while (end > 0 && (orig[end - 1].type === "cta" || orig[end - 1].type === "contact")) end--;
    if (end < orig.length) {
      const filtered = orig.slice(0, end);
      filtered.forEach((b, i) => { b.order = i; });
      await sb.from("pages").update({ blocks: filtered, updated_at: now }).eq("id", p.id);
      stripped++;
    }
  }
  console.log(`✓ Stripped CTA/contact from ${stripped} pages (kept /contact)`);
  console.log("\n✅ Done. Edit once at dashboard → Identity → Global Pre-Footer.");
}
run().catch(console.error);
