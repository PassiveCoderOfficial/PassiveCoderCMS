// Deadline helpers shared by the request forms. `datetime-local` inputs want
// a local-time "YYYY-MM-DDTHH:mm" string — never an ISO/UTC one, or the value
// silently shifts by the timezone offset.

export const DEFAULT_DEADLINE_HOURS = 6;

/** Format a Date for a <input type="datetime-local"> value. */
export function toLocalInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Default "needed by" for a new request: now + 6h, ready for the picker. */
export function defaultDeadlineInput(): string {
  return toLocalInput(new Date(Date.now() + DEFAULT_DEADLINE_HOURS * 60 * 60 * 1000));
}
