import { NextResponse } from "next/server";
import { demoCaller as caller } from "@/modules/demo/auth";
import { createDemoSite, parseServices, normalizeWhatsapp, DEMO_HOURS } from "@/modules/demo/build-demo";

/**
 * Demo site builder API. Open to active pc_staff and super admins/managers.
 * Staff see and manage only demos they built; super admins see all.
 */
export async function GET() {
  const c = await caller();
  if (!c) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let q = c.admin
    .from("tenants")
    .select("id,name,slug,demo_expires_at,demo_whatsapp,created_at,demo_created_by")
    .not("demo_expires_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (!c.sa) q = q.eq("demo_created_by", c.user.id);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ demos: data ?? [] });
}

export async function POST(req: Request) {
  const c = await caller();
  if (!c) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const slug = String(body.slug ?? "").trim().toLowerCase();
  const whatsapp = normalizeWhatsapp(String(body.whatsapp ?? ""));
  const services = parseServices(body.services ?? "");
  const templateSlug = String(body.templateSlug ?? "security-services");
  const plan = String(body.plan ?? "").trim();

  if (!name) return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  if (!/^[a-z0-9](?:[a-z0-9-]{1,40}[a-z0-9])$/.test(slug)) return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 });
  if (whatsapp.length < 8) return NextResponse.json({ error: "Valid WhatsApp number (with country code) is required" }, { status: 400 });
  if (!services.length) return NextResponse.json({ error: "Add at least one service" }, { status: 400 });
  // Required: the plan decides which features / gated dashboard pages the demo
  // shows, so it is always an explicit choice and must be a real, active plan.
  if (!plan) return NextResponse.json({ error: "Choose the plan this demo is for" }, { status: 400 });
  const { data: planRow } = await c.admin.from("plans").select("id").eq("id", plan).eq("is_active", true).maybeSingle();
  if (!planRow) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  const { data: taken } = await c.admin.from("tenants").select("id").eq("slug", slug).maybeSingle();
  if (taken) return NextResponse.json({ error: "Subdomain already taken" }, { status: 409 });

  try {
    const result = await createDemoSite(
      c.admin,
      {
        name, slug, whatsapp, services, templateSlug, plan,
        logoUrl: body.logoUrl ? String(body.logoUrl) : null,
        address: body.address ? String(body.address).trim() : null,
        tagline: body.tagline ? String(body.tagline).trim() : null,
      },
      { userId: c.user.id, staffId: c.staffId },
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

/** { id, action: "extend" | "golive" } */
export async function PATCH(req: Request) {
  const c = await caller();
  if (!c) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, action } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: t } = await c.admin
    .from("tenants").select("id,demo_expires_at,demo_created_by").eq("id", id).maybeSingle();
  if (!t || !t.demo_expires_at) return NextResponse.json({ error: "Not a demo" }, { status: 404 });
  if (!c.sa && t.demo_created_by !== c.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (action === "extend") {
    const base = Math.max(Date.now(), new Date(t.demo_expires_at).getTime());
    const next = new Date(base + DEMO_HOURS * 3600_000).toISOString();
    await c.admin.from("tenants").update({ demo_expires_at: next }).eq("id", id);
    return NextResponse.json({ ok: true, demo_expires_at: next });
  }
  if (action === "golive") {
    await c.admin.from("tenants").update({ demo_expires_at: null, status: "active" }).eq("id", id);
    await c.admin.from("subscriptions").update({ status: "active", payment_provider: "manual" }).eq("tenant_id", id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
