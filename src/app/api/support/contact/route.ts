import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Simple in-memory rate limit (per IP). Resets on cold start — good enough to
// blunt bursts; pair with the honeypot + heuristics below for real coverage.
const hits = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 3;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.first > WINDOW_MS) {
    hits.set(ip, { count: 1, first: now });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_PER_WINDOW;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Reject obvious bot gibberish: a "word" with no vowels and 8+ letters, or text
// that is almost entirely random consonant runs (what the spam tickets looked like).
function looksLikeGibberish(text: string): boolean {
  const stripped = text.replace(/[^a-zA-Z]/g, "");
  if (stripped.length < 6) return false; // too short to judge
  const vowels = (stripped.match(/[aeiouAEIOU]/g) ?? []).length;
  const vowelRatio = vowels / stripped.length;
  // Natural English text is ~35–45% vowels. Random consonant spam is far lower.
  return vowelRatio < 0.18;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const { name, email, subject, body, department, website, elapsedMs } = await req.json() as {
    name?: string; email?: string; subject?: string; body?: string;
    department?: string; website?: string; elapsedMs?: number;
  };

  // Honeypot — real users never fill this. Pretend success so bots don't learn.
  if (website && website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  // Submitted impossibly fast → bot. Pretend success.
  if (typeof elapsedMs === "number" && elapsedMs < 2000) {
    return NextResponse.json({ ok: true });
  }

  if (!name || !email || !subject || !body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (name.length > 120 || subject.length > 200 || body.length > 5000) {
    return NextResponse.json({ error: "Input too long" }, { status: 400 });
  }

  if (subject.trim().length < 3 || body.trim().length < 10) {
    return NextResponse.json({ error: "Please add a bit more detail" }, { status: 400 });
  }

  // Drop gibberish subject+body silently (pretend success so bots move on).
  if (looksLikeGibberish(subject) && looksLikeGibberish(body)) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createAdminClient();

  const { error } = await supabase.from("support_tickets").insert({
    guest_name: name.trim(),
    guest_email: email.trim(),
    subject: subject.trim(),
    body: body.trim(),
    department: ["sales", "support", "billing", "general"].includes(department ?? "") ? department : "general",
    source: "contact_form",
    status: "open",
    priority: "normal",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
