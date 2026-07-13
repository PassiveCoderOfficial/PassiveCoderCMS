import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { upsertContact, extractIdentity } from "@/lib/crm/upsertContact";

export async function POST(req: NextRequest) {
  try {
    const { fields, recipient, formName } = await req.json();
    if (!fields || typeof fields !== "object") {
      return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
    }

    const body = Object.entries(fields as Record<string, string>)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    if (recipient) {
      await sendEmail({
        to: recipient,
        subject: "New contact form submission",
        text: body,
      });
    }

    // Feed the CRM — tenant comes from the subdomain-injected header on
    // public sites. Failure here must never break the visitor-facing submit.
    const tenantId = req.headers.get("x-tenant-id");
    if (tenantId) {
      const { email, phone, name } = extractIdentity(fields as Record<string, string>);
      await upsertContact({
        tenantId,
        email,
        phone,
        name,
        source: "form",
        consentEmail: !!email,
        event: {
          type: "form_submission",
          title: formName ? `Form: ${formName}` : "Contact form submission",
          body,
          meta: { fields },
        },
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to process submission" }, { status: 500 });
  }
}
