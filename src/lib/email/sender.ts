import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import type { DnsRecord } from "./business-email";

/**
 * Sending site emails (booking confirmations, invoices, campaigns) from the
 * business's own domain instead of noreply@passivecoder.com. The domain is
 * registered with Resend, which asks for a few DNS records (DKIM + a
 * "send." subdomain for bounces); once Resend verifies them, getSiteSender()
 * returns "Business Name <hello@theirdomain.com>".
 */
const RESEND = "https://api.resend.com";
const PLATFORM_FROM_ADDR = "contact@noreply.passivecoder.com";

async function resend<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${RESEND}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ""}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message ?? `Email service error (${res.status})`);
  return json as T;
}

type ResendDomain = {
  id: string; name: string; status: string;
  records?: { record: string; name: string; type: string; value: string; priority?: number; status?: string }[];
};

function toRecords(domain: string, d: ResendDomain): DnsRecord[] {
  return (d.records ?? []).map((r) => ({
    type: r.type as DnsRecord["type"],
    // Resend gives names relative to the domain ("send", "resend._domainkey").
    name: !r.name || r.name === domain ? "@" : r.name.replace(new RegExp(`\\.?${domain.replace(/\./g, "\\.")}$`), ""),
    value: r.value,
    ...(r.priority != null ? { priority: r.priority } : {}),
    purpose: r.record === "DKIM" ? "Sending: DKIM signature" : "Sending: bounces and SPF",
  }));
}

/** Register the domain (or fetch it if already registered) and return the records to publish. */
export async function setupSendingDomain(tenantId: string, domain: string) {
  const admin = await createAdminClient();
  const { data: row } = await admin.from("tenant_email_settings").select("resend_domain_id").eq("tenant_id", tenantId).maybeSingle();
  let d: ResendDomain;
  if (row?.resend_domain_id) {
    d = await resend<ResendDomain>(`/domains/${row.resend_domain_id}`);
  } else {
    try {
      d = await resend<ResendDomain>("/domains", { method: "POST", body: JSON.stringify({ name: domain }) });
    } catch (e) {
      // Already registered (e.g. a previous attempt): find it in the list.
      const list = await resend<{ data: ResendDomain[] }>("/domains");
      const found = list.data?.find((x) => x.name === domain);
      if (!found) throw e;
      d = await resend<ResendDomain>(`/domains/${found.id}`);
    }
  }
  const records = toRecords(domain, d);
  const status = d.status === "verified" ? "verified" : d.status === "failed" ? "failed" : "pending";
  await admin.from("tenant_email_settings").upsert(
    { tenant_id: tenantId, resend_domain_id: d.id, sender_status: status, sender_records: records, updated_at: new Date().toISOString() },
    { onConflict: "tenant_id" },
  );
  return { status, records };
}

/** Ask Resend to re-check the DNS, then store the result. */
export async function verifySendingDomain(tenantId: string) {
  const admin = await createAdminClient();
  const { data: row } = await admin.from("tenant_email_settings").select("resend_domain_id").eq("tenant_id", tenantId).maybeSingle();
  if (!row?.resend_domain_id) return { status: "none" as const };
  await resend(`/domains/${row.resend_domain_id}/verify`, { method: "POST" }).catch(() => {});
  const d = await resend<ResendDomain>(`/domains/${row.resend_domain_id}`);
  const status = d.status === "verified" ? "verified" : d.status === "failed" ? "failed" : "pending";
  await admin.from("tenant_email_settings").update({ sender_status: status, updated_at: new Date().toISOString() }).eq("tenant_id", tenantId);
  return { status };
}

const clean = (s: string) => s.replace(/[<>"\r\n]/g, "").trim().slice(0, 60);

/**
 * The From address for an email this site sends. Verified sending domain:
 * "Business <hello@their-domain>". Otherwise the platform address under the
 * business's name, so it still reads as coming from them.
 */
export async function getSiteSender(tenantId: string): Promise<{ from: string; replyTo?: string }> {
  const admin = await createAdminClient();
  const [{ data: t }, { data: s }] = await Promise.all([
    admin.from("tenants").select("name, custom_domain, domain_status").eq("id", tenantId).maybeSingle(),
    admin.from("tenant_email_settings").select("sender_status, sender_local, sender_name").eq("tenant_id", tenantId).maybeSingle(),
  ]);
  const name = clean(s?.sender_name || t?.name || "");
  if (s?.sender_status === "verified" && t?.custom_domain && t.domain_status === "active") {
    const local = (s.sender_local || "hello").replace(/[^a-z0-9._+-]/gi, "") || "hello";
    return { from: `${name || t.custom_domain} <${local}@${t.custom_domain}>` };
  }
  return { from: name ? `${name} <${PLATFORM_FROM_ADDR}>` : `Passive Coder <${PLATFORM_FROM_ADDR}>` };
}
