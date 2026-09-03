import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

/**
 * Capture from Passive Coder's own marketing pages.
 *
 * Public and unauthenticated by design — the whole point is to hear from
 * someone who has not signed up and is not ready to open WhatsApp yet.
 */
const leadSchema = z.object({
  name: z.string().max(120).optional(),
  whatsapp: z.string().min(6).max(40),
  business_type: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  source: z.string().max(80).optional(),
  note: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const parsed = leadSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "A WhatsApp number is required" }, { status: 400 });
  }

  const lead = parsed.data;
  const admin = await createAdminClient();

  const { error } = await admin.from("marketing_leads").insert({
    name: lead.name?.trim() || null,
    whatsapp: lead.whatsapp.trim(),
    business_type: lead.business_type?.trim() || null,
    country: lead.country?.trim() || null,
    source: lead.source?.trim() || "unknown",
    note: lead.note?.trim() || null,
  });

  if (error) {
    console.error("[marketing-lead] insert failed", error.message);
    return NextResponse.json({ error: "Could not save. Please try WhatsApp instead." }, { status: 500 });
  }

  // Tell someone. A lead that sits in a table nobody opens is the same as no
  // lead — and this segment expects a reply within a day.
  const notify = process.env.MARKETING_LEAD_EMAIL || process.env.SUPPORT_EMAIL;
  if (notify) {
    await sendEmail({
      to: notify,
      subject: `New website enquiry — ${lead.name || lead.whatsapp}`,
      text: [
        `Name:     ${lead.name || "-"}`,
        `WhatsApp: ${lead.whatsapp}`,
        `Business: ${lead.business_type || "-"}`,
        `Country:  ${lead.country || "-"}`,
        `Source:   ${lead.source || "-"}`,
        lead.note ? `\nNote:\n${lead.note}` : "",
      ].join("\n"),
    }).catch(() => { /* the row is saved; notification is best-effort */ });
  }

  return NextResponse.json({ ok: true });
}
