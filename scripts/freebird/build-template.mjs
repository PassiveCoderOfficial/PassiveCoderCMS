import { rest, TENANT_ID, NAVY, GREEN } from './_lib.mjs';

const SOURCE_ID = 'a3e796d4-ec63-488d-bd02-f809a9afb154'; // build-right (shared by 8 tenants)
const SLUG = 'free-bird-sg';

// The shared build-right custom_css hardcodes #ea580c and paints
// .service-card on a near-black background, which fights the navy/green
// brand and renders dark-on-dark. We clone the template rather than edit the
// shared row — 8 other tenants use it — and rewrite those rules.
const CUSTOM_CSS = `
    .template-free-bird-sg h1,.template-free-bird-sg h2 { font-weight: 800; letter-spacing: -0.03em; }
    .template-free-bird-sg .service-card { border-left: 4px solid ${GREEN}; background: hsl(var(--card)); }
    .template-free-bird-sg .stat-value { color: ${GREEN}; font-weight: 900; font-size: 2.5rem; }
    .template-free-bird-sg .nav-bar { background: ${NAVY}; border-bottom: 1px solid #1e293b; }
    .template-free-bird-sg .hero-badge { background: ${GREEN}; color: #052e16; font-weight: 700; letter-spacing: 0.05em; font-size: 0.75rem; }
`.trim();

const PALETTE = {
  primary: GREEN,
  primaryFg: '#052e16',
  secondary: NAVY,
  accent: '#4ade80',
  background: '#ffffff',
  foreground: '#0f172a',
  muted: '#f1f5f9',
  mutedFg: '#475569',
  card: '#ffffff',
  border: '#e2e8f0',
  ring: GREEN,
  borderRadius: '0.75rem',
};

const [src] = await rest(`templates?id=eq.${SOURCE_ID}&select=*`);

const existing = await rest(`templates?slug=eq.${SLUG}&select=id`);

const payload = {
  ...src,
  id: undefined,
  slug: SLUG,
  name: 'Free Bird SG',
  description: 'Electrical-led property services template for Free Bird SG.',
  palette: PALETTE,
  custom_css: CUSTOM_CSS,
  typography: {
    ...(src.typography ?? {}),
    headingFont: 'Inter',
    bodyFont: 'Inter',
    headingWeight: '800',
    letterSpacing: '-0.02em',
  },
  accent_color: GREEN,
  featured: false,
  active: false,        // private to this tenant, not offered in the picker
  has_demo: false,
  source_tenant_id: TENANT_ID,
  // The clone must not carry the source template's header/footer/nav: this
  // tenant's are already set on site_identity and are the source of truth.
  global_header: null,
  global_footer: null,
  nav_items: null,
  created_at: undefined,
  updated_at: new Date().toISOString(),
};
delete payload.id;
delete payload.created_at;

let templateId;
if (existing.length) {
  templateId = existing[0].id;
  await rest(`templates?id=eq.${templateId}`, { method: 'PATCH', body: JSON.stringify(payload) });
  console.log('template updated', SLUG, templateId);
} else {
  const [created] = await rest('templates', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ ...payload, created_at: new Date().toISOString() }),
  });
  templateId = created.id;
  console.log('template created', SLUG, templateId);
}

await rest(`site_identity?tenant_id=eq.${TENANT_ID}`, {
  method: 'PATCH',
  body: JSON.stringify({
    template_id: templateId,
    active_template_slug: SLUG,
    color_overrides: PALETTE,
    updated_at: new Date().toISOString(),
  }),
});
console.log('tenant pointed at', SLUG);

// Guard: the shared template must be untouched.
const [check] = await rest(`templates?id=eq.${SOURCE_ID}&select=slug,palette,custom_css`);
const intact = check.palette?.primary === '#ea580c' && check.custom_css.includes('#ea580c');
console.log(intact ? 'shared build-right INTACT (8 tenants safe)' : 'WARNING: shared template modified!');
