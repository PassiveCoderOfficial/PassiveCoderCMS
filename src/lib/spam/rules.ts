// Pure spam rules (no DB, no network) so they can be unit tested: how a sender
// is identified across spellings, and what a bot submission looks like.

export type BlockKind = "email" | "phone" | "ip" | "visitor";

export interface Sender {
  email?: string | null;
  phone?: string | null;
  ip?: string | null;
  /** The chat widget's session id. */
  session?: string | null;
}

/** Messages from one sender on one site in 24h before alerts stop and a "Ban?" prompt goes out. */
export const REPEAT_LIMIT = 5;
/** AI-answered visitor messages per IP per site per day; after that the chat is live-only. */
export const AI_MESSAGES_PER_VISITOR_DAY = 60;
/** New chats per IP per site per day that still push. */
export const NEW_CHAT_PUSHES_PER_DAY = 5;
export const DEFAULT_IP_BAN_DAYS = 30;

/** Same mailbox, same key: Gmail ignores dots and +tags, which bots use to look like new people. */
export function emailKey(raw: string | null | undefined): string | null {
  const email = (raw ?? "").trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return null;
  const domain = email.slice(at + 1);
  const local = email.slice(0, at).split("+")[0];
  if (!local) return null;
  if (domain === "gmail.com" || domain === "googlemail.com") return `${local.replace(/\./g, "")}@gmail.com`;
  return `${local}@${domain}`;
}

/** Last 10 digits, so 01711..., +8801711... and 8801711... are one person. */
export function phoneKey(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.length >= 8 ? digits.slice(-10) : null;
}

/** Every key this sender can be blocked by. */
export function senderKeys(s: Sender): { kind: BlockKind; value: string }[] {
  const keys: { kind: BlockKind; value: string }[] = [];
  const email = emailKey(s.email);
  const phone = phoneKey(s.phone);
  const ip = (s.ip ?? "").trim();
  const session = (s.session ?? "").trim();
  if (email) keys.push({ kind: "email", value: email });
  if (phone) keys.push({ kind: "phone", value: phone });
  if (ip && ip !== "unknown") keys.push({ kind: "ip", value: ip });
  if (session) keys.push({ kind: "visitor", value: session });
  return keys;
}

/** One unbroken run of letters with the case flipping throughout: "HvDgeyDtVYhfSOPOwoFNhJX". */
export function looksRandom(value: unknown): boolean {
  if (typeof value !== "string" || !/^[A-Za-z]{12,}$/.test(value)) return false;
  let flips = 0;
  for (let i = 1; i < value.length; i++) {
    const a = value[i - 1], b = value[i];
    if ((a === a.toUpperCase()) !== (b === b.toUpperCase())) flips += 1;
  }
  return flips >= 6;
}

function dottedGmail(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const m = /^([^@\s]+)@(?:gmail|googlemail)\.com$/i.exec(value.trim());
  return !!m && (m[1].match(/\./g)?.length ?? 0) >= 2;
}

/** The bot pattern on our forms: random-letter fields, usually with a dot-padded Gmail address. */
export function isBotSubmission(fields: Record<string, unknown>): boolean {
  const values = Object.values(fields);
  const random = values.filter(looksRandom).length;
  return random >= 2 || (random === 1 && values.some(dottedGmail));
}

export interface BlockRow {
  id: string;
  tenant_id: string | null;
  kind: BlockKind;
  value: string;
  effect: "block" | "allow";
  expires_at: string | null;
  hits: number;
}

/** The rule that stops this sender, if any. A live allow on a key beats a block on the same key. */
export function pickBlock(rows: BlockRow[], keys: { kind: BlockKind; value: string }[], now: Date = new Date()): BlockRow | null {
  const live = rows.filter((r) => keys.some((k) => k.kind === r.kind && k.value === r.value) && (!r.expires_at || new Date(r.expires_at) > now));
  const allowed = new Set(live.filter((r) => r.effect === "allow").map((r) => `${r.kind}:${r.value}`));
  return live.find((r) => r.effect === "block" && !allowed.has(`${r.kind}:${r.value}`)) ?? null;
}
