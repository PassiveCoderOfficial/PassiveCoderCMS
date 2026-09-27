import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { upsertContact } from "@/lib/crm/upsertContact";
import { sendEmail } from "@/lib/email";

const KINDS = new Set(["enquiry", "brochure", "valuation", "viewing", "consultation", "whatsapp"]);
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "") || null;

/**
 * POST — every real estate enquiry path lands here: property enquiry,
 * gated brochure download, valuation, viewing/consultation request, and
 * WhatsApp-button clicks (logged so the agent sees which listing sparked the
 * chat). Writes re_leads + the CRM contact, emails the agent. Brochure leads
 * get the brochure URL back only after the phone number is captured.
 */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const kind = KINDS.has(body.kind) ? body.kind : "enquiry";
  const name = clip(body.name, 120);
  const phone = clip(body.phone, 40);
  const email = clip(body.email, 160);
  const message = clip(body.message, 2000);
  const budget = clip(body.budget, 80);

  if (kind !== "whatsapp" && !phone && !email) {
    return NextResponse.json({ error: "Please add your phone or WhatsApp number" }, { status: 400 });
  }
  if (phone && phone.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ error: "Please enter a valid phone number with country code" }, { status: 400 });
  }

  const admin = await createAdminClient();

  let property: { id: string; title: string; slug: string; brochure_url: string | null } | null = null;
  if (typeof body.propertyId === "string" && body.propertyId) {
    const { data } = await admin.from("re_properties").select("id, title, slug, brochure_url")
      .eq("tenant_id", tenantId).eq("id", body.propertyId).maybeSingle();
    property = data;
  }

  // WhatsApp clicks carry no identity; only record them (no CRM contact).
  let contactId: string | null = null;
  if (kind !== "whatsapp") {
    const lines = [
      property ? `Property: ${property.title}` : null,
      budget ? `Budget: ${budget}` : null,
      message,
    ].filter(Boolean).join("\n");
    contactId = await upsertContact({
      tenantId, name, phone, email, whatsapp: phone, source: "form",
      tags: ["real-estate", kind],
      consentEmail: !!email, consentWhatsapp: !!phone,
      event: { type: "form_submission", title: `Real estate ${kind}${property ? `: ${property.title}` : ""}`, body: lines || null, meta: { kind, propertyId: property?.id ?? null } },
    }).catch(() => null);
  }

  await admin.from("re_leads").insert({
    tenant_id: tenantId, property_id: property?.id ?? null, contact_id: contactId, kind,
    name, phone, email, message, budget,
    meta: { page: clip(body.page, 300), extra: typeof body.meta === "object" && body.meta ? body.meta : {} },
  });

  if (kind !== "whatsapp") {
    const [{ data: tenant }, { data: settings }] = await Promise.all([
      admin.from("tenants").select("demo_expires_at, name").eq("id", tenantId).maybeSingle(),
      admin.from("re_settings").select("email").eq("tenant_id", tenantId).maybeSingle(),
    ]);
    if (settings?.email && !tenant?.demo_expires_at) {
      await sendEmail({
        to: settings.email,
        subject: `New ${kind} lead${property ? ` — ${property.title}` : ""}`,
        text: [
          `Name: ${name ?? "-"}`, `Phone/WhatsApp: ${phone ?? "-"}`, `Email: ${email ?? "-"}`,
          budget ? `Budget: ${budget}` : "", property ? `Property: ${property.title}` : "",
          message ? `\n${message}` : "",
        ].filter(Boolean).join("\n"),
      }).catch(() => null);
    }
  }

  return NextResponse.json({ ok: true, brochureUrl: kind === "brochure" ? property?.brochure_url ?? null : undefined });
}
