/* Small input checks shared by the installer routes. Pure. */

/** "Name <a@b.c>" or "a@b.c", on one line. */
export function isSender(value: string): boolean {
  const v = value.trim();
  if (/[\r\n]/.test(v)) return false;
  return /^[^\s<>@"]+@[^\s<>@"]+\.[^\s<>@"]+$/.test(v) || /^[^<>"]{1,80}\s<[^\s<>@"]+@[^\s<>@"]+\.[^\s<>@"]+>$/.test(v);
}

/** The address part of a sender: "Shop <hi@x.com>" -> "hi@x.com". */
export function senderAddress(value: string): string {
  const m = /<([^<>]+)>\s*$/.exec(value.trim());
  return (m ? m[1] : value).trim();
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
