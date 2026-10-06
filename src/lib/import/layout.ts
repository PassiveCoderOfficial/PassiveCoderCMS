import "server-only";
import { parseDocument } from "htmlparser2";
import type { ChildNode, Element } from "domhandler";
import { createBlock } from "@/modules/page-builder/block-registry";
import type { Block, BlockType } from "@/types/cms";

/**
 * Turns an imported page's HTML into designed Passive Coder sections instead
 * of one long text block. Free and deterministic (no AI): it reads the
 * page's own structure.
 *
 *   opening heading + intro + first photo -> hero
 *   a heading followed by 3+ sub-headings with text -> service cards
 *   a list of 3+ short points -> feature cards
 *   3+ photos with little text -> gallery
 *   2+ question headings -> FAQ
 *   anything else -> a text section (photos kept inline)
 *   always ends with a call to action using the business's contact details
 *
 * Sections alternate between plain and tinted backgrounds for rhythm. The
 * result is a sensible starting design the owner can restyle in the editor;
 * "Rebuild with AI" remains available for a full redesign.
 */

type Node =
  | { k: "h"; level: number; text: string }
  | { k: "p"; html: string; text: string }
  | { k: "list"; items: { text: string; html: string }[] }
  | { k: "img"; src: string; alt: string }
  | { k: "html"; html: string; text: string };

export type LayoutContact = { phone?: string | null; whatsapp?: string | null; email?: string | null; contactPath?: string | null; name?: string | null };

const BLOCK_TAGS = new Set(["p", "ul", "ol", "img", "table", "blockquote", "pre", "iframe", "h1", "h2", "h3", "h4", "h5", "h6"]);

function text(n: ChildNode): string {
  if (n.type === "text") return (n as unknown as { data: string }).data;
  const kids = (n as Element).children;
  return kids ? kids.map(text).join("") : "";
}
function outer(n: ChildNode): string {
  if (n.type === "text") return esc((n as unknown as { data: string }).data);
  const el = n as Element;
  if (el.type !== "tag" && el.type !== "script" && el.type !== "style") return "";
  const attrs = Object.entries(el.attribs ?? {}).map(([k, v]) => ` ${k}="${String(v).replace(/"/g, "&quot;")}"`).join("");
  if (el.name === "img" || el.name === "br" || el.name === "hr") return `<${el.name}${attrs} />`;
  return `<${el.name}${attrs}>${(el.children ?? []).map(outer).join("")}</${el.name}>`;
}
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/** Flatten nested page-builder wrappers (divs, sections, figures) into a linear sequence. */
function flatten(nodes: ChildNode[], out: Node[]) {
  for (const n of nodes) {
    if (n.type === "text") {
      const t = clean(text(n));
      if (t.length > 1) out.push({ k: "p", html: `<p>${esc(t)}</p>`, text: t });
      continue;
    }
    if (n.type !== "tag") continue;
    const el = n as Element;
    const name = el.name.toLowerCase();
    if (/^h[1-6]$/.test(name)) {
      const t = clean(text(el));
      if (t) out.push({ k: "h", level: Number(name[1]), text: t });
    } else if (name === "p") {
      const imgs = (el.children ?? []).filter((c) => c.type === "tag" && (c as Element).name === "img") as Element[];
      for (const im of imgs) if (im.attribs?.src) out.push({ k: "img", src: im.attribs.src, alt: im.attribs.alt ?? "" });
      const t = clean(text(el));
      if (t) out.push({ k: "p", html: outer(el).replace(/<img[^>]*>/g, ""), text: t });
    } else if (name === "ul" || name === "ol") {
      const items = (el.children ?? []).filter((c) => c.type === "tag" && (c as Element).name === "li")
        .map((li) => ({ text: clean(text(li)), html: (li as Element).children.map(outer).join("") })).filter((i) => i.text);
      if (items.length) out.push({ k: "list", items });
    } else if (name === "img") {
      if (el.attribs?.src) out.push({ k: "img", src: el.attribs.src, alt: el.attribs.alt ?? "" });
    } else if (BLOCK_TAGS.has(name)) {
      const t = clean(text(el));
      out.push({ k: "html", html: outer(el), text: t });
    } else {
      flatten(el.children ?? [], out);
    }
  }
}

type Section = { heading: string | null; level: number; nodes: Node[] };

