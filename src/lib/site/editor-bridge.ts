/**
 * Script injected into a draft-preview page opened with ?editor=1 (the mobile
 * app's page editor and, on the web preview, an iframe). It makes blocks
 * selectable: tap outlines the block and posts {type:"select"} to the host;
 * the host can highlight / scroll to / restrict selectable blocks. Links and
 * forms are inert in editor mode so a tap never navigates away.
 *
 * Host -> page messages (JSON strings):
 *   {type:"highlight", blockId}   outline this block ("" clears)
 *   {type:"scrollTo", blockId}    scroll it into view
 *   {type:"selectable", ids}      only these ids react to taps (null = all); others dim
 *   {type:"reload"}               location.reload()
 *   {type:"patch", blockId, prev, block, seq}
 *                                 update the block in place: every changed
 *                                 text/photo value of block.data is found in
 *                                 the rendered block (by its previous value)
 *                                 and swapped. Anything else (structure,
 *                                 settings, a value that cannot be found)
 *                                 answers ok:false and the host reloads.
 * Page -> host:
 *   {type:"ready", ids:[...]}     block ids in document order, once loaded
 *   {type:"select", blockId, blockType, rect:{top,height}}
 *   {type:"patched", blockId, seq, ok}
 *
 * Who may talk to the page (a "patch" message writes HTML into it, so this
 * matters):
 *  - inside the mobile app's WebView: only messages the app itself injects
 *    (they have no source window); a frame inside the page cannot pose as it;
 *  - inside an iframe: only the window that embeds the page (window.parent),
 *    and only when its origin is on the list: the page's own origin, the
 *    platform's own hosts, and any origin in EDITOR_HOST_ORIGINS (comma
 *    separated, for a hosted web build of the admin app). Replies go to that
 *    origin, never to "*";
 *  - opened on its own in a browser tab: nobody.
 */
import { scriptJson, scriptText } from "@/lib/security/style-text";

/** Origins allowed to embed and drive an editor preview, besides the page's own. */
export function editorHostOrigins(env: { rootDomain?: string | null; appUrl?: string | null; extra?: string | null }): string[] {
  const out = new Set<string>();
  const add = (v: string | null | undefined) => {
    if (!v) return;
    try {
      const u = new URL(v.trim());
      if (u.protocol === "https:" || u.protocol === "http:") out.add(u.origin);
    } catch { /* not a URL */ }
  };
  const root = (env.rootDomain ?? "").trim();
  if (root) {
    const scheme = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(root) ? "http" : "https";
    add(`${scheme}://${root}`);
    add(`${scheme}://www.${root}`);
  }
  add(env.appUrl);
  for (const o of (env.extra ?? "").split(",")) add(o);
  return [...out];
}

/** The script for this install (origins from the environment). */
export function editorBridgeScript(): string {
  return scriptText(editorBridgeJs(editorHostOrigins({
    rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    extra: process.env.EDITOR_HOST_ORIGINS,
  }), process.env.NODE_ENV !== "production"));
}

