import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyTenantEvent } from "@/lib/push/notify";
import { clientIp } from "@/lib/rate-limit";
import { isBlockedSender } from "@/lib/spam/guard";

/**
 * Public: a visitor's star rating + review from a testimonials block with the
 * review form on. Only accepted for a group that a published page of the same
 * tenant actually shows with the form enabled, so the endpoint cannot be used
 * to write into arbitrary groups. That block decides instant publish vs approval.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const groupId = String(body.groupId ?? "");
    const name = String(body.name ?? "").trim().slice(0, 60);
    const location = String(body.location ?? "").trim().slice(0, 60);
    const content = String(body.content ?? "").trim().slice(0, 600);
    const rating = Math.round(Number(body.rating));
    if (body.website) return NextResponse.json({ ok: true, published: false }); // honeypot
    if (!/^[0-9a-f-]{36}$/i.test(groupId) || !name || content.length < 3 || !(rating >= 1 && rating <= 5)) {
      return NextResponse.json({ error: "Please add your name, a star rating and a short review." }, { status: 400 });
    }
    if (/https?:\/\/|www\./i.test(content + name)) {
      return NextResponse.json({ error: "Links are not allowed in reviews." }, { status: 400 });
    }

    const admin = await createAdminClient();
    const { data: group } = await admin.from("testimonial_groups").select("id, tenant_id").eq("id", groupId).maybeSingle();
    if (!group) return NextResponse.json({ error: "Reviews are not set up yet." }, { status: 404 });
    const hostTenant = req.headers.get("x-tenant-id");
    if (hostTenant && hostTenant !== group.tenant_id) return NextResponse.json({ error: "Reviews are not set up yet." }, { status: 404 });

    const { data: pages } = await admin.from("pages").select("blocks").eq("tenant_id", group.tenant_id).eq("status", "published");
    let form: { enabled?: boolean; autoPublish?: boolean } | null = null;
    for (const p of pages ?? []) for (const b of (p.blocks ?? []) as { type: string; data?: { source_group_id?: string; reviewForm?: { enabled?: boolean; autoPublish?: boolean } } }[]) {
      if (b.type === "testimonials" && b.data?.source_group_id === groupId && b.data.reviewForm?.enabled) form = b.data.reviewForm;
    }
    if (!form) return NextResponse.json({ error: "Reviews are closed." }, { status: 403 });

    // Simple flood guard: at most 5 reviews per group per 10 minutes.
    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const { count } = await admin.from("testimonials").select("id", { count: "exact", head: true }).eq("group_id", groupId).gte("created_at", since);
    if ((count ?? 0) >= 5) return NextResponse.json({ error: "Too many reviews right now. Please try again later." }, { status: 429 });

    if (await isBlockedSender(group.tenant_id as string, { ip: clientIp(req) }, "testimonial", { name, content, rating })) return NextResponse.json({ ok: true, published: false });

    // Only photos uploaded for this site (/api/store-reviews/upload), at most 5.
    const photos = (Array.isArray(body.photos) ? body.photos : [])
      .filter((u: unknown): u is string => typeof u === "string" && u.includes(`/review-photos/${group.tenant_id}/`) && u.startsWith(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://"))
      .slice(0, 5);
    const published = !!form.autoPublish;
    const { error } = await admin.from("testimonials").insert({
      group_id: groupId, tenant_id: group.tenant_id, source: "custom", name, role: location || null, content, rating,
      photos, published, sort_order: -Math.floor(Date.now() / 1000), // newest first
    });
    if (error) return NextResponse.json({ error: "Could not save your review." }, { status: 500 });

    await notifyTenantEvent({
      tenantId: group.tenant_id, type: "lead", id: groupId, path: "testimonials", webUrl: "/dashboard/testimonials",
      title: `New ${rating}-star review from ${name}`, body: content.slice(0, 140),
    }).catch(() => {});
    return NextResponse.json({ ok: true, published });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