function sections(nodes: Node[]): Section[] {
  const out: Section[] = [];
  let cur: Section = { heading: null, level: 0, nodes: [] };
  for (const n of nodes) {
    if (n.k === "h" && n.level <= 2) {
      if (cur.heading || cur.nodes.length) out.push(cur);
      cur = { heading: n.text, level: n.level, nodes: [] };
    } else cur.nodes.push(n);
  }
  if (cur.heading || cur.nodes.length) out.push(cur);
  return out;
}

const ICONS = ["CheckCircle", "Star", "ShieldCheck", "Wrench", "Clock", "ThumbsUp", "Award", "Sparkles", "Hammer"];
const make = (type: BlockType, data: Record<string, unknown>): Block => {
  const b = createBlock(type)!;
  b.data = { ...(b.data as object), ...data } as typeof b.data;
  return b;
};
const id = () => Math.random().toString(36).slice(2, 10);

function cardsFrom(nodes: Node[]) {
  // Sub-heading followed by its text, repeated.
  const cards: { title: string; description: string; image?: string }[] = [];
  let cur: { title: string; description: string; image?: string } | null = null;
  for (const n of nodes) {
    if (n.k === "h") { if (cur) cards.push(cur); cur = { title: n.text, description: "" }; }
    else if (cur && (n.k === "p" || n.k === "html")) cur.description = clean(`${cur.description} ${n.text}`).slice(0, 260);
    else if (cur && n.k === "list") cur.description = clean(`${cur.description} ${n.items.map((i) => i.text).join(", ")}`).slice(0, 260);
    else if (cur && n.k === "img" && !cur.image) cur.image = n.src;
  }
  if (cur) cards.push(cur);
  return cards.filter((c) => c.title.length < 90);
}

function sectionBlock(s: Section): Block | null {
  const subheads = s.nodes.filter((n) => n.k === "h");
  const textLen = s.nodes.reduce((a, n) => a + ("text" in n ? n.text.length : n.k === "list" ? n.items.reduce((x, i) => x + i.text.length, 0) : 0), 0);
  const imgs = s.nodes.filter((n): n is Extract<Node, { k: "img" }> => n.k === "img");
  const lists = s.nodes.filter((n): n is Extract<Node, { k: "list" }> => n.k === "list");
  const title = s.heading ?? "";

  const questions = subheads.filter((h) => h.k === "h" && /\?\s*$/.test(h.text));
  if (questions.length >= 2) {
    const items: { id: string; question: string; answer: string }[] = [];
    let q: { id: string; question: string; answer: string } | null = null;
    for (const n of s.nodes) {
      if (n.k === "h") { if (q?.answer) items.push(q); q = /\?\s*$/.test(n.text) ? { id: id(), question: n.text, answer: "" } : null; }
      else if (q && "text" in n) q.answer = clean(`${q.answer} ${n.text}`);
    }
    if (q?.answer) items.push(q);
    if (items.length >= 2) return make("faq", { title: title || "Frequently asked questions", subtitle: "", items });
  }

  const cards = cardsFrom(s.nodes);
  if (cards.length >= 3 && cards.every((c) => c.title)) {
    return make("services", {
      title, subtitle: "",
      columns: cards.length % 3 === 0 || cards.length > 4 ? 3 : 2,
      items: cards.slice(0, 12).map((c, i) => ({ id: id(), icon: ICONS[i % ICONS.length], iconType: "lucide", title: c.title, description: c.description, ...(c.image ? { image: c.image } : {}) })),
    });
  }

  if (imgs.length >= 3 && textLen < 240) {
    return make("gallery", { title: title || "Gallery", columns: imgs.length % 3 === 0 ? 3 : 4, images: imgs.slice(0, 24).map((im) => ({ id: id(), url: im.src, alt: im.alt || title })) });
  }

  const big = lists.find((l) => l.items.length >= 3 && l.items.every((i) => i.text.length <= 200));
  if (big && textLen - big.items.reduce((x, i) => x + i.text.length, 0) < 400) {
    const intro = s.nodes.find((n): n is Extract<Node, { k: "p" }> => n.k === "p");
    return make("features", {
      title: title || "Why choose us", subtitle: intro ? intro.text.slice(0, 200) : "", columns: big.items.length % 3 === 0 ? 3 : 2, style: "card",
      items: big.items.slice(0, 12).map((it, i) => {
        const m = it.text.match(/^(.{2,60}?)\s*[:–—-]\s+(.+)$/);
        return { id: id(), icon: ICONS[i % ICONS.length], title: m ? m[1] : it.text.slice(0, 80), description: m ? m[2] : "" };
      }),
    });
  }

  if (!textLen && !imgs.length) return null;
  const body = s.nodes.map((n) => {
    if (n.k === "h") return `<h3>${esc(n.text)}</h3>`;
    if (n.k === "list") return `<ul>${n.items.map((i) => `<li>${i.html}</li>`).join("")}</ul>`;
    if (n.k === "img") return `<p><img src="${n.src}" alt="${esc(n.alt)}" /></p>`;
    return n.html;
  }).join("");
  return make("text", { content: `${title ? `<h2>${esc(title)}</h2>` : ""}${body}`, typography: {} });
}

