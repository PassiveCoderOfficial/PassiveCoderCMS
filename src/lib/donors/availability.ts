// Donation-readiness chip logic:
//   last donated ≤ 50 days ago  → red (not ready)
//   51–59 days                  → yellow (almost)
//   ≥ 60 days or never recorded → green (ready) / orange (unknown)

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
 */
export function availabilityOf(lastDonatedOn: string | null | undefined, isAvailable = true): Availability {
  if (!isAvailable) return "unavailable";
  const days = daysSince(lastDonatedOn);
  if (days === null) return "unknown";
  if (days >= 60) return "ready";
  if (days >= 51) return "soon";
  return "not_ready";
}

export const AVAILABILITY_META: Record<Availability, { label: string; bg: string; text: string; dot: string }> = {
  ready:       { label: "Ready",       bg: "#dcfce7", text: "#15803d", dot: "#22c55e" },
  soon:        { label: "Soon",        bg: "#fef9c3", text: "#a16207", dot: "#eab308" },
  not_ready:   { label: "Not yet",     bg: "#fee2e2", text: "#b91c1c", dot: "#ef4444" },
  unknown:     { label: "Unknown",     bg: "#ffedd5", text: "#c2410c", dot: "#f97316" },
  unavailable: { label: "Unavailable", bg: "#e5e7eb", text: "#4b5563", dot: "#9ca3af" },
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
