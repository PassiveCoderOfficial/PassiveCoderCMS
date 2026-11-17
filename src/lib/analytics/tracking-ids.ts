/**
 * Tracking ids are written into inline scripts and script URLs on every
 * page, so each is checked against its exact shape at render time, whatever
 * was saved. Letters, digits and hyphens only: nothing that can close a
 * string or a tag.
 */

/** Google tag ids: GA4 "G-XXXXXXXXXX", and the Ads / Floodlight / Google-tag / old Universal Analytics forms. */
export const GA_ID_RE = /^(?:(?:G|GT|AW|DC)-[A-Z0-9]{4,20}|UA-\d{4,12}-\d{1,4})$/i;

/** Google Tag Manager container: "GTM-XXXXXXX". */
export const GTM_ID_RE = /^GTM-[A-Z0-9]+$/;

/** The id if it is a well-formed Google tag id, else null (not rendered). */
export function safeGaId(id: unknown): string | null {
  if (typeof id !== "string") return null;
  const v = id.trim();
  return GA_ID_RE.test(v) ? v : null;
}

/** The id if it is a well-formed GTM container id, else null (not rendered). */
export function safeGtmId(id: unknown): string | null {
  if (typeof id !== "string") return null;
  const v = id.trim();
  return GTM_ID_RE.test(v) ? v : null;
}
