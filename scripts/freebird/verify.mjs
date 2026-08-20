import { rest, TENANT_ID } from './_lib.mjs';
import { SERVICES } from './_content.mjs';

const pages = await rest(
  `pages?tenant_id=eq.${TENANT_ID}&status=eq.published&select=slug,title,seo,blocks&order=order_index`,
);

console.log('=== PUBLISHED PAGES ===');
for (const p of pages) {
  const seoOk = p.seo?.title && p.seo?.description;
  console.log(`${seoOk ? 'ok ' : 'SEO'} /${p.slug === 'home' ? '' : p.slug}  (${p.blocks.length} blocks)`);
}

const slugs = new Set(pages.map((p) => p.slug));
const expected = [
  'home', 'services', 'about', 'our-work', 'faq', 'contact',
  'privacy-policy', 'terms-conditions',
  ...SERVICES.map((s) => `services/${s.slug}`),
];
const missing = expected.filter((s) => !slugs.has(s));
const extra = [...slugs].filter((s) => !expected.includes(s));
console.log('\nMISSING:', missing.length ? missing : 'none');
console.log('ORPHANED (published, not in nav):', extra.length ? extra : 'none');

// ── Brand + placeholder audit ────────────────────────────────────────────
const all = JSON.stringify(pages);
const BANNED = [
  ['NISA', /nisa/i],
  ['buildright', /buildright/i],
  ['placeholder phone 9123 4567', /9123\s?4567/],
  ['Boon Lay template address', /boon lay/i],
  ['unsupported claim: licensed', /\blicensed\b/i],
  ['unsupported claim: certified', /\bcertified\b/i],
  ['unsupported claim: 24\\/7', /24\s?\/\s?7/],
  ['unsupported claim: years experience', /\d+\+?\s*years?\b/i],
  ['unsupported claim: guarantee', /\bguarantee/i],
];
console.log('\n=== BRAND / CLAIM AUDIT ===');
for (const [label, re] of BANNED) {
  const hit = all.match(re);
  console.log(`${hit ? 'FAIL' : 'pass'}  ${label}${hit ? ` -> "${hit[0]}"` : ''}`);
}

const todo = (all.match(/TODO_[A-Z]+/g) || []);
console.log('\nTODO tokens:', todo.length ? [...new Set(todo)] : 'none');

// ── Internal link integrity ──────────────────────────────────────────────
const urls = [
  ...(all.match(/"url":"\/[^"]*"/g) || []).map((u) => u.slice(7, -1)),
  ...(all.match(/"link":"\/[^"]*"/g) || []).map((u) => u.slice(8, -1)),
];
const internal = urls.filter((u) => u.startsWith('/') && !u.startsWith('//'));
const broken = internal.filter((u) => {
  const clean = u.split('#')[0].split('?')[0].replace(/^\//, '').replace(/\/$/, '');
  return clean !== '' && !slugs.has(clean);
});
console.log('\n=== INTERNAL LINKS ===');
console.log(`${internal.length} internal links, ${new Set(internal).size} unique`);
console.log('BROKEN:', broken.length ? [...new Set(broken)] : 'none');
