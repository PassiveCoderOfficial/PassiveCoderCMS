import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { fields, recipient } = await req.json();
    if (!fields || typeof fields !== "object") {
      return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
    }

    if (recipient) {
      const body = Object.entries(fields as Record<string, string>)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
      await sendEmail({
        to: recipient,
        subject: "New contact form submission",
        text: body,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to process submission" }, { status: 500 });
  }
}
