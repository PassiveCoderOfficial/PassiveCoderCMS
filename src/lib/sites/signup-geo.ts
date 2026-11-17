/**
 * Where a signup comes from, read from Vercel's geo headers, so a new trial
 * starts in the owner's country and timezone without an extra question.
 *
 * Both values are optional: the headers are absent in local development and
 * can carry placeholders (XX, T1). Anything unusable comes back null, and the
 * caller keeps today's defaults (timezone UTC, no country). The owner can
 * change both later in Settings and the business profile.
 */
export interface SignupGeo {
  country: string | null;
  timezone: string | null;
}

const NOT_A_COUNTRY = new Set(["XX", "ZZ", "T1", "A1", "A2"]);

function validCountry(raw: string | null): string | null {
  const code = (raw ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && !NOT_A_COUNTRY.has(code) ? code : null;
}

function validTimezone(raw: string | null): string | null {
  const tz = (raw ?? "").trim();
  if (!tz) return null;
  try {
    const decoded = decodeURIComponent(tz);
    new Intl.DateTimeFormat("en-US", { timeZone: decoded });
    return decoded;
  } catch {
    return null;
  }
}

export function signupGeo(headers: Headers): SignupGeo {
  return {
    country: validCountry(headers.get("x-vercel-ip-country")),
    timezone: validTimezone(headers.get("x-vercel-ip-timezone")),
  };
}
