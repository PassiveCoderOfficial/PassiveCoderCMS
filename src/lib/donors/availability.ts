// Donation-readiness chip logic:
//   last donated ≤ 75 days ago  → red    (recently donated, not ready)
//   76–89 days                  → orange (almost ready)
//   ≥ 90 days                   → green  (ready to donate)
//   never donated               → green  (eligible)
//   date unknown (null, not never) → yellow
//   temporarily unavailable     → grey   (overrides all of the above)

export type Availability = "ready" | "soon" | "not_ready" | "unknown" | "unavailable";

export function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400_000);
}

/**
 * `isAvailable=false` (donor marked themselves/was marked temporarily
 * unavailable — traveling, sick, etc.) overrides the readiness-by-date
 * color with grey, regardless of how long since their last donation.
 * `neverDonated=true` means they've genuinely never donated → ready (green),
 * as opposed to simply having no recorded date → unknown (yellow).
 */
export function availabilityOf(
  lastDonatedOn: string | null | undefined,
  isAvailable = true,
  neverDonated = false,
): Availability {
  if (!isAvailable) return "unavailable";
  if (neverDonated) return "ready";
  const days = daysSince(lastDonatedOn);
  if (days === null) return "unknown";
  if (days >= 90) return "ready";
  if (days >= 76) return "soon";
  return "not_ready";
}

export const AVAILABILITY_META: Record<Availability, { label: string; bg: string; text: string; dot: string }> = {
  ready:       { label: "Ready",       bg: "#dcfce7", text: "#15803d", dot: "#22c55e" }, // green
  soon:        { label: "Almost",      bg: "#ffedd5", text: "#c2410c", dot: "#f97316" }, // orange, 76-89d
  not_ready:   { label: "Not yet",     bg: "#fee2e2", text: "#b91c1c", dot: "#ef4444" }, // red, ≤75d
  unknown:     { label: "Unknown",     bg: "#fef9c3", text: "#a16207", dot: "#eab308" }, // yellow
  unavailable: { label: "Unavailable", bg: "#e5e7eb", text: "#4b5563", dot: "#9ca3af" }, // grey
};

export function ageOf(birthdate: string | null | undefined, ageYears: number | null | undefined): number | null {
  if (birthdate) {
    const b = new Date(birthdate + "T00:00:00");
    if (!isNaN(b.getTime())) {
      const now = new Date();
      let age = now.getFullYear() - b.getFullYear();
      if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
      return age;
    }
  }
  return ageYears ?? null;
}
