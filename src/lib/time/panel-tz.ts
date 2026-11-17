/**
 * Panel time zone (2026-11-04): one platform-wide IANA zone, set by a super
 * admin in Super Admin > Settings (platform_settings.panel_timezone, default
 * Asia/Dhaka). Every date and time in the Super Admin panel, the Staff Portal
 * and the root site (passivecoder.com) is shown in it.
 *
 * Pure helpers, safe on server and client. Formatting with an explicit
 * timeZone gives the same string on the Node server (UTC clock on Vercel)
 * and in the browser, so there is no hydration mismatch.
 *
 * Where the zone comes from:
 *  - server components: `await getPanelTimeZone()` (lib/time/panel-tz-server)
 *  - client components: `usePanelTimeZone()` / `usePanelDates()`
 *    (components/providers/panel-time-zone), fed by the panel layouts.
 * Outside the panels (tenant dashboards and tenant sites) the hook returns
 * undefined and the formatters fall back to the runtime's zone, i.e. the
 * old behaviour.
 */

export const DEFAULT_PANEL_TZ = "Asia/Dhaka";

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz.trim() || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz.trim() });
    return true;
  } catch {
    return false;
  }
}

/** A stored value made safe to format with: anything invalid becomes Dhaka. */
export function normalizeTimeZone(tz: unknown): string {
  return isValidTimeZone(tz) ? tz.trim() : DEFAULT_PANEL_TZ;
}

type DateIn = string | number | Date | null | undefined;
type Opts = Intl.DateTimeFormatOptions;

function toDate(d: DateIn): Date | null {
  if (d === null || d === undefined || d === "") return null;
  const x = d instanceof Date ? d : new Date(d);
  return Number.isNaN(x.getTime()) ? null : x;
}

function withZone(opts: Opts, tz: string | undefined): Opts {
  return tz ? { ...opts, timeZone: tz } : opts;
}

/** "2026-11-04": a calendar date, not an instant. JS reads it as UTC midnight,
 *  so it is shown in UTC or a zone west of UTC would move it a day back. */
const isCalendarDate = (d: DateIn) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);

/** Date only, e.g. "4 Nov 2026" style per locale. Defaults to the locale's short date. */
export function fmtDate(d: DateIn, tz: string | undefined, opts: Opts = {}, locale: string | string[] | undefined = "en-US"): string {
  const x = toDate(d);
  if (!x) return "";
  const o: Opts = Object.keys(opts).length ? opts : { year: "numeric", month: "numeric", day: "numeric" };
  return x.toLocaleDateString(locale, withZone(o, isCalendarDate(d) ? "UTC" : tz));
}

/** Date and time, e.g. "11/4/2026, 3:05:09 PM" (locale default) or with custom options. */
export function fmtDateTime(d: DateIn, tz: string | undefined, opts: Opts = {}, locale: string | string[] | undefined = "en-US"): string {
  const x = toDate(d);
  if (!x) return "";
  return x.toLocaleString(locale, withZone(opts, tz));
}

/** Time only. */
export function fmtTime(d: DateIn, tz: string | undefined, opts: Opts = {}, locale: string | string[] | undefined = "en-US"): string {
  const x = toDate(d);
  if (!x) return "";
  return x.toLocaleTimeString(locale, withZone(opts, tz));
}

/** "GMT+6" style offset of a zone right now, for labels. */
export function zoneOffsetLabel(tz: string, at: Date = new Date()): string {
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" })
      .formatToParts(at).find((p) => p.type === "timeZoneName");
    return part?.value === "GMT" ? "GMT+0" : part?.value ?? "";
  } catch {
    return "";
  }
}

/** Every IANA zone the runtime knows (plus UTC), for the settings picker. */
export function allTimeZones(): string[] {
  let list: string[] = [];
  try {
    list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
  } catch { /* old runtime */ }
  if (!list.length) list = [DEFAULT_PANEL_TZ, "Asia/Singapore", "Asia/Dubai", "Asia/Qatar", "Asia/Riyadh", "Asia/Kolkata", "Europe/London", "America/New_York"];
  return Array.from(new Set(["UTC", ...list]));
}

/** The instant of a wall-clock time on a calendar day in a zone, e.g. the
 *  start of "2026-11-07" in Asia/Dhaka (= 2026-11-06T18:00Z). For date filters. */
export function zonedInstant(day: string, time: string, tz: string | undefined): Date {
  const [y, m, d] = day.split("-").map(Number);
  const [hh = 0, mm = 0, ss = 0] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm, Math.floor(ss), Math.round((ss % 1) * 1000));
  if (!tz) return new Date(wall);
  const offset = (t: number) => {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" }).formatToParts(new Date(t));
    const g = (k: string) => Number(p.find((x) => x.type === k)?.value ?? 0);
    return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second")) - Math.floor(t / 1000) * 1000;
  };
  let t = wall - offset(wall);
  t = wall - offset(t);
  return new Date(t);
}

/** "YYYY-MM-DD" of an instant (default now) in a zone, e.g. today's date for a form default. */
export function isoDateInZone(tz: string | undefined, d: Date = new Date()): string {
  if (!tz) return d.toISOString().slice(0, 10);
  return d.toLocaleDateString("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
}
