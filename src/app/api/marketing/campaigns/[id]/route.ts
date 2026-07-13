import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { sendEmail } from "@/lib/email";
import { renderTemplate } from "@/lib/marketing/render";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("campaigns")
    .select("*").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const { data: campaign } = await supabase.from("campaigns")
    .select("*").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // action: "test" — send a preview to the caller's email
  if (body.action === "test") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "No email on your account" }, { status: 400 });
    const result = await sendEmail({
      to: user.email,
      subject: `[Test] ${campaign.subject ?? campaign.name}`,
      text: renderTemplate(campaign.body, { first_name: "Test", last_name: "Contact", email: user.email }),
    });
    if (!result.ok) return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // action: "send" — snapshot the audience and hand off to the sender cron
  if (body.action === "send") {
    if (campaign.status !== "draft") {
      return NextResponse.json({ error: "Campaign already sent or sending" }, { status: 400 });
    }
    if (campaign.channel !== "email") {
      return NextResponse.json({ error: "Only email campaigns can send right now" }, { status: 400 });
    }
    if (!campaign.subject?.trim() || !campaign.body?.trim()) {
      return NextResponse.json({ error: "Subject and message required before sending" }, { status: 400 });
    }

    const admin = await createAdminClient();
    const audience = campaign.audience ?? { all: true };

    let q = admin.from("contacts")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("consent_email", true)
      .not("email", "is", null);
    if (Array.isArray(audience.tags) && audience.tags.length) {
      q = q.overlaps("tags", audience.tags);
    }
    if (Array.isArray(audience.stage_ids) && audience.stage_ids.length) {
      q = q.in("stage_id", audience.stage_ids);
    }
    const { data: contacts, error: cErr } = await q.limit(5000);
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 });
    if (!contacts?.length) {
      return NextResponse.json({ error: "No consented contacts match this audience" }, { status: 400 });
    }

    const rows = contacts.map((c) => ({
      campaign_id: campaign.id, tenant_id: tenantId, contact_id: c.id,
    }));
    const { error: rErr } = await admin.from("campaign_recipients")
      .upsert(rows, { onConflict: "campaign_id,contact_id", ignoreDuplicates: true });
    if (rErr) return NextResponse.json({ error: rErr.message }, { status: 400 });

    const { data: updated } = await supabase.from("campaigns")
      .update({ status: "sending", recipient_count: contacts.length, updated_at: new Date().toISOString() })
      .eq("id", id).eq("tenant_id", tenantId).select().single();

    return NextResponse.json(updated);
  }

  // Draft edits only
  if (campaign.status !== "draft") {
    return NextResponse.json({ error: "Only drafts can be edited" }, { status: 400 });
  }
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ["name", "subject", "body", "audience"] as const) {
    if (key in body) patch[key] = body[key];
  }
  const { data, error } = await supabase.from("campaigns")
    .update(patch).eq("id", id).eq("tenant_id", tenantId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("campaigns")
    .delete().eq("id", id).eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
