import { rest, TENANT_ID, NAVY, GREEN } from './_lib.mjs';
import { GLOBAL_HEADER, GLOBAL_FOOTER } from './_content.mjs';

// Dark navy / charcoal base with an electric-green accent, overriding the
// build-right template's orange. `color_overrides` merges over the template
// palette in (site)/layout.tsx, so only the keys we care about are listed.
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

const res = await rest(`site_identity?tenant_id=eq.${TENANT_ID}`, {
  method: 'PATCH',
  headers: { Prefer: 'return=representation' },
  body: JSON.stringify({
    site_name: 'Free Bird SG',
    tagline: 'Professional Electrical Services in Singapore',
    primary_color: GREEN,
    secondary_color: NAVY,
    color_overrides: PALETTE,
    global_header: GLOBAL_HEADER,
    global_footer: GLOBAL_FOOTER,
    updated_at: new Date().toISOString(),
  }),
});

console.log('IDENTITY updated:', res.map((r) => ({
  site_name: r.site_name,
  primary: r.color_overrides?.primary,
  header: r.global_header?.type,
  footer: r.global_footer?.type,
})));
