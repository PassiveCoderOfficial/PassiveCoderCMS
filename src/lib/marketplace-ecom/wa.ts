/**
 * WhatsApp click-to-chat helpers. No WhatsApp API involved: we open wa.me
 * with the message pre-filled and the sender taps send. Safe on client and
 * server.
 */

/** Normalise a phone to wa.me's digits-only international form. Local
 *  Bangladeshi numbers (01XXXXXXXXX) get the 880 country code. Returns null
 *  when there's nothing usable. */
export function waNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = phone.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (/^01\d{9}$/.test(d)) d = `88${d}`;
  d = d.replace(/\D/g, "");
  return d.length >= 8 ? d : null;
}

export function waLink(phone: string | null | undefined, text: string): string | null {
  const n = waNumber(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
}
