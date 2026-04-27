import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { fields, recipient } = await req.json();
    if (!fields || typeof fields !== "object") {
      return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
    }

    // If Resend/SMTP env vars configured, send email — otherwise just log
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (RESEND_KEY && recipient) {
      const body = Object.entries(fields as Record<string, string>)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "contact@noreply.passivecoder.com",
          to: [recipient],
          subject: "New contact form submission",
          text: body,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to process submission" }, { status: 500 });
  }
}
