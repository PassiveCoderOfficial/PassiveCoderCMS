/** Wall-clock ↔ UTC conversion in an arbitrary IANA timezone.
 *
 *  Content is scheduled in the *brand's* timezone (Passive Coder posts at 9am
 *  Dhaka regardless of where the person scheduling it happens to be), so every
 *  view has to convert between a stored UTC instant and a local wall-clock
 *  string. Kept in one place — the editor sheet, calendar drag-drop and any
 *  future recurring-slot generator all need exactly this. */

/** Offset of `tz` from UTC in ms at a given instant; positive east of UTC
 *  (Asia/Dhaka = +6h). Formatting the instant in the zone and reading the
 *  result back as if it were UTC yields precisely that shift. */
export function tzOffsetMs(instant: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asIfUtc = Date.UTC(
    get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"),
  );
  return asIfUtc - instant.getTime();
}

/** "YYYY-MM-DDTHH:mm" wall clock in `tz` → UTC ISO instant.
 *
 *  utc = wall − offset, but the offset depends on the instant, so estimate
 *  once then re-derive at that instant; the second pass settles DST edges.
 *  Verified round-trip for Asia/Dhaka (+6), half-hour zones (Asia/Kolkata)
 *  and fall-back ambiguity. A time inside a spring-forward gap (one that
 *  never occurs) resolves to the hour before, the conventional choice. */
export function wallClockToUtc(value: string, tz: string): string | null {
  if (!value) return null;
  const wall = new Date(`${value}:00Z`).getTime();
  let utc = wall - tzOffsetMs(new Date(wall), tz);
  utc = wall - tzOffsetMs(new Date(utc), tz);
  return new Date(utc).toISOString();
}

/** UTC ISO instant → "YYYY-MM-DDTHH:mm" wall clock in `tz`, the format
 *  `<input type="datetime-local">` expects. */
export function utcToWallClock(iso: string | null, tz: string): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Calendar day key ("YYYY-MM-DD") for an instant in `tz`. Grouping on the
 *  viewer's local date would file a late-evening Dhaka post under the wrong
 *  day for anyone west of it. */
export function dayKeyInTz(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(iso));
}

/** "HH:mm" in `tz`. */
export function timeInTz(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz,
  }).format(new Date(iso));
}
