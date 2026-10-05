import sanitizeHtml from "sanitize-html";

/**
 * Product short/long descriptions may be plain text (typed in the dashboard)
 * or HTML (imported from WooCommerce, or written with the product-detail
 * classes below). Plain text keeps its line breaks; HTML is sanitised and
 * rendered. Class names are kept so the `pd-*` helpers can lay out rich
 * content such as a fragrance-notes grid:
 *
 *   <div class="pd-grid"><div><h4>Top Notes</h4><p>Bergamot</p></div>…</div>
 *   <details class="pd-acc"><summary>Notes</summary><p>…</p></details>
 *   <div class="pd-split"><img src="…"><div><h3>…</h3><p>…</p></div></div>
 */
export function productHtml(raw: string | null | undefined): { html: string; isHtml: boolean } | null {
  const text = (raw ?? "").trim();
  if (!text) return null;
  if (!/<[a-z][\s\S]*>/i.test(text)) return { html: text, isHtml: false };
  const html = sanitizeHtml(text, {
    allowedTags: ["h2", "h3", "h4", "h5", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "small", "sub", "sup",
      "a", "ul", "ol", "li", "blockquote", "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td",
      "span", "div", "details", "summary", "video", "source", "iframe"],
    allowedAttributes: {
      "*": ["class"],
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      video: ["src", "controls", "poster", "muted", "loop", "playsinline", "preload", "width", "height"],
      source: ["src", "type"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "title"],
      details: ["open"],
      th: ["colspan", "rowspan"], td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"],
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener" }) },
  });
  return { html, isHtml: true };
}

/** Styles for the pd-* helpers; theme tokens only so every tenant's palette applies. */
export const PRODUCT_HTML_CSS = `
.pd-html{line-height:1.75}
.pd-html h2,.pd-html h3,.pd-html h4{font-family:var(--heading-font,inherit);line-height:1.25;margin:1.4em 0 .6em}
.pd-html h3{font-size:1.35rem}.pd-html h2{font-size:1.6rem}
.pd-html>:first-child{margin-top:0}
.pd-html p{margin:0 0 1em}
.pd-html ul{list-style:disc;padding-left:1.25em;margin:0 0 1em}
.pd-html img,.pd-html video{max-width:100%;height:auto;border-radius:.25rem}
.pd-html a{color:hsl(var(--primary));text-decoration:underline}
.pd-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));border:1px solid hsl(var(--border));border-radius:.25rem;margin:0 0 1.4em}
.pd-grid>div{padding:1.4em 1em;text-align:center}
.pd-grid>div+div{border-left:1px solid hsl(var(--border))}
.pd-grid h4{font-family:inherit;font-size:.72rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:hsl(var(--primary));margin:0 0 .7em}
.pd-grid p{margin:0;font-size:.92rem;color:hsl(var(--muted-foreground))}
@media(max-width:560px){.pd-grid>div+div{border-left:0;border-top:1px solid hsl(var(--border))}}
.pd-box{border:1px solid hsl(var(--border));padding:1.3em 1.4em;margin:0 0 1em}
.pd-box>h3:first-child,.pd-box>h4:first-child{margin-top:0}
.pd-acc{border:1px solid hsl(var(--border));background:hsl(var(--muted)/.6);margin:0 0 1em}
.pd-acc>summary{cursor:pointer;list-style:none;padding:1.1em 1.4em;font-family:var(--heading-font,inherit);font-size:1.05rem;display:flex;justify-content:space-between;align-items:center}
.pd-acc>summary::-webkit-details-marker{display:none}
.pd-acc>summary::after{content:"+";font-size:1.2rem;opacity:.5}
.pd-acc[open]>summary::after{content:"\\2212"}
.pd-acc>:not(summary){padding:0 1.4em}.pd-acc>:last-child{padding-bottom:1.2em}
.pd-split{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center;margin:3rem 0}
.pd-split>img,.pd-split>video{width:100%}
@media(max-width:768px){.pd-split{grid-template-columns:1fr;gap:1.5rem}}
.pd-wide{margin:3rem 0}.pd-wide img,.pd-wide video{width:100%}
`;
