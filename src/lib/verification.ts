const GRACE_MS = 7 * 24 * 60 * 60 * 1000;

interface ProfileVerificationFields {
  created_at: string;
  email_verified_at: string | null;
  whatsapp_verified_at: string | null;
}

export interface VerificationStatus {
  verified: boolean;
  locked: boolean;
  graceDeadline: Date;
  daysRemaining: number;
}

export function computeVerificationStatus(p: ProfileVerificationFields): VerificationStatus {
  const verified = !!(p.email_verified_at || p.whatsapp_verified_at);
  const graceDeadline = new Date(new Date(p.created_at).getTime() + GRACE_MS);
  const locked = !verified && Date.now() > graceDeadline.getTime();
  const daysRemaining = Math.max(0, Math.ceil((graceDeadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  return { verified, locked, graceDeadline, daysRemaining };
}

// Raw REST fetch (not @supabase/supabase-js) — this runs in Edge middleware,
// mirroring the tenant-lookup fetch pattern already used in middleware.ts.
export async function checkAndEnforceLock(userId: string): Promise<VerificationStatus | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const res = await fetch(
    `${url}/rest/v1/profiles?id=eq.${userId}&select=created_at,email_verified_at,whatsapp_verified_at,is_active`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  const rows: (ProfileVerificationFields & { is_active: boolean })[] = await res.json();
  const profile = rows?.[0];
  if (!profile) return null;

  const status = computeVerificationStatus(profile);

  if (status.locked && profile.is_active) {
    await fetch(`${url}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ is_active: false }),
    });
  }

  return status;
}
