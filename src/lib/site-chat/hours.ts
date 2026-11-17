/**
 * Site chat business hours (tenants.site_chat_hours). Used to tell a visitor
 * who asks for a person whether the team is likely around right now.
 */

export type ChatHours = { days: number[]; start: string; end: string; tz: string };

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseHours(v: unknown): ChatHours | null {
  if (!v || typeof v !== "object") return null;
  const h = v as Partial<ChatHours>;
  const hm = /^\d{2}:\d{2}$/;
  if (!Array.isArray(h.days) || !hm.test(String(h.start)) || !hm.test(String(h.end)) || typeof h.tz !== "string") return null;
  return { days: h.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6), start: h.start!, end: h.end!, tz: h.tz };
}

/** True when `now` falls inside the hours (in their timezone). No hours set = always open. */
export function isOpenNow(hours: ChatHours | null, now = new Date()): boolean {
  if (!hours) return true;
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: hours.tz, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const day = DAY_NAMES.indexOf(get("weekday"));
    const mins = Number(get("hour")) * 60 + Number(get("minute"));
    const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
    return hours.days.includes(day) && mins >= toMin(hours.start) && mins < toMin(hours.end);
  } catch {
    return true;
  }
}

const TZ_NAMES: Record<string, string> = { "Asia/Dhaka": "Bangladesh", "Asia/Riyadh": "Saudi", "Asia/Dubai": "UAE", "Asia/Singapore": "Singapore", "Asia/Qatar": "Qatar" };

const twelve = (s: string) => {
  const h = Number(s.slice(0, 2)); const m = s.slice(3);
  return `${h % 12 || 12}${m === "00" ? "" : `:${m}`}${h < 12 ? "am" : "pm"}`;
};

/** "Sat-Thu, 10am-6pm (Asia/Dhaka)" style text for the AI and the visitor. */
export function describeHours(h: ChatHours): string {
  const sorted = [...h.days].sort((a, b) => ((a + 1) % 7) - ((b + 1) % 7)); // week from Saturday
  const run = sorted.length > 2 && sorted.every((d, i) => i === 0 || d === (sorted[i - 1] + 1) % 7);
  const days = sorted.length === 7 ? "Every day" : run ? `${DAY_NAMES[sorted[0]]} to ${DAY_NAMES[sorted[sorted.length - 1]]}` : sorted.map((d) => DAY_NAMES[d]).join(", ");
  const zone = TZ_NAMES[h.tz] ?? h.tz;
  return `${days}, ${twelve(h.start)} to ${twelve(h.end)} ${zone} time`;
}

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** When the team is next on duty, as "today at 10am", "tomorrow at 10am" or "on Saturday at 10am" (their timezone). */
export function nextOpening(hours: ChatHours, now = new Date()): string | null {
  if (!hours.days.length) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: hours.tz, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const day = DAY_NAMES.indexOf(get("weekday"));
    const mins = Number(get("hour")) * 60 + Number(get("minute"));
    const start = Number(hours.start.slice(0, 2)) * 60 + Number(hours.start.slice(3));
    for (let k = 0; k < 8; k++) {
      const d = (day + k) % 7;
      if (!hours.days.includes(d) || (k === 0 && mins >= start)) continue;
      const when = k === 0 ? "today" : k === 1 ? "tomorrow" : `on ${FULL_DAYS[d]}`;
      return `${when} at ${twelve(hours.start)} ${TZ_NAMES[hours.tz] ?? hours.tz} time`;
    }
  } catch { /* bad timezone */ }
  return null;
}

/** System prompt lines telling the AI how to handle "can I talk to a person". */
export function humanHandoffPrompt(hours: ChatHours | null, now = new Date()): string {
  if (!hours) {
    return "If the visitor asks for a human, call request_human, tell them a team member has been notified and will join this chat shortly, and keep helping meanwhile.";
  }
  const open = isOpenNow(hours, now);
  return [
    `Team hours: ${describeHours(hours)}. Right now the team is ${open ? "ON duty" : "OFF duty"}.`,
    open
      ? "If the visitor asks for a human, call request_human and tell them a team member has been notified and will join this chat shortly (they may be busy with other visitors), and keep helping meanwhile."
      : `If the visitor asks for a human, call request_human and tell them politely that it is outside business hours right now, so no team member may be available to reply; the team is back ${nextOpening(hours, now) ?? "in the next working hours"} (hours: ${describeHours(hours)}). Then ask for their name and phone number (email optional) so the team can contact them; once you have name and phone, call create_lead with a short summary of what they need, and confirm the team will contact them then. Keep helping meanwhile.`,
  ].join("\n");
}

/** Plain reply for when the AI is not answering (off, limits) and the visitor asks for a person. */
export function humanWaitReply(hours: ChatHours | null, now = new Date()): string {
  if (!hours || isOpenNow(hours, now)) return "Thanks, a team member has been notified and will join this chat shortly.";
  const next = nextOpening(hours, now);
  return `Thanks, our team has been notified. It is outside our business hours right now, so no one may be available to reply. We are back ${next ?? "in our next working hours"} (${describeHours(hours)}). Leave your WhatsApp number or email and we will get back to you then.`;
}
