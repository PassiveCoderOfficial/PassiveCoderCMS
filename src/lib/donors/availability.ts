// Donation-readiness chip logic:
//   last donated ≤ 50 days ago  → red (not ready)
//   51–59 days                  → yellow (almost)
//   ≥ 60 days or never recorded → green (ready) / orange (unknown)

export type Availability = "ready" | "soon" | "not_ready" | "unknown";

export function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400_000);
}

export function availabilityOf(lastDonatedOn: string | null | undefined): Availability {
  const days = daysSince(lastDonatedOn);
  if (days === null) return "unknown";
  if (days >= 60) return "ready";
  if (days >= 51) return "soon";
  return "not_ready";
}

export const AVAILABILITY_META: Record<Availability, { label: string; bg: string; text: string }> = {
  ready:     { label: "Ready",    bg: "#dcfce7", text: "#15803d" },
  soon:      { label: "Soon",     bg: "#fef9c3", text: "#a16207" },
  not_ready: { label: "Not yet",  bg: "#fee2e2", text: "#b91c1c" },
  unknown:   { label: "Unknown",  bg: "#ffedd5", text: "#c2410c" },
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
