import sanitizeHtml from "sanitize-html";

/**
 * Trial sites (tenants.trial_ends_at set) are free and anonymous to create,
 * and every site on a platform subdomain shares the signed-in session cookie.
 * So until a site is paid for, nothing its owner typed may run as script:
 * not for visitors, and not for staff or super admins who open its builder.
 *
 * This is the one place that decides what "cannot run" means. It is applied
 * to the whole block tree where blocks are drawn (components/site/
 * page-renderer.tsx for the public site, page-builder/canvas/block-renderer.tsx
 * for the builder and its previews) and to the few HTML/CSS fields outside
 * blocks. The saved content is never changed: once the site is paid the
 * original HTML renders again, exactly as written.
 *
 * Paid sites never come through here.
 *
 * Works on the server and in the browser. Keep it out of files the public
 * site sends to visitors (it pulls in an HTML parser); the builder loads it on
 * demand, only for trial sites.
 */

const GLOBAL_ATTRS = [
  "class", "id", "style", "title", "lang", "dir", "role", "hidden", "tabindex",
  "width", "height", "align", "valign", "aria-*", "data-*",
];

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    // Text and structure.
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "div", "span", "section", "article", "aside", "header", "footer", "main", "nav",
    "blockquote", "pre", "code", "kbd", "samp", "var", "address", "center",
    "strong", "b", "em", "i", "u", "s", "strike", "del", "ins", "small", "big", "sub", "sup", "mark", "abbr", "cite", "q", "dfn", "time", "font", "wbr",
    "ul", "ol", "li", "dl", "dt", "dd",
    "table", "caption", "colgroup", "col", "thead", "tbody", "tfoot", "tr", "th", "td",
    "details", "summary", "figure", "figcaption",
    // Links and media. iframe only from the video/map hosts listed below.
    "a", "img", "picture", "source", "video", "audio", "track", "iframe",
  ],
  // script, style and friends are dropped together with what is inside them.
  nonTextTags: ["script", "style", "textarea", "option", "noscript", "template", "title", "xmp", "noembed", "noframes", "plaintext"],
  allowedAttributes: {
    "*": GLOBAL_ATTRS,
    a: ["href", "target", "rel", "name", "download"],
    img: ["src", "srcset", "sizes", "alt", "loading", "decoding"],
    source: ["src", "srcset", "sizes", "type", "media"],
    video: ["src", "poster", "controls", "muted", "loop", "playsinline", "autoplay", "preload"],
    audio: ["src", "controls", "muted", "loop", "preload"],
    track: ["src", "kind", "srclang", "label", "default"],
    iframe: ["src", "allow", "allowfullscreen", "frameborder", "loading", "referrerpolicy"],
    td: ["colspan", "rowspan", "headers"], th: ["colspan", "rowspan", "headers", "scope"],
    col: ["span"], colgroup: ["span"],
    ol: ["start", "type", "reversed"], li: ["value"],
    details: ["open"], time: ["datetime"], font: ["color", "size", "face"], q: ["cite"], blockquote: ["cite"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"], source: ["http", "https"], video: ["http", "https"], audio: ["http", "https"] },
  allowedSchemesAppliedToAttributes: ["href", "src", "cite", "poster", "srcset"],
  allowProtocolRelative: true,
  allowedIframeHostnames: [
    "www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com",
    "www.google.com", "maps.google.com", "www.openstreetmap.org",
  ],
  allowIframeRelativeUrls: false,
  // style="" stays as typed (no script runs from an inline style in any
  // current browser); parsing it would need a CSS parser in the browser.
  parseStyleAttributes: false,
  enforceHtmlBoundary: false,
  transformTags: {
    // A new tab opened by tenant HTML never gets a handle on our window.
    a: (tagName, attribs) => ({ tagName, attribs: attribs.target ? { ...attribs, rel: "noopener noreferrer" } : attribs }),
    // Inline images only as real bitmap data (no data:text/html, no SVG).
    img: (tagName, attribs) => {
      if (!/^\s*data:/i.test(attribs.src ?? "") || /^\s*data:image\/(?:png|jpe?g|gif|webp|avif);base64,/i.test(attribs.src)) return { tagName, attribs };
      const { src: _dropped, ...rest } = attribs;
      void _dropped;
      return { tagName, attribs: rest };
    },
  },
};

/** Does this text contain markup (a tag, comment or declaration)? Plain text is left alone. */
const HAS_MARKUP = /<[a-zA-Z!/?]/;

/** A link that would run code when followed. Browsers skip tabs, newlines and control characters inside the scheme. */
const SCRIPT_URL = /^(?:javascript|vbscript|livescript|data:text\/html|data:application\/xhtml|data:image\/svg)/i;
const isScriptUrl = (s: string) => s.length < 4000 && SCRIPT_URL.test(stripInvisible(s));

/** Without whitespace, control and zero-width characters (given as code points, so this file stays plain ASCII). */
function stripInvisible(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0;
    if (c <= 0x20 || (c >= 0x7f && c <= 0x9f) || c === 0xad || (c >= 0x200b && c <= 0x200f) || c === 0x2028 || c === 0x2029 || c === 0xfeff) continue;
    out += ch;
  }
  return out;
}

/** Tenant HTML with everything that can run removed. */
export function sanitizeTrialHtml(html: string): string {
  if (typeof html !== "string" || !html) return "";
  return sanitizeHtml(html, OPTIONS);
}

/**
 * Tenant CSS that is printed inside a <style> tag. The only way out of a
 * style tag is a "<" that starts a tag ("</style><script>"), so those are
 * written as the CSS escape for "<", which means the same inside CSS strings
 * and nothing as HTML. Old script-in-CSS forms are defused too.
 */
export function sanitizeTrialCss(css: string): string {
  if (typeof css !== "string" || !css) return "";
  return css
    .replace(/<(?=[a-zA-Z!/?])/g, "\\3c ")
    .replace(/expression\s*\(/gi, "blocked(")
    .replace(/(?:java|vb|live)script\s*:/gi, "blocked:")
    .replace(/-moz-binding|behavior\s*:/gi, "blocked:");
}

const CSS_KEY = /css$/i;

function clean(value: unknown, key: string | null, depth: number): unknown {
  if (typeof value === "string") {
    if (key && CSS_KEY.test(key)) return sanitizeTrialCss(value);
    if (isScriptUrl(value)) return "#";
    return HAS_MARKUP.test(value) ? sanitizeTrialHtml(value) : value;
  }
  if (value === null || typeof value !== "object" || depth > 40) return value;
  if (Array.isArray(value)) {
    let changed = false;
    const out = value.map((v) => { const c = clean(v, key, depth + 1); if (c !== v) changed = true; return c; });
    return changed ? out : value;
  }
  // Only plain data (blocks are JSON); anything else, such as a React element, is left as is.
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return value;
  let changed = false;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const c = clean(v, k, depth + 1);
    if (c !== v) changed = true;
    out[k] = c;
  }
  return changed ? out : value;
}

/**
 * A copy of a block (or a list of blocks, or any JSON value) that is safe to
 * draw for a trial site: every string that holds markup is sanitised, every
 * "...css" field is defused, and script links become "#". Values that need no
 * change are returned as the same object, so nothing re-renders for no reason.
 */
export function sanitizeTrialContent<T>(value: T): T {
  return clean(value, null, 0) as T;
}
