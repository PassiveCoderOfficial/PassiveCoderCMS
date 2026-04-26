import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { name, email, subject, body, department } = await req.json() as {
    name: string; email: string; subject: string; body: string; department: string;
  };

  if (!name || !email || !subject || !body)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const supabase = await createAdminClient();

  const { error } = await supabase.from("support_tickets").insert({
    guest_name: name,
    guest_email: email,
    subject,
    body,
    department: ["sales","support","billing","general"].includes(department) ? department : "general",
    source: "contact_form",
    status: "open",
    priority: "normal",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
