/**
 * Turn whatever an owner types ("https://www.MyShop.com/about") into the bare
 * apex hostname we store and route on ("myshop.com"), or explain why it can't
 * be used. Platform domains are refused so a site can't claim our own hosts.
 */
export function normalizeDomain(input: string, rootDomain: string): { domain: string } | { error: string } {
  let d = input.trim().toLowerCase();
  d = d.replace(/^[a-z]+:\/\//, "").split(/[/?#]/)[0].replace(/:\d+$/, "").replace(/\.$/, "");
  if (d.startsWith("www.")) d = d.slice(4);
  if (!d) return { error: "Enter a domain name, like yourbusiness.com" };
  if (!/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(d) && !/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+xn--[a-z0-9-]{2,59}$/.test(d)) {
    return { error: `"${input.trim()}" isn't a valid domain name. Use the form yourbusiness.com` };
  }
  const root = rootDomain.split(":")[0].toLowerCase();
  if (d === root || d.endsWith(`.${root}`) || d.endsWith(".vercel.app")) {
    return { error: "That address belongs to the platform. Use a domain you own." };
  }
  return { domain: d };
}