// String.raw keeps the regex backslashes intact in the injected script.
export const editorBridgeJs = (allowedOrigins: string[], allowLocalhost = false) => String.raw`(function(){
  if (window.__pcEditor) return; window.__pcEditor = true;
  var ALLOWED = ${scriptJson(allowedOrigins)}, LOCAL = ${allowLocalhost ? "true" : "false"}, host = null;
  var inApp = !!window.ReactNativeWebView, framed = !inApp && window.parent && window.parent !== window;
  function okOrigin(o){ return typeof o === "string" && !!o && (o === location.origin || ALLOWED.indexOf(o) >= 0 || (LOCAL && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o))); }
  // The embedding page's origin: known before it sends anything (so "ready"
  // can be posted), and replaced by the origin of a message that passed the checks.
  function hostOrigin(){
    if (host) return host;
    var o = "";
    try { if (location.ancestorOrigins && location.ancestorOrigins.length) o = location.ancestorOrigins[0]; else if (document.referrer) o = new URL(document.referrer).origin; } catch (_) {}
    if (okOrigin(o)) host = o;
    return host;
  }
  var SEL = "pc-editor-selected", DIM = "pc-editor-dim";
  var css = document.createElement("style");
  css.textContent = "[data-pc-id]{cursor:pointer}[data-pc-id]." + SEL + "{outline:2px solid #f2610c;outline-offset:-2px;box-shadow:0 0 0 4px rgba(242,97,12,.18)}[data-pc-id]." + DIM + "{opacity:.35;pointer-events:none}";
  document.head.appendChild(css);
  var allowed = null;
  function post(msg){ var s = JSON.stringify(msg); if (inApp) window.ReactNativeWebView.postMessage(s); else if (framed) { var h = hostOrigin(); if (h) window.parent.postMessage(s, h); } }
  function blocks(){ return Array.prototype.slice.call(document.querySelectorAll("[data-pc-id]")); }
  function byId(id){ return document.querySelector('[data-pc-id="' + id + '"]'); }
  function select(id){ blocks().forEach(function(el){ el.classList.toggle(SEL, el.getAttribute("data-pc-id") === id); }); }
  function applyAllowed(){ blocks().forEach(function(el){ var id = el.getAttribute("data-pc-id"); el.classList.toggle(DIM, !!allowed && allowed.indexOf(id) < 0); }); }
  document.addEventListener("click", function(e){
    var el = e.target && e.target.closest ? e.target.closest("[data-pc-id]") : null;
    if (!el) return;
    while (el && allowed && allowed.indexOf(el.getAttribute("data-pc-id")) < 0) el = el.parentElement && el.parentElement.closest("[data-pc-id]");
    e.preventDefault(); e.stopPropagation();
    if (!el) return;
    var id = el.getAttribute("data-pc-id"); select(id);
    var r = el.getBoundingClientRect();
    post({ type: "select", blockId: id, blockType: el.getAttribute("data-pc-block"), rect: { top: r.top + window.scrollY, height: r.height } });
  }, true);
  document.addEventListener("submit", function(e){ e.preventDefault(); }, true);
  function onMessage(ev){
    // The app injects its messages (no source window). In a frame, only the
    // embedding window on an allowed origin. Anything else is dropped.
    if (inApp) { if (ev.source) return; }
    else if (!framed || ev.source !== window.parent || !okOrigin(ev.origin)) return;
    else host = ev.origin;
    var m; try { m = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data; } catch (_) { return; }
    if (!m || !m.type) return;
    if (m.type === "highlight") select(m.blockId || "");
    else if (m.type === "scrollTo") { var el = byId(m.blockId); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }
    else if (m.type === "selectable") { allowed = Array.isArray(m.ids) ? m.ids : null; applyAllowed(); }
    else if (m.type === "reload") location.reload();
    else if (m.type === "patch") { var ok = false; try { ok = patch(m.blockId, m.prev, m.block); } catch (_) { ok = false; } post({ type: "patched", blockId: m.blockId, seq: m.seq, ok: ok }); }
  }
  // In-place patch: collect changed leaves of block.data; strings only.
  function diff(a, b, out){
    if (a === b) return true;
    if (typeof a === "string" && typeof b === "string") { out.push([a, b]); return true; }
    if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    var ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (var i = 0; i < kb.length; i++) { if (!(kb[i] in a)) return false; if (!diff(a[kb[i]], b[kb[i]], out)) return false; }
    return true;
  }
  function same(a, b){ return JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b); }
  function textNodes(root){ var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, r = []; while ((n = w.nextNode())) r.push(n); return r; }
  function looksUrl(s){ return /^(https?:)?\/\//i.test(s) || /^\/[^\s]*\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(s); }
  function swapUrl(el, from, to){
    var hit = false;
    var nodes = [el].concat(Array.prototype.slice.call(el.querySelectorAll("*")));
    nodes.forEach(function(n){
      ["src", "srcset", "poster", "data-src"].forEach(function(attr){ var v = n.getAttribute && n.getAttribute(attr); if (v && v.indexOf(from) >= 0) { n.setAttribute(attr, v.split(from).join(to)); hit = true; } });
      // next/image serves optimised URLs (/_next/image?url=<encoded>)
      ["src", "srcset"].forEach(function(attr){ var v = n.getAttribute && n.getAttribute(attr), enc = encodeURIComponent(from); if (v && v.indexOf(enc) >= 0) { n.setAttribute(attr, v.split(enc).join(encodeURIComponent(to))); hit = true; } });
      var st = n.getAttribute && n.getAttribute("style"); if (st && st.indexOf(from) >= 0) { n.setAttribute("style", st.split(from).join(to)); hit = true; }
    });
    return hit;
  }
  function swapText(el, from, to){
    var f = from.trim(); if (!f) return false;
    if (/<[a-z][\s\S]*>/i.test(from)) {
      // rich text: an element whose markup is exactly the old HTML
      var all = el.querySelectorAll("*");
      for (var i = 0; i < all.length; i++) { if (all[i].innerHTML.trim() === f) { all[i].innerHTML = to; return true; } }
      return false;
    }
    var hit = false;
    textNodes(el).forEach(function(n){ var v = n.nodeValue || ""; if (v.trim() === f) { n.nodeValue = v.replace(f, to.trim()); hit = true; } });
    if (!hit) { // the value may be split over inline elements (<br>, <strong>)
      var cand = el.querySelectorAll("*");
      for (var j = cand.length - 1; j >= 0; j--) { var c = cand[j]; if (c.children.length < 4 && (c.textContent || "").trim() === f) { c.textContent = to.trim(); return true; } }
    }
    // inputs / buttons carry text in attributes
    el.querySelectorAll("input,textarea").forEach(function(n){ if (n.getAttribute("placeholder") === from) { n.setAttribute("placeholder", to); hit = true; } if (n.value === from) { n.value = to; hit = true; } });
    el.querySelectorAll("[alt],[title],[aria-label]").forEach(function(n){ ["alt", "title", "aria-label"].forEach(function(a){ if (n.getAttribute(a) === from) { n.setAttribute(a, to); hit = true; } }); });
    return hit;
  }
  function patch(id, prev, next){
    var el = byId(id);
    if (!el || !prev || !next || prev.type !== next.type) return false;
    // Only data changes can be patched; looks/visibility/children need a re-render.
    var keys = {}; Object.keys(prev).concat(Object.keys(next)).forEach(function(k){ keys[k] = 1; });
    for (var k in keys) { if (k !== "data" && !same(prev[k], next[k])) return false; }
    var changes = [];
    if (!diff(prev.data || {}, next.data || {}, changes)) return false;
    for (var i = 0; i < changes.length; i++) {
      var from = changes[i][0], to = changes[i][1];
      var ok = looksUrl(from) ? swapUrl(el, from, to) : swapText(el, from, to);
      if (!ok) return false;
    }
    return true;
  }
  document.addEventListener("message", onMessage); window.addEventListener("message", onMessage);
  function ready(){ post({ type: "ready", ids: blocks().map(function(el){ return el.getAttribute("data-pc-id"); }) }); }
  if (document.readyState === "complete") ready(); else window.addEventListener("load", ready);
})();`;
