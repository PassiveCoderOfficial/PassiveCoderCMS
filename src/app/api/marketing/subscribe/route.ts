import { NextRequest, NextResponse } from "next/server";
import { upsertContact } from "@/lib/crm/upsertContact";

/** Public newsletter signup — feeds the CRM with email consent. */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const { email, name } = await req.json().catch(() => ({}));
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const id = await upsertContact({
    tenantId,
    email,
    name,
    source: "form",
    tags: ["newsletter"],
    consentEmail: true,
    event: { type: "form_submission", title: "Newsletter signup" },
  });

  if (!id) return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
