import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  DONOR_COOKIE, createAndSendOtp, consumeOtp, getDonorSession, getDonorSettings,
  hashPassword, verifyPassword, normalizeBdPhone, signSession,
} from "@/lib/donors/auth";

function sessionResponse(body: Record<string, unknown>, donorId: string, tenantId: string) {
  const res = NextResponse.json(body);
  res.cookies.set(DONOR_COOKIE, signSession(donorId, tenantId), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 86400, path: "/",
  });
  return res;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const supabase = await createAdminClient();

  // ── signup: validate, send OTP (account created on verify) ────────────────
  if (action === "signup") {
    const phone = normalizeBdPhone(body.phone);
    if (!phone) return NextResponse.json({ error: "Enter a valid 11-digit number (01XXXXXXXXX)" }, { status: 400 });
    if (!body.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
    if (!body.password || body.password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const { data: existing } = await supabase.from("donors")
      .select("id, password_hash").eq("tenant_id", tenantId).eq("phone", phone).maybeSingle();
    if (existing?.password_hash) {
      return NextResponse.json({ error: "This number already has an account — log in instead" }, { status: 409 });
    }

    const { otp_required } = await getDonorSettings(tenantId);
    if (!otp_required) {
      // SMS not configured yet — open signup, no verification.
      if (existing) {
        // Unclaimed listing with this phone: without OTP we can't prove
        // ownership, so don't hand it over — the creator's set-password
        // handoff covers this case.
        return NextResponse.json({
          error: "This number is already listed as a donor. Ask the person who added you to set a password for you.",
        }, { status: 409 });
      }
      const { data: created, error } = await supabase.from("donors").insert({
        tenant_id: tenantId, name: body.name.trim(), phone, whatsapp: phone,
        blood_group: body.blood_group ?? "O+",
        password_hash: hashPassword(body.password),
        phone_verified: false, is_claimed: true,
      }).select("id").single();
      if (error || !created) return NextResponse.json({ error: "Could not create account" }, { status: 500 });
      return sessionResponse({ ok: true, donorId: created.id }, created.id, tenantId);
    }

    const sent = await createAndSendOtp(tenantId, phone, "signup", {
      name: body.name.trim(),
      password_hash: hashPassword(body.password),
      blood_group: body.blood_group ?? null,
      existing_donor_id: existing?.id ?? null, // unclaimed entry with this phone → claim it on verify
    });
    if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 400 });
    return NextResponse.json({ ok: true, next: "verify" });
  }

  // ── verify-signup: consume OTP → create/claim account + session ───────────
  if (action === "verify-signup") {
    const phone = normalizeBdPhone(body.phone);
    if (!phone || !body.code) return NextResponse.json({ error: "Missing phone or code" }, { status: 400 });

    const otp = await consumeOtp(tenantId, phone, "signup", String(body.code));
    if (!otp.ok) return NextResponse.json({ error: otp.error }, { status: 400 });
    const p = otp.payload!;

    let donorId: string;
    if (p.existing_donor_id) {
      // Phone already exists as an unclaimed directory entry — signup claims it
      donorId = p.existing_donor_id as string;
      await supabase.from("donors").update({
        password_hash: p.password_hash, phone_verified: true, is_claimed: true,
        updated_at: new Date().toISOString(),
      }).eq("id", donorId).eq("tenant_id", tenantId);
    } else {
      const { data: created, error } = await supabase.from("donors").insert({
        tenant_id: tenantId, name: p.name, phone, whatsapp: phone,
        blood_group: p.blood_group ?? "O+",
        password_hash: p.password_hash, phone_verified: true, is_claimed: true,
      }).select("id").single();
      if (error || !created) return NextResponse.json({ error: "Could not create account" }, { status: 500 });
      donorId = created.id;
    }
    return sessionResponse({ ok: true, donorId }, donorId, tenantId);
  }

  // ── login ──────────────────────────────────────────────────────────────────
  if (action === "login") {
    const phone = normalizeBdPhone(body.phone);
    if (!phone || !body.password) return NextResponse.json({ error: "Phone and password required" }, { status: 400 });

    const { data: donor } = await supabase.from("donors")
      .select("id, password_hash, is_active")
      .eq("tenant_id", tenantId).eq("phone", phone).maybeSingle();

    if (!donor?.is_active || !verifyPassword(body.password, donor.password_hash)) {
      return NextResponse.json({ error: "Wrong phone number or password" }, { status: 401 });
    }
    return sessionResponse({ ok: true, donorId: donor.id }, donor.id, tenantId);
  }

  // ── logout ─────────────────────────────────────────────────────────────────
  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(DONOR_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
    return res;
  }

  // ── forgot: OTP to account phone ───────────────────────────────────────────
  if (action === "forgot") {
    const phone = normalizeBdPhone(body.phone);
    if (!phone) return NextResponse.json({ error: "Enter a valid number" }, { status: 400 });
    const { otp_required: resetOtp } = await getDonorSettings(tenantId);
    if (!resetOtp) {
      return NextResponse.json({
        error: "Password reset by SMS isn't available yet — contact the site admin",
      }, { status: 400 });
    }
    const { data: donor } = await supabase.from("donors")
      .select("id, password_hash").eq("tenant_id", tenantId).eq("phone", phone).maybeSingle();
    if (!donor?.password_hash) {
      return NextResponse.json({ error: "No account with this number" }, { status: 404 });
    }
    const sent = await createAndSendOtp(tenantId, phone, "reset");
    if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 400 });
    return NextResponse.json({ ok: true, next: "reset" });
  }

  // ── reset: OTP + new password ──────────────────────────────────────────────
  if (action === "reset") {
    const phone = normalizeBdPhone(body.phone);
    if (!phone || !body.code || !body.password || body.password.length < 6) {
      return NextResponse.json({ error: "Code and a 6+ character password required" }, { status: 400 });
    }
    const otp = await consumeOtp(tenantId, phone, "reset", String(body.code));
    if (!otp.ok) return NextResponse.json({ error: otp.error }, { status: 400 });

    const { data: donor } = await supabase.from("donors")
      .select("id").eq("tenant_id", tenantId).eq("phone", phone).maybeSingle();
    if (!donor) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    await supabase.from("donors").update({
      password_hash: hashPassword(body.password), phone_verified: true,
      updated_at: new Date().toISOString(),
    }).eq("id", donor.id);
    return sessionResponse({ ok: true }, donor.id, tenantId);
  }

  // ── claim: donor takes over a profile someone else created ────────────────
  if (action === "claim") {
    const { otp_required: claimOtp } = await getDonorSettings(tenantId);
    if (!claimOtp) {
      return NextResponse.json({
        error: "Claiming by SMS opens soon. For now, ask the person who added you to set a password for you.",
      }, { status: 400 });
    }
    const donorId = body.donor_id;
    if (!donorId) return NextResponse.json({ error: "Missing donor id" }, { status: 400 });
    const { data: donor } = await supabase.from("donors")
      .select("id, phone, is_claimed").eq("tenant_id", tenantId).eq("id", donorId).maybeSingle();
    if (!donor) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    if (donor.is_claimed) return NextResponse.json({ error: "Profile already claimed" }, { status: 409 });

    const sent = await createAndSendOtp(tenantId, donor.phone, "claim", { donor_id: donor.id });
    if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 400 });
    return NextResponse.json({ ok: true, next: "verify", phone_hint: donor.phone.slice(-4) });
  }

  // ── verify-claim: OTP + new password → ownership ───────────────────────────
  if (action === "verify-claim") {
    const donorId = body.donor_id;
    if (!donorId || !body.code || !body.password || body.password.length < 6) {
      return NextResponse.json({ error: "Code and a 6+ character password required" }, { status: 400 });
    }
    const { data: donor } = await supabase.from("donors")
      .select("id, phone").eq("tenant_id", tenantId).eq("id", donorId).maybeSingle();
    if (!donor) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const otp = await consumeOtp(tenantId, donor.phone, "claim", String(body.code));
    if (!otp.ok) return NextResponse.json({ error: otp.error }, { status: 400 });

    await supabase.from("donors").update({
      password_hash: hashPassword(body.password),
      phone_verified: true, is_claimed: true,
      updated_at: new Date().toISOString(),
    }).eq("id", donor.id);
    return sessionResponse({ ok: true }, donor.id, tenantId);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 404 });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  if (action === "me") {
    const donor = await getDonorSession(tenantId);
    return NextResponse.json({ donor });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 404 });
}
