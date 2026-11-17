/*
 * Email hosting shortcuts (2026-10-21). Sites whose website moved to us but
 * whose email stayed on cPanel / Google / Microsoft keep the old
 * domain.com/webmail, /mail and /cpanel links: the proxy answers them with a
 * 302 before any page renders. Targets are stored per site
 * (tenants.mail_shortcut_targets, filled by clients/WP-import/_kit/mail_shortcuts.py)
 * so nothing is checked at request time. /whm is never handled.
 */
export type MailHostType = "cpanel" | "google" | "microsoft";
export type MailShortcutTargets = { webmail?: string; cpanel?: string };
export type MailShortcutFields = {
  custom_domain: string | null;
  mail_host_type?: string | null;
  mail_shortcuts_enabled?: boolean | null;
  mail_shortcut_targets?: MailShortcutTargets | null;
};

const SHORTCUT_PATH = /^\/(webmail|mail|cpanel)\/?$/i;

/** Every shortcut this site answers, keyed by path (webmail, mail, cpanel). */
export function mailShortcutLinks(t: MailShortcutFields): Record<string, string> {
  const d = t.custom_domain?.toLowerCase();
  const type = t.mail_host_type as MailHostType | null | undefined;
  if (!d || !type) return {};
  const saved = t.mail_shortcut_targets ?? {};
  let webmail: string | undefined;
  let cpanel: string | undefined;
  if (type === "cpanel") {
    webmail = saved.webmail || `https://webmail.${d}`;
    cpanel = saved.cpanel || `https://cpanel.${d}`;
  } else if (type === "google") {
    webmail = saved.webmail || `https://mail.google.com/a/${d}`;
  } else if (type === "microsoft") {
    webmail = saved.webmail || "https://outlook.office.com/mail/";
  }
  const out: Record<string, string> = {};
  if (webmail) { out.webmail = webmail; out.mail = webmail; }
  if (cpanel) out.cpanel = cpanel;
  return out;
}

/** Where this request should go, or null when it is not a shortcut. */
export function mailShortcutFor(t: MailShortcutFields, method: string, pathname: string): string | null {
  if (!t.mail_shortcuts_enabled || (method !== "GET" && method !== "HEAD")) return null;
  const m = SHORTCUT_PATH.exec(pathname);
  if (!m) return null;
  return mailShortcutLinks(t)[m[1].toLowerCase()] ?? null;
}
