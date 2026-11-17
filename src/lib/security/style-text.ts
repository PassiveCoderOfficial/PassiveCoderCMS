/**
 * Text that goes inside an inline <style> or <script> element.
 *
 * Both are "raw text" elements: the browser ends them at the first
 * "</style" / "</script" it sees, wherever that is (inside a CSS string, a
 * comment, a JSON value). So anything a site owner can type must not be able
 * to produce that sequence, or the rest of their text is parsed as HTML and
 * can run as script: on the public site, and in the dashboard of whoever
 * opens that site's builder.
 *
 * No imports: safe for server and client files, unit-tested in
 * tests/platform/style-text.test.ts.
 */

const BACKSLASH = "\\";

/**
 * CSS for a <style> element. "</" becomes "<\/" (inside a CSS string that is
 * still "/"; anywhere else "</" was never valid CSS) and "<!--" is broken up.
 * A lone "<" stays, so media range queries (width < 600px) keep working.
 */
export function styleText(css: unknown): string {
  if (typeof css !== "string" || !css) return "";
  return css.split("</").join("<" + BACKSLASH + "/").split("<!--").join("<" + BACKSLASH + "!--");
}

/** Generated CSS that never needs a "<" at all (theme tokens): every one
 *  becomes the CSS escape for "<". */
export function strictStyleText(css: unknown): string {
  if (typeof css !== "string" || !css) return "";
  return css.split("<").join(BACKSLASH + "3c ");
}

/**
 * JSON for a <script> element (JSON-LD, or a value handed to inline code).
 * "<" is escaped so the value cannot close the tag or open a comment, and the
 * two line separators JSON allows but older script parsers do not are escaped
 * too. The parsed value is unchanged.
 */
export function scriptJson(value: unknown): string {
  return (JSON.stringify(value) ?? "null")
    .split("<").join(BACKSLASH + "u003c")
    .split(String.fromCharCode(0x2028)).join(BACKSLASH + "u2028")
    .split(String.fromCharCode(0x2029)).join(BACKSLASH + "u2029");
}

/** Inline JavaScript we wrote ourselves, with site values already encoded by
 *  scriptJson: a last guard so nothing in it can close the element. */
export function scriptText(js: unknown): string {
  if (typeof js !== "string" || !js) return "";
  return js.replace(/<\/(script)/gi, "<" + BACKSLASH + "/$1").split("<!--").join("<" + BACKSLASH + "!--");
}

/* ── CSS value checks (theme tokens) ──────────────────────────────────── */

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_FN = /^(?:rgb|rgba|hsl|hsla)\(\s*[0-9.,%\s/deg-]{1,60}\)$/i;
const COLOR_NAME = /^[a-z]{3,30}$/i;

/** A CSS colour (hex, rgb()/hsl(), or a colour name), or null. */
export function safeCssColor(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return HEX.test(s) || COLOR_FN.test(s) || COLOR_NAME.test(s) ? s : null;
}

const LENGTH = /^-?(?:\d{1,4}(?:\.\d{1,4})?|\.\d{1,4})(?:px|rem|em|%)?$/;

/** One to `maxParts` CSS lengths ("0.75rem", "18", "4px 8px"), or null. */
export function safeCssLength(v: unknown, maxParts = 1): string | null {
  if (typeof v === "number" && Number.isFinite(v)) v = String(v);
  if (typeof v !== "string") return null;
  const parts = v.trim().split(/\s+/);
  if (!parts[0] || parts.length > maxParts) return null;
  return parts.every((p) => LENGTH.test(p)) ? parts.join(" ") : null;
}

/** A font weight: 1-1000 or a keyword, or null. */
export function safeFontWeight(v: unknown): string | null {
  if (typeof v === "number" && Number.isFinite(v)) v = String(v);
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  if (/^(?:normal|bold|bolder|lighter)$/.test(s)) return s;
  if (!/^\d{1,4}$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= 1000 ? s : null;
}

/** Letter spacing: "normal" or one length, or null. */
export function safeLetterSpacing(v: unknown): string | null {
  if (typeof v === "string" && v.trim().toLowerCase() === "normal") return "normal";
  return safeCssLength(v, 1);
}

const GENERIC_FAMILIES = new Set([
  "serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-serif", "ui-sans-serif",
  "ui-monospace", "ui-rounded", "math", "emoji", "fangsong", "inherit", "initial", "unset",
]);
const FAMILY = /^-?[A-Za-z0-9][A-Za-z0-9 _.-]{0,59}$/;

/**
 * A font-family value built only from well-formed family names: var() refs
 * are dropped (they do not resolve where theme tokens live), every remaining
 * family must be letters, digits, spaces, "_", "." or "-", and named families
 * come out quoted. Anything else in the list is dropped; null if nothing is left.
 */
export function safeFontStack(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const out: string[] = [];
  for (const raw of v.replace(/var\([^)]*\)\s*,?\s*/g, "").split(",")) {
    const name = raw.trim().replace(/^(['"])(.*)\1$/, "$2").trim();
    if (!name || !FAMILY.test(name)) continue;
    const generic = GENERIC_FAMILIES.has(name.toLowerCase()) || /^-[a-z-]+$/i.test(name);
    out.push(generic ? name : `'${name}'`);
    if (out.length >= 8) break;
  }
  return out.length ? out.join(", ") : null;
}
