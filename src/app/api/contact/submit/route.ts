import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { upsertContact, extractIdentity } from "@/lib/crm/upsertContact";
import { createAdminClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The contact_forms row submissions hang off (form_id is NOT NULL). One row
 *  per tenant + form name, created on first submit. */
async function formRow(admin: SupabaseClient, tenantId: string, name: string) {
  const { data: found } = await admin
    .from("contact_forms").select("id, recipient_email")
    .eq("tenant_id", tenantId).eq("name", name).limit(1).maybeSingle();
  if (found) return found as { id: string; recipient_email: string | null };
  const { data: made } = await admin
    .from("contact_forms").insert({ tenant_id: tenantId, name }).select("id, recipient_email").single();
  return (made ?? null) as { id: string; recipient_email: string | null } | null;
}

/**
 * Who gets the notification email. Never trust the browser's `recipient` on
 * its own: this endpoint is public, so honouring any address turned it into
 * an open mail relay. A client-sent address is only used when the site owner
 * actually configured it (it appears in the tenant's own page content);
 * otherwise fall back to the form's recipient, the site's contact email, then
 * the owner's login email — so a block left with an empty "Recipient email"
 * still reaches the business instead of silently emailing nobody.
 */
async function resolveRecipient(
  admin: SupabaseClient, tenantId: string, requested: unknown, formRecipient: string | null,
): Promise<string | null> {
  if (formRecipient && EMAIL_RE.test(formRecipient)) return formRecipient;

  const want = typeof requested === "string" ? requested.trim().toLowerCase() : "";
  if (want && EMAIL_RE.test(want)) {
    const { data: pages } = await admin.from("pages").select("blocks").eq("tenant_id", tenantId);
    const configured = (pages ?? []).some((p) => JSON.stringify(p.blocks ?? "").toLowerCase().includes(`"${want}"`));
    if (configured) return want;
  }

  const { data: cd } = await admin
    .from("contact_details").select("email").eq("tenant_id", tenantId)
    .not("email", "is", null).order("is_primary", { ascending: false }).limit(1).maybeSingle();
  if (cd?.email && EMAIL_RE.test(cd.email)) return cd.email;

  const { data: t } = await admin.from("tenants").select("owner_id").eq("id", tenantId).maybeSingle();
  if (t?.owner_id) {
    const { data: u } = await admin.auth.admin.getUserById(t.owner_id);
    if (u?.user?.email) return u.user.email;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { fields, recipient, formName } = await req.json();
    if (!fields || typeof fields !== "object") {
      return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
    }

    const body = Object.entries(fields as Record<string, string>)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    // Tenant comes from the subdomain/custom-domain header on public sites.
    // Without one there is nobody to deliver to (and no safe recipient).
    const tenantId = req.headers.get("x-tenant-id");
    if (!tenantId) return NextResponse.json({ ok: true });

    const admin = await createAdminClient();
    const name = typeof formName === "string" && formName.trim() ? formName.trim().slice(0, 120) : "Contact";

    // Store in the Dashboard > Contact inbox. This route used to feed only
    // the CRM, so the inbox stayed empty on every site and plans without the
    // CRM module (e.g. Basic) had no way to see their messages at all.
    const form = await formRow(admin, tenantId, name);
    if (form) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
      await admin.from("contact_form_submissions").insert({ form_id: form.id, tenant_id: tenantId, data: fields, ip });
    }

    // Demo sites: store the lead, email nobody.
    const { data: t } = await admin.from("tenants").select("demo_expires_at, name").eq("id", tenantId).maybeSingle();
    if (!t?.demo_expires_at) {
      const to = await resolveRecipient(admin, tenantId, recipient, form?.recipient_email ?? null);
      if (to) {
        await sendEmail({
          to,
          subject: `New ${name.toLowerCase()} message${t?.name ? ` from ${t.name}` : ""} website`,
          text: body,
        });
      }
    }

    // Feed the CRM. Failure here must never break the visitor-facing submit.
    const { email, phone, name: person } = extractIdentity(fields as Record<string, string>);
    await upsertContact({
      tenantId,
      email,
      phone,
      name: person,
      source: "form",
      consentEmail: !!email,
      event: {
        type: "form_submission",
        title: `Form: ${name}`,
        body,
        meta: { fields },
      },
    }).catch(() => null);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to process submission" }, { status: 500 });
  }
}
