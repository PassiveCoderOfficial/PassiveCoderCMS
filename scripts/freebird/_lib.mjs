import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
const g = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();

export const SUPABASE_URL = g('NEXT_PUBLIC_SUPABASE_URL');
export const SERVICE_KEY = g('SUPABASE_SERVICE_ROLE_KEY');
export const TENANT_ID = '8c8bc128-02a4-4577-947b-a777e8ce6b9f';

export async function rest(pathname, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${pathname} :: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

// ─── Brand ────────────────────────────────────────────────────────────────
export const PHONE = '+65 8713 6540';
export const PHONE_TEL = '+6587136540';
export const WHATSAPP_URL = 'https://wa.me/6587136540';
export const EMAIL = 'TODO_EMAIL';
export const BRAND = 'Free Bird SG';

export const NAVY = '#0f172a';
export const GREEN = '#22c55e';

let seq = 0;
export const bid = (type) => `${type}-fb${(seq++).toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Block scaffold with sane layout defaults so seeds stay readable. */
export function blk(type, data, opts = {}) {
  return {
    id: bid(type),
    type,
    order: opts.order ?? 0,
    visible: true,
    width: opts.width ?? 'full',
    padding: opts.padding ?? { top: 88, right: 0, bottom: 88, left: 0 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    background: opts.background ?? { type: 'none' },
    ...(opts.templateVariant ? { templateVariant: opts.templateVariant } : {}),
    ...(opts.animation ? { animation: opts.animation } : {}),
    data,
  };
}

export function orderBlocks(blocks) {
  return blocks.map((b, i) => ({ ...b, order: i + 1 }));
}

export async function upsertPage({ slug, title, blocks, seoTitle, seoDescription, keywords, orderIndex }) {
  const existing = await rest(
    `pages?tenant_id=eq.${TENANT_ID}&slug=eq.${slug}&status=eq.published&select=id`,
  );
  const payload = {
    tenant_id: TENANT_ID,
    slug,
    title,
    type: 'page',
    status: 'published',
    blocks: orderBlocks(blocks),
    seo: {
      title: seoTitle,
      description: seoDescription,
      ...(keywords ? { keywords } : {}),
      og_title: seoTitle,
      og_description: seoDescription,
    },
    ...(orderIndex != null ? { order_index: orderIndex } : {}),
    updated_at: new Date().toISOString(),
  };
  if (existing.length) {
    await rest(`pages?id=eq.${existing[0].id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    return { slug, action: 'updated', id: existing[0].id };
  }
  const created = await rest('pages', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      ...payload,
      settings: { show_header: true, show_footer: true },
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }),
  });
  return { slug, action: 'created', id: created[0].id };
}
