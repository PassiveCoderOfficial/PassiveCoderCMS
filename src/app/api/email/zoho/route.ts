import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { applyRecords, emailDomainFor, requiredRecords, weHostDns } from "@/lib/email/business-email";
import {
  createAccount, deleteAccount, ensureDomain, getConnection, listAccounts, listDomains,
  resetPassword, verificationTxt, verifyDomain, zohoConfigured,
} from "@/lib/email/zoho";

export const maxDuration = 60;

/** Connection status, the domain's state in Zoho, and its mailboxes. */
export async function GET() {
  const a = await importAccess("read");
  if ("error" in a) return a.error;
  const conn = await getConnection(a.admin, a.tenantId);
  if (!conn) return NextResponse.json({ configured: zohoConfigured(), connected: false });
  const domain = await emailDomainFor(a.admin, a.tenantId);
  try {
    const domains = await listDomains(conn);
    const d = domain ? domains.find((x) => x.domainName.toLowerCase() === domain) : undefined;
    const accounts = await listAccounts(conn);
    return NextResponse.json({
      configured: true, connected: true, org: conn.org_name, dc: conn.dc, domain,
      domainAdded: !!d,
      domainVerified: d ? d.verificationStatus === true || d.verificationStatus === "true" : false,
      verificationTxt: d ? verificationTxt(conn, d) : null,
      mailboxes: accounts.map((x) => ({
        zuid: x.zuid, email: x.primaryEmailAddress ?? x.emailAddress,
        name: x.displayName ?? [x.firstName, x.lastName].filter(Boolean).join(" "), role: x.role ?? null,
      })),
    });
  } catch (e) {
    return NextResponse.json({ configured: true, connected: true, org: conn.org_name, error: e instanceof Error ? e.message : "Zoho error" });
  }
}

/**
 * Actions: add_domain (adds it in Zoho and saves the TXT code into Business
 * Email so "Set up automatically" publishes it), verify_domain,
 * create_mailbox, reset_password, delete_mailbox, disconnect.
 */
export async function POST(req: Request) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const conn = await getConnection(a.admin, a.tenantId);
  if (!conn) return NextResponse.json({ error: "Connect Zoho first." }, { status: 400 });
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const domain = await emailDomainFor(a.admin, a.tenantId);
  try {
    switch (body.action) {
      case "add_domain": {
        if (!domain) return NextResponse.json({ error: "Connect your own domain first (Settings > Domain)." }, { status: 400 });
        const d = await ensureDomain(conn, domain);
        const txt = verificationTxt(conn, d);
        if (txt) {
          await a.admin.from("tenant_email_settings").upsert(
            { tenant_id: a.tenantId, provider: "zoho", provider_verification: txt, updated_at: new Date().toISOString() },
            { onConflict: "tenant_id" },
          );
        }
        return NextResponse.json({ ok: true, verificationTxt: txt });
      }
      case "publish_verification": {
        // Only Zoho's ownership TXT: mail delivery (MX) is untouched, so the
        // current email provider keeps working until mailboxes exist in Zoho.
        if (!domain) return NextResponse.json({ error: "No domain" }, { status: 400 });
        if (!(await weHostDns(domain))) return NextResponse.json({ error: "Your domain's DNS is at your registrar: add the verification TXT record there." }, { status: 400 });
        const d = await ensureDomain(conn, domain);
        const txt = verificationTxt(conn, d);
        if (!txt) return NextResponse.json({ error: "Zoho didn't return a verification code." }, { status: 502 });
        const r = await applyRecords(domain, [{ type: "TXT", name: "@", value: txt, purpose: "Zoho ownership" }]);
        return NextResponse.json({ ok: true, ...r });
      }
      case "switch_mail": {
        // Last step: point the domain's mail (MX, SPF, DMARC) at Zoho.
        if (!domain) return NextResponse.json({ error: "No domain" }, { status: 400 });
        if (!(await weHostDns(domain))) return NextResponse.json({ error: "Your domain's DNS is at your registrar: change the records there." }, { status: 400 });
        const { data: st } = await a.admin.from("tenant_email_settings").select("zoho_region, provider_verification, dkim").eq("tenant_id", a.tenantId).maybeSingle();
        const recs = requiredRecords(domain, "zoho", [], (st?.dkim as { name: string; value: string }[]) ?? [],
          { verification: (st?.provider_verification as string | null) ?? null, zohoRegion: ((st?.zoho_region as "com") ?? "com") });
        const r = await applyRecords(domain, recs);
        return NextResponse.json({ ok: true, ...r });
      }
      case "verify_domain": {
        if (!domain) return NextResponse.json({ error: "No domain" }, { status: 400 });
        await verifyDomain(conn, domain);
        return NextResponse.json({ ok: true });
      }
      case "create_mailbox": {
        if (!domain) return NextResponse.json({ error: "No domain" }, { status: 400 });
        const local = String(body.local ?? "").trim().toLowerCase().replace(/@.*$/, "");
        const password = String(body.password ?? "");
        const firstName = String(body.firstName ?? local).trim().slice(0, 50) || local;
        if (!/^[a-z0-9._-]{1,40}$/.test(local)) return NextResponse.json({ error: "Use letters, numbers, dots or dashes for the address." }, { status: 400 });
        if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
        await createAccount(conn, { email: `${local}@${domain}`, password, firstName, lastName: String(body.lastName ?? "").slice(0, 50) });
        return NextResponse.json({ ok: true, email: `${local}@${domain}` });
      }
      case "reset_password": {
        const password = String(body.password ?? "");
        if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
        await resetPassword(conn, Number(body.zuid), password);
        return NextResponse.json({ ok: true });
      }
      case "delete_mailbox": {
        await deleteAccount(conn, Number(body.zuid));
        return NextResponse.json({ ok: true });
      }
      case "disconnect": {
        await a.admin.from("email_zoho_connections").delete().eq("tenant_id", a.tenantId);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Zoho error" }, { status: 502 });
  }
}
