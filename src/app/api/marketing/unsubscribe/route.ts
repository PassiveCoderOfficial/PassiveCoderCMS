import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyUnsubscribe } from "@/lib/marketing/unsubscribe";

/**
 * Unsubscribe from a site's marketing email. GET is the link in the email
 * footer (shows a confirmation page); POST is RFC 8058 one-click from the
 * mail client's own Unsubscribe button. Either way consent_email turns off,
 * and the campaign sender skips contacts without consent.
 */
async function unsubscribe(req: Request) {
  const sp = new URL(req.url).searchParams;
  const c = sp.get("c") ?? "";
  const s = sp.get("s") ?? "";
  if (!/^[0-9a-f-]{36}$/.test(c) || !verifyUnsubscribe(c, s)) return false;
  const admin = await createAdminClient();
  const { data: contact } = await admin.from("contacts").select("id, tenant_id, consent_email").eq("id", c).maybeSingle();
  if (!contact) return false;
  if (contact.consent_email) {
    await admin.from("contacts").update({ consent_email: false, updated_at: new Date().toISOString() }).eq("id", c);
    await admin.from("contact_events")
      .insert({ tenant_id: contact.tenant_id, contact_id: c, type: "note", title: "Unsubscribed from marketing email" })
      .then(() => {}, () => {});
  }
  return true;
}

const page = (title: string, msg: string) => new NextResponse(
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;background:#f6f7f9;color:#111;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}main{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;max-width:420px;text-align:center}h1{font-size:20px;margin:0 0 8px}p{color:#555;margin:0}</style></head>
<body><main><h1>${title}</h1><p>${msg}</p></main></body></html>`,
  { headers: { "Content-Type": "text/html; charset=utf-8" } },
);

export async function GET(req: Request) {
  return (await unsubscribe(req))
    ? page("You're unsubscribed", "You won't receive marketing emails from this business any more. You'll still get receipts and booking messages.")
    : page("Link not valid", "This unsubscribe link is broken. Reply to the email and ask to be removed.");
}

export async function POST(req: Request) {
  return (await unsubscribe(req)) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Invalid link" }, { status: 400 });
}
