import { NextRequest, NextResponse, after } from "next/server";
import { enrollInSequences } from "@/lib/crm/sequences";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { upsertContact, extractIdentity } from "@/lib/crm/upsertContact";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyTenantEvent } from "@/lib/push/notify";
import { formRow } from "@/lib/contact/form-row";
import { rateLimited, clientIp } from "@/lib/rate-limit";
import { findBlock, recentFromSender, recordSpam } from "@/lib/spam/guard";
import { REPEAT_LIMIT, emailKey, isBotSubmission, phoneKey } from "@/lib/spam/rules";
import { publicFormTenantId } from "@/lib/site/root-builder";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const { fields, recipient, formName, website, elapsedMs } = await req.json();
    if (!fields || typeof fields !== "object") {
      return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
    }

    const body = Object.entries(fields as Record<string, string>)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    // Tenant comes from the subdomain/custom-domain header on public sites.
    // Without one there is nobody to deliver to (and no safe recipient).
    // On the root domain this is the root tenant (no header there).
    const tenantId = await publicFormTenantId(req.headers);
    if (!tenantId) {
      console.error("[contact/submit] no tenant for host", req.headers.get("host"));
      return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
    }

    const admin = await createAdminClient();
    const name = typeof formName === "string" && formName.trim() ? formName.trim().slice(0, 120) : "Contact";
    const ip = clientIp(req);
    const identity = extractIdentity(fields as Record<string, string>);
    const sender = { email: identity.email, phone: identity.phone, ip };

    // Stopped entries get the same answer as real ones, so nobody learns they
    // were caught, but every stopped entry lands in the Spam folder so a real
    // enquiry caught by mistake (autofilled trap, many tests from one office
    // connection) can be found and moved back. Floods log only a few rows.
    const flooding = rateLimited(`contact-submit:${tenantId}:${ip}`, 10, 10 * 60_000);
    if (flooding && rateLimited(`contact-flood-log:${tenantId}:${ip}`, 5, 10 * 60_000)) return NextResponse.json({ ok: true });
    const stoppedBy = website ? "trap"
      : flooding ? "flood"
      : await findBlock(admin, tenantId, sender).catch(() => null) ? "banned"
      : isBotSubmission(fields) ? "bot"
      : typeof elapsedMs === "number" && elapsedMs < 1500 ? "too_fast" : null;
    if (stoppedBy) {
      await recordSpam(admin, { tenantId, source: "form", reason: stoppedBy, sender, data: fields, meta: { form_name: name } }).catch(() => undefined);
      return NextResponse.json({ ok: true });
    }
    const earlier = await recentFromSender(admin, tenantId, sender).catch(() => 0);
    const repeating = earlier >= REPEAT_LIMIT;

    // Store in the Dashboard > Contact inbox. This route used to feed only
    // the CRM, so the inbox stayed empty on every site and plans without the
    // CRM module (e.g. Basic) had no way to see their messages at all.
    const form = await formRow(admin, tenantId, name);
    let stored = false;
    if (form) {
      const { error: insertError } = await admin.from("contact_form_submissions").insert({
        form_id: form.id, tenant_id: tenantId, data: fields, ip: ip === "unknown" ? null : ip,
        sender_email: emailKey(identity.email), sender_phone: phoneKey(identity.phone),
      });
      if (insertError) console.error("[contact/submit] inbox insert failed", tenantId, insertError.message);
      else stored = true;
    } else {
      console.error("[contact/submit] no contact form row", tenantId, name);
    }

    // Demo sites: store the lead, email nobody.
    const { data: t } = await admin.from("tenants").select("demo_expires_at, name").eq("id", tenantId).maybeSingle();
    if (!t?.demo_expires_at && !repeating) {
      const to = await resolveRecipient(admin, tenantId, recipient, form?.recipient_email ?? null);
      if (to) {
        await sendEmail({
          brandTenantId: tenantId, // white-label: reseller brand for their clients
          to,
          subject: `New ${name.toLowerCase()} message${t?.name ? ` from ${t.name}` : ""} website`,
          text: body,
        });
      }
    }

    // Feed the CRM. Failure here must never break the visitor-facing submit.
    const { email, phone, name: person } = identity;
    const contactId = await upsertContact({
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
    // Follow-up sequences run after the response; never fail the submit.
    if (contactId && !repeating) after(() => enrollInSequences(tenantId, contactId, "enquiry", {
      name: person || null, phone: phone || null, site_name: t?.name ?? null,
      service: (fields as Record<string, string>).service || (fields as Record<string, string>).subject || name || "enquiry",
    }).catch(() => undefined));

    // A sender who won't stop: one alert a day with the way to ban them, then quiet.
    if (repeating) {
      const who = person || email || phone || "Someone";
      await notifyTenantEvent({
        tenantId, type: "lead", id: contactId, webUrl: "/dashboard/contact",
        title: `Repeat sender: ${who}`, body: `${earlier + 1} messages in 24 hours. Open it to ban them. Their messages stay in your inbox.`,
        dedupeKey: `repeat:${emailKey(email) ?? phoneKey(phone)}:${new Date().toISOString().slice(0, 10)}`,
      });
      return NextResponse.json({ ok: true });
    }
    // Nothing kept anywhere: tell the visitor, so they retry or use WhatsApp
    // instead of seeing "thank you" for a message nobody will read.
    if (!stored && !contactId) return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
    await notifyTenantEvent({ tenantId, type: "lead", id: contactId, title: `New enquiry from ${person || name || "your website"}`, body: String(body ?? "").slice(0, 140) || "Open the dashboard to read it.", webUrl: "/dashboard/contact" });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to process submission" }, { status: 500 });
  }
}
