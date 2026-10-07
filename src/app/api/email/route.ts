import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import {
  PROVIDERS, applyRecords, emailDomainFor, checkRecords, cleanForwards, requiredRecords, weHostDns,
  ZOHO_REGIONS, type DnsRecord, type Provider, type ZohoRegion,
} from "@/lib/email/business-email";
import { setupSendingDomain, verifySendingDomain } from "@/lib/email/sender";

export const maxDuration = 60;

type Ctx = { admin: Awaited<ReturnType<typeof import("@/lib/supabase/server").createAdminClient>>; tenantId: string; domain: string | null; settings: Record<string, unknown> | null };

async function context(need: "read" | "write"): Promise<{ error: NextResponse } | Ctx> {
  const a = await importAccess(need);
  if ("error" in a && a.error) return { error: a.error };
  if (!("admin" in a) || !a.admin) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const [domain, { data: s }] = await Promise.all([
    emailDomainFor(a.admin, a.tenantId),
    a.admin.from("tenant_email_settings").select("*").eq("tenant_id", a.tenantId).maybeSingle(),
  ]);
  return { admin: a.admin, tenantId: a.tenantId, domain, settings: s };
}

/** Current setup, required records and a live DNS check. */
export async function GET() {
  const c = await context("read");
  if ("error" in c) return c.error;
  if (!c.domain) return NextResponse.json({ domain: null });
  const s = c.settings;
  const provider = (s?.provider ?? null) as Provider | null;
  const forwards = cleanForwards(s?.forwards);
  const mail = requiredRecords(c.domain, provider, forwards, (s?.dkim as { name: string; value: string }[]) ?? [],
    { verification: (s?.provider_verification as string | null) ?? null, zohoRegion: ((s?.zoho_region as ZohoRegion) ?? "com") });
  const senderRecords = (s?.sender_records as DnsRecord[]) ?? [];
  const [mailCheck, senderCheck, auto] = await Promise.all([
    checkRecords(c.domain, mail),
    checkRecords(c.domain, senderRecords),
    weHostDns(c.domain),
  ]);
  return NextResponse.json({
    domain: c.domain,
    autoDns: auto,
    providers: PROVIDERS,
    provider,
    forwards,
    dkim: s?.dkim ?? [],
    verification: s?.provider_verification ?? "",
    zohoRegion: s?.zoho_region ?? "com",
    mail: mailCheck,
    sender: { status: s?.sender_status ?? "none", local: s?.sender_local ?? "hello", name: s?.sender_name ?? "", records: senderCheck.records },
  });
}

/**
 * Save settings and act. Body: { provider?, forwards?, dkim?, sender_local?,
 * sender_name?, action?: "apply" | "sender_setup" | "sender_verify" }.
 */
export async function POST(req: Request) {
  const c = await context("write");
  if ("error" in c) return c.error;
  if (!c.domain) return NextResponse.json({ error: "Connect your own domain first (Settings > Domain)." }, { status: 400 });
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const patch: Record<string, unknown> = { tenant_id: c.tenantId, updated_at: new Date().toISOString() };
  if ("provider" in body) {
    if (body.provider !== null && !(String(body.provider) in PROVIDERS)) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    patch.provider = body.provider;
  }
  if ("forwards" in body) patch.forwards = cleanForwards(body.forwards);
  if ("dkim" in body && Array.isArray(body.dkim)) {
    patch.dkim = (body.dkim as { name?: string; value?: string }[])
      .map((d) => ({ name: String(d.name ?? "").trim().replace(new RegExp(`\\.?${c.domain!.replace(/\./g, "\\.")}\\.?$`), ""), value: String(d.value ?? "").trim() }))
      .filter((d) => d.name && d.value).slice(0, 4);
  }
  if ("verification" in body) {
    // Accept the whole record or just the value; keep it to one TXT string.
    const v = String(body.verification ?? "").trim().replace(/^"|"$/g, "").slice(0, 255);
    patch.provider_verification = v || null;
  }
  if ("zoho_region" in body) {
    if (!ZOHO_REGIONS.includes(body.zoho_region as ZohoRegion)) return NextResponse.json({ error: "Unknown Zoho region" }, { status: 400 });
    patch.zoho_region = body.zoho_region;
  }
  if ("sender_local" in body) patch.sender_local = String(body.sender_local ?? "hello").toLowerCase().replace(/[^a-z0-9._+-]/g, "").slice(0, 40) || "hello";
  if ("sender_name" in body) patch.sender_name = String(body.sender_name ?? "").replace(/[<>"\r\n]/g, "").trim().slice(0, 60) || null;
  const { error } = await c.admin.from("tenant_email_settings").upsert(patch, { onConflict: "tenant_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  try {
    if (body.action === "apply") {
      if (!(await weHostDns(c.domain))) {
        return NextResponse.json({ error: "Your domain's DNS is managed at your registrar. Add the records shown there." }, { status: 400 });
      }
      const { data: s } = await c.admin.from("tenant_email_settings").select("*").eq("tenant_id", c.tenantId).maybeSingle();
      const records = [
        ...requiredRecords(c.domain, (s?.provider ?? null) as Provider | null, cleanForwards(s?.forwards), (s?.dkim as { name: string; value: string }[]) ?? [],
          { verification: s?.provider_verification ?? null, zohoRegion: (s?.zoho_region as ZohoRegion) ?? "com" }),
        ...((s?.sender_records as DnsRecord[]) ?? []),
      ];
      if (!records.length) return NextResponse.json({ error: "Choose an email setup first." }, { status: 400 });
      const r = await applyRecords(c.domain, records);
      return NextResponse.json({ ok: true, ...r });
    }
    if (body.action === "sender_setup") {
      const r = await setupSendingDomain(c.tenantId, c.domain);
      // Domains on our nameservers get the records written straight away.
      if (r.status !== "verified" && await weHostDns(c.domain)) await applyRecords(c.domain, r.records);
      return NextResponse.json({ ok: true, ...r });
    }
    if (body.action === "sender_verify") {
      return NextResponse.json({ ok: true, ...(await verifySendingDomain(c.tenantId)) });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
