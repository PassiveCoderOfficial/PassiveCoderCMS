/**
 * The platform has two admin "worlds" with their own look and their own
 * remembered light/dark choice, so nobody hopping between them by single sign
 * on can confuse where they are:
 *
 *   console  Staff Portal and Super Admin (top navigation, indigo palette)
 *   site     a client's site dashboard (left sidebar, warm palette)
 *
 * Everything else (public sites, marketing, login, vendor) has no world and
 * keeps the plain palette in globals.css, untouched. The palettes in
 * app/worlds.css only apply under html[data-world].
 */
export type World = "console" | "site";
export type ThemeChoice = "light" | "dark" | "system";

export const WORLD_THEME: Record<World, { key: string; fallback: ThemeChoice; legacyKey?: string }> = {
  // Super Admin was always dark and Staff had no toggle of its own, so dark is the start.
  console: { key: "pc-theme-console", fallback: "dark" },
  // Keeps what a client already chose under the old shared key.
  site: { key: "pc-theme-site", fallback: "system", legacyKey: "cms-theme" },
};

/** Which world a URL belongs to. The Experts host rewrites its own paths, so it never has one. */
export function worldForPath(pathname: string, hostname = ""): World | null {
  if (hostname.startsWith("experts.")) return null;
  if (/^\/(?:super-admin|staff)(?:\/|$)/.test(pathname)) return "console";
  if (/^\/dashboard(?:\/|$)/.test(pathname)) return "site";
  return null;
}

/** The saved choice for a world, or its default. A cookie comes first: it follows staff across client subdomains. */
export function storedWorldTheme(world: World): ThemeChoice {
  const { key, fallback, legacyKey } = WORLD_THEME[world];
  let saved: string | null = document.cookie.match(new RegExp(`(?:^|; )${key}=(\\w+)`))?.[1] ?? null;
  try {
    saved = saved ?? localStorage.getItem(key) ?? (legacyKey ? localStorage.getItem(legacyKey) : null);
  } catch { /* storage blocked */ }
  return saved === "light" || saved === "dark" || saved === "system" ? saved : fallback;
}

const ROOT_HOST = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com").split(":")[0];

/**
 * Remembers a choice. localStorage is per host, and staff hop between the root
 * domain and every client's subdomain, so it also goes in a cookie shared across
 * the platform's hosts. A client's own domain just keeps the host-only copy.
 */
export function saveWorldTheme(world: World, choice: ThemeChoice) {
  const { key } = WORLD_THEME[world];
  try { localStorage.setItem(key, choice); } catch { /* storage blocked */ }
  const host = window.location.hostname;
  const shared = ROOT_HOST.includes(".") && (host === ROOT_HOST || host.endsWith(`.${ROOT_HOST}`));
  document.cookie = `${key}=${choice}; path=/; max-age=31536000; samesite=lax${shared ? `; domain=.${ROOT_HOST}` : ""}`;
}

/**
 * Inline, in <head>, before the first paint: stamps the world and its theme on
 * <html> so the page, and anything portaled to <body>, is right from the start.
 * Must stay in step with worldForPath and storedWorldTheme above. Does nothing
 * outside the two worlds.
 */
export const WORLD_THEME_SCRIPT = `(function(){try{
var l=location,p=l.pathname,w=l.hostname.indexOf("experts.")===0?null:/^\\/(?:super-admin|staff)(?:\\/|$)/.test(p)?"console":/^\\/dashboard(?:\\/|$)/.test(p)?"site":null;
if(!w)return;
var c=${JSON.stringify(WORLD_THEME)}[w],m=document.cookie.match(new RegExp("(?:^|; )"+c.key+"=(\\\\w+)")),s=m?m[1]:null;
if(!s)try{s=localStorage.getItem(c.key)||(c.legacyKey?localStorage.getItem(c.legacyKey):null)}catch(e){}
if(s!=="light"&&s!=="dark"&&s!=="system")s=c.fallback;
var d=s==="dark"||(s==="system"&&matchMedia("(prefers-color-scheme: dark)").matches),h=document.documentElement;
h.setAttribute("data-world",w);h.classList.remove("light","dark");h.classList.add(d?"dark":"light");h.style.colorScheme=d?"dark":"light";
}catch(e){}})();`;
