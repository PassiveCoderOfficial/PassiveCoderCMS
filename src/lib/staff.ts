/**
 * Open edition: there is no Passive Coder staff. Nobody is staff, so every
 * caller gets the rule non-staff get on the hosted platform.
 */
export async function getStaff(): Promise<{ id: string; status?: string | null } | null> {
  return null;
}

export async function requireStaff(): Promise<null> {
  return null;
}

/** Narrows a tenants query to the sites this person may open (their own). */
export function staffSites<Q extends { or(filters: string): Q }>(
  q: Q,
  staff: { id: string; status?: string | null } | null | undefined,
  ownerUserId?: string,
): Q {
  const id = staff?.id ?? "null";
  const parts = [`assigned_staff_id.eq.${id}`, `referred_by_staff_id.eq.${id}`];
  if (ownerUserId) parts.push(`owner_id.eq.${ownerUserId}`);
  return q.or(parts.join(","));
}