export function layoutFromHtml(html: string, opts: { title: string; contact?: LayoutContact }): Block[] {
  const nodes: Node[] = [];
  flatten(parseDocument(html).children as ChildNode[], nodes);
  if (!nodes.length) return [make("text", { content: "<p></p>", typography: {} })];

  // Hero: page title, the first short paragraph as the subtitle, first photo.
  const firstImg = nodes.find((n): n is Extract<Node, { k: "img" }> => n.k === "img");
  const firstH = nodes.findIndex((n) => n.k === "h");
  const headline = firstH >= 0 && firstH <= 2 ? (nodes[firstH] as Extract<Node, { k: "h" }>).text : opts.title;
  if (firstH >= 0 && firstH <= 2) nodes.splice(firstH, 1);
  const introIdx = nodes.findIndex((n) => n.k === "p" && n.text.length >= 20 && n.text.length <= 320);
  const intro = introIdx >= 0 && introIdx <= 3 ? (nodes.splice(introIdx, 1)[0] as Extract<Node, { k: "p" }>).text : "";
  if (firstImg) nodes.splice(nodes.indexOf(firstImg), 1);

  const c = opts.contact ?? {};
  const wa = c.whatsapp ? `https://wa.me/${c.whatsapp.replace(/\D/g, "")}` : null;
  const tel = c.phone ? `tel:${c.phone.replace(/[^\d+]/g, "")}` : null;
  const primary = wa ? { label: "WhatsApp us", url: wa, variant: "primary" } : tel ? { label: "Call us", url: tel, variant: "primary" } : { label: "Contact us", url: c.contactPath ?? "/contact", variant: "primary" };
  const secondary = wa && tel ? { label: "Call us", url: tel, variant: "outline" } : { label: "Contact us", url: c.contactPath ?? "/contact", variant: "outline" };

  const blocks: Block[] = [make("hero", {
    layout: firstImg ? "split" : "centered",
    title: headline.slice(0, 120), subtitle: "", description: intro,
    primaryButton: primary, secondaryButton: secondary,
    ...(firstImg ? { imageUrl: firstImg.src, imageAlt: firstImg.alt || headline } : {}),
  })];

  let tint = false;
  for (const s of sections(nodes)) {
    const b = sectionBlock(s);
    if (!b) continue;
    if (tint) b.background = { type: "color", color: "hsl(var(--muted))" };
    tint = !tint;
    blocks.push(b);
  }

  blocks.push(make("cta", {
    title: c.name ? `Talk to ${c.name}` : "Ready to get started?",
    description: "Tell us what you need and we'll get back to you quickly.",
    primaryButton: { label: primary.label, url: primary.url },
    secondaryButton: { label: secondary.label, url: secondary.url },
    layout: "centered",
  }));
  return blocks.map((b, i) => ({ ...b, order: i }));
}

/* ── Spam and WordPress leftovers ──────────────────────────────────────── */
const SPAM = /\b(1xbet|1x\s?bet|casino|betting|bet365|aviator|sportsbook|slots?|poker|jackpot|apk\b|mod apk|viagra|cialis|kamagra|payday loans?|crypto (signals|casino)|onlyfans|escort|porn|xxx|replica watches)\b/i;
const WP_DEFAULTS = new Set(["sample-page", "hello-world", "privacy-policy-2"]);

/** True for injected spam (hacked WordPress sites) and WordPress's own placeholder pages. */
export function isJunk(slug: string, title: string, html: string): string | null {
  if (WP_DEFAULTS.has(slug) || /^(sample page|hello world!?)$/i.test(title.trim())) return "WordPress placeholder page";
  const plain = `${title} ${html.replace(/<[^>]+>/g, " ").slice(0, 4000)}`;
  if (SPAM.test(title) || (plain.match(new RegExp(SPAM.source, "gi"))?.length ?? 0) >= 3) return "Looks like spam (gambling/pharma), probably injected by a hack";
  return null;
}
